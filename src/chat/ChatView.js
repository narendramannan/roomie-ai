import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BackIcon, SendIcon } from '../icons';

const ChatView = ({ currentUserData }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    let chatListeners = [];
    let isMounted = true;
    
    const fetchMatches = async () => {
      if (!currentUserData.matches || currentUserData.matches.length === 0) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }
      
      try {
        // Fetch user data for matches
        const matchPromises = currentUserData.matches.map(uid => getDoc(doc(db, "users", uid)));
        const matchDocs = await Promise.all(matchPromises);
        const matchData = matchDocs.filter(doc => doc.exists()).map(doc => ({ uid: doc.id, ...doc.data() }));
        
        // Set initial matches
        if (isMounted) {
          setMatches(matchData);
          setLoading(false);
        }
        
        // Set up real-time listeners for chat updates
        chatListeners = matchData.map(match => {
          const chatDocId = [currentUserData.uid, match.uid].sort().join('_');
          return onSnapshot(doc(db, "chats", chatDocId), (chatDoc) => {
            if (isMounted) {
              setMatches(prevMatches => 
                prevMatches.map(m => {
                  if (m.uid === match.uid) {
                    const unreadCount = chatDoc.exists() && chatDoc.data().unreadCounts ? 
                      (chatDoc.data().unreadCounts[currentUserData.uid] || 0) : 0;
                    return { ...m, unreadCount };
                  }
                  return m;
                })
              );
            }
          });
        });
      } catch (error) {
        console.error('Error fetching matches:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchMatches();
    
    // Cleanup function
    return () => {
      isMounted = false;
      chatListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from chat listener:', error);
          }
        }
      });
    };
  }, [currentUserData.matches, currentUserData.uid]);

  if (selectedChat) {
    return <ChatWindow currentUserData={currentUserData} matchData={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  if (loading) return <p className="p-4">Loading chats...</p>;
  if (matches.length === 0) return <p className="text-center text-gray-500 mt-10 p-4">You have no matches yet. Keep swiping!</p>;

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-2xl font-bold mb-4">Matches</h2>
      {matches.map(match => (
        <div key={match.uid} onClick={() => setSelectedChat(match)} className="flex items-center p-3 bg-gray-100 rounded-lg space-x-4 cursor-pointer hover:bg-gray-200 transition-colors">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">{match.name.charAt(0)}</div>
          <div className="flex-1">
            <p className="font-semibold">{match.name}</p>
            <p className="text-sm text-gray-500">Open chat</p>
          </div>
          {/* Unread message indicator */}
          {match.unreadCount > 0 && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {match.unreadCount > 99 ? '99+' : match.unreadCount}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ChatWindow = ({ currentUserData, matchData, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatDocId = [currentUserData.uid, matchData.uid].sort().join('_');

  useEffect(() => {
    const messagesRef = collection(db, `chats/${chatDocId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatDocId]);

  // Reset unread count when chat is opened
  useEffect(() => {
    const resetUnreadCount = async () => {
      try {
        const chatDocRef = doc(db, "chats", chatDocId);
        await updateDoc(chatDocRef, {
          [`unreadCounts.${currentUserData.uid}`]: 0
        });
        console.log('✅ Unread count reset to 0 for user:', currentUserData.uid);
      } catch (error) {
        console.error('Error resetting unread count:', error);
      }
    };

    resetUnreadCount();
  }, [chatDocId, currentUserData.uid]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    setLoading(true);
    
    try {
      console.log('📤 Sending message to:', matchData.uid, 'from:', currentUserData.uid);
      
      // Create the message first
      const messagesRef = collection(db, `chats/${chatDocId}/messages`);
      const messageDoc = await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUserData.uid,
        timestamp: serverTimestamp()
      });
      console.log('✅ Message created with ID:', messageDoc.id);
      
      // Update chat document with unread count for recipient
      const chatDocRef = doc(db, "chats", chatDocId);
      console.log('📝 Updating chat document:', chatDocId, 'with unread count for:', matchData.uid);
      
      // First, get the current chat document to see if it exists
      const chatDoc = await getDoc(chatDocRef);
      let currentUnreadCounts = {};
      
      if (chatDoc.exists()) {
        currentUnreadCounts = chatDoc.data().unreadCounts || {};
      }
      
      // Initialize unread counts for both users if they don't exist
      if (!currentUnreadCounts[currentUserData.uid]) {
        currentUnreadCounts[currentUserData.uid] = 0;
      }
      if (!currentUnreadCounts[matchData.uid]) {
        currentUnreadCounts[matchData.uid] = 0;
      }
      
      // Increment the recipient's unread count
      currentUnreadCounts[matchData.uid] += 1;
      
      await setDoc(chatDocRef, {
        users: [currentUserData.uid, matchData.uid],
        lastMessageTimestamp: serverTimestamp(),
        unreadCounts: currentUnreadCounts
      }, { merge: true });
      
      console.log('✅ Message sent and unread count incremented for:', matchData.uid);
      console.log('📊 Updated unread counts:', currentUnreadCounts);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
    
    setNewMessage('');
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center p-4 border-b">
        <button onClick={onBack} className="mr-4"><BackIcon /></button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">{matchData.name.charAt(0)}</div>
        <h3 className="font-semibold ml-3">{matchData.name}</h3>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUserData.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === currentUserData.uid ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <div className="text-sm">{msg.text}</div>
              {msg.timestamp && (
                <div className={`text-xs mt-1 ${msg.senderId === currentUserData.uid ? 'text-rose-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center space-x-2">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400" />
        <button type="submit" disabled={loading} className="p-3 rounded-full bg-rose-500 text-white disabled:bg-rose-300"><SendIcon /></button>
      </form>
    </div>
  );
};

export default ChatView;

