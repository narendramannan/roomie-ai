import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import useAuth from './auth/useAuth';
import AuthView from './auth/AuthView';
import MatchView from './matching/MatchView';
import ChatView from './chat/ChatView';
import { auth, db } from './firebase';
import { HeartIcon, ChatIcon, UserIcon } from './icons';
import { playNotificationSound } from './notifications/notifications';

// --- Main App Component ---
export default function App() {
  const { user, userData, loading } = useAuth();
  const [currentView, setCurrentView] = useState('match');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasNewMatch, setHasNewMatch] = useState(false);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    if (!user?.uid) return;
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let totalUnread = 0;
      querySnapshot.forEach((docSnap) => {
        const chatData = docSnap.data();
        if (chatData.unreadCounts && chatData.unreadCounts[user.uid]) {
          const count = parseInt(chatData.unreadCounts[user.uid]) || 0;
          if (count >= 0) {
            totalUnread += count;
          }
        }
      });
      if (totalUnread > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
        playNotificationSound();
      }
      prevUnreadCountRef.current = totalUnread;
      setUnreadMessageCount(totalUnread);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const newMatchFlag = sessionStorage.getItem('newMatch');
    if (newMatchFlag === 'true') {
      setHasNewMatch(true);
    }
  }, []);

  const handleProfileUpdate = async (newData) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, newData, { merge: true });
      setCurrentView('match');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    if (newView === 'chats' && hasNewMatch) {
      setHasNewMatch(false);
      sessionStorage.removeItem('newMatch');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold">Loading Your Perfect Match...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (!userData?.lifestyle) {
    return <OnboardingScreen onProfileUpdate={handleProfileUpdate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto bg-white shadow-lg h-screen flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'match' && <MatchView currentUserData={userData} />}
          {currentView === 'chats' && <ChatView currentUserData={userData} />}
          {currentView === 'profile' && (
            <ProfileScreen userData={userData} onProfileUpdate={handleProfileUpdate} />
          )}
        </main>
        <Footer
          currentView={currentView}
          setCurrentView={handleViewChange}
          unreadMessageCount={unreadMessageCount}
          hasNewMatch={hasNewMatch}
        />
      </div>
    </div>
  );
}

const OnboardingScreen = ({ onProfileUpdate }) => {
    // Same as before, no major changes needed here for production-readiness logic
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', age: '', gender: 'Man', matchingPreferences: { gender: ['Woman'] },
        lifestyle: { sleep: 5, cleanliness: 5, socialVibe: 'occasional_friends', workSchedule: 'away' },
        aiAnalysis: { description: '', tags: [] },
        aboutMe: '',
        idealWeekend: '',
        importantInRoommate: '',
        photos: [], likes: [], passes: [], matches: [],
    });
    const [aiLoading, setAiLoading] = useState(false);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);
    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleLifestyleChange = (e) => setFormData(p => ({ ...p, lifestyle: { ...p.lifestyle, [e.target.name]: e.target.value } }));
    const handleGenderPrefChange = (gender) => {
        setFormData(prev => {
            const currentPrefs = prev.matchingPreferences.gender;
            const newPrefs = currentPrefs.includes(gender)
                ? currentPrefs.filter(g => g !== gender)
                : [...currentPrefs, gender];
            return { ...prev, matchingPreferences: { ...prev.matchingPreferences, gender: newPrefs } };
        });
    };
    const simulateAIAnalysis = async () => {
        setAiLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        const mockAnalysis = {
            description: "Based on your photos, you seem to have an appreciation for nature and a calm, friendly demeanor. You likely enjoy both quiet evenings and occasional outings.",
            tags: ["Nature-Lover", "Friendly", "Calm", "Social"],
        };
        setFormData(prev => ({ ...prev, aiAnalysis: mockAnalysis }));
        setAiLoading(false);
        handleNext();
    };
    const handleSubmit = () => onProfileUpdate(formData);

    // The renderStep function and its contents remain largely the same.
    // For brevity, it is not repeated here but would be included in the full file.
    // A more realistic photo upload UI is added in step 4.
    const renderStep = () => {
        switch (step) {
             case 1: return ( <div className="space-y-4"> <h3 className="text-2xl font-bold">About You</h3> <input name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="w-full p-3 border rounded-lg" /> <input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Your Age" className="w-full p-3 border rounded-lg" /> <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded-lg"> <option>Man</option> <option>Woman</option> <option>Non-binary</option> </select> <button onClick={handleNext} className="w-full p-3 bg-rose-500 text-white rounded-lg font-semibold">Next</button> </div> );
            case 2: return ( <div className="space-y-4"> <h3 className="text-2xl font-bold">Who are you looking for?</h3> <p className="text-gray-600">Select all that apply.</p> {['Man', 'Woman', 'Non-binary', 'Open to All'].map(g => ( <button key={g} onClick={() => handleGenderPrefChange(g)} className={`w-full p-3 border rounded-lg font-semibold ${formData.matchingPreferences.gender.includes(g) ? 'bg-rose-500 text-white' : 'bg-white'}`}> {g} </button> ))} <div className="flex justify-between"> <button onClick={handleBack} className="w-1/3 p-3 bg-gray-300 text-black rounded-lg font-semibold">Back</button> <button onClick={handleNext} className="w-1/3 p-3 bg-rose-500 text-white rounded-lg font-semibold">Next</button> </div> </div> );
            case 3: return ( <div className="space-y-6"> <h3 className="text-2xl font-bold">Your Lifestyle</h3> <div> <label className="block font-semibold">Sleep Schedule</label> <div className="flex justify-between text-sm text-gray-500"><span>Early Bird</span><span>Night Owl</span></div> <input type="range" min="1" max="10" name="sleep" value={formData.lifestyle.sleep} onChange={handleLifestyleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500" /> </div> <div> <label className="block font-semibold">Cleanliness</label> <div className="flex justify-between text-sm text-gray-500"><span>Very Tidy</span><span>Laid Back</span></div> <input type="range" min="1" max="10" name="cleanliness" value={formData.lifestyle.cleanliness} onChange={handleLifestyleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500" /> </div> <div> <label className="block font-semibold">Social Vibe</label> <select name="socialVibe" value={formData.lifestyle.socialVibe} onChange={handleLifestyleChange} className="w-full p-3 border rounded-lg"> <option value="quiet_sanctuary">My home is a quiet sanctuary</option> <option value="occasional_friends">I have friends over occasionally</option> <option value="social_hub">My home is a social hub</option> </select> </div> <div className="flex justify-between"> <button onClick={handleBack} className="w-1/3 p-3 bg-gray-300 text-black rounded-lg font-semibold">Back</button> <button onClick={handleNext} className="w-1/3 p-3 bg-rose-500 text-white rounded-lg font-semibold">Next</button> </div> </div> );
            case 4: return (
                    <div className="space-y-4 text-center">
                        <h3 className="text-2xl font-bold">Upload Your Photos</h3>
                        <p className="text-gray-600">Our AI will analyze them to find better matches.</p>
                        <label htmlFor="photo-upload" className="cursor-pointer block p-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
                            <p className="text-gray-500">Click to select photos (simulation)</p>
                        </label>
                        <input id="photo-upload" type="file" multiple className="hidden" />
                        {aiLoading ? ( <div className="flex items-center justify-center space-x-2 pt-4"> <div className="w-4 h-4 rounded-full bg-rose-500 animate-pulse"></div> <p>AI is analyzing...</p> </div> ) : ( <button onClick={simulateAIAnalysis} className="w-full p-3 bg-rose-500 text-white rounded-lg font-semibold">Analyze My "Photos"</button> )}
                        <button onClick={handleBack} className="w-full p-3 mt-2 bg-gray-300 text-black rounded-lg font-semibold">Back</button>
                    </div>
                );
            case 5: return (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Tell Us About Yourself</h3>
                    <p className="text-gray-600">Help potential roomies get to know the real you!</p>
                    
                    <div>
                        <label className="block font-semibold mb-2">About Me</label>
                        <textarea 
                            name="aboutMe" 
                            value={formData.aboutMe} 
                            onChange={handleChange} 
                            placeholder="Describe yourself, your interests, what you're looking for in a roommate..."
                            className="w-full p-3 border rounded-lg h-24 resize-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block font-semibold mb-2">My ideal weekend at home is...</label>
                        <textarea 
                            name="idealWeekend" 
                            value={formData.idealWeekend} 
                            onChange={handleChange} 
                            placeholder="Quiet reading, hosting friends, cooking, gaming..."
                            className="w-full p-3 border rounded-lg h-20 resize-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block font-semibold mb-2">The most important thing in a roommate is...</label>
                        <textarea 
                            name="importantInRoommate" 
                            value={formData.importantInRoommate} 
                            onChange={handleChange} 
                            placeholder="Communication, respect for space, similar lifestyle..."
                            className="w-full p-3 border rounded-lg h-20 resize-none"
                        />
                    </div>
                    
                    <div className="flex justify-between">
                        <button onClick={handleBack} className="w-1/3 p-3 bg-gray-300 text-black rounded-lg font-semibold">Back</button>
                        <button onClick={handleNext} className="w-1/3 p-3 bg-rose-500 text-white rounded-lg font-semibold">Next</button>
                    </div>
                </div>
            );
            case 6: return ( <div className="space-y-4"> <h3 className="text-2xl font-bold">AI Personality Review</h3> <p className="text-gray-600">Here's what our AI thinks. You can edit these before saving.</p> <div className="p-4 bg-gray-100 rounded-lg"> <p className="font-semibold">AI Description:</p> <p className="text-gray-700">{formData.aiAnalysis.description}</p> </div> <div className="p-4 bg-gray-1 rounded-lg"> <p className="font-semibold">AI Personality Tags:</p> <div className="flex flex-wrap gap-2 mt-2"> {formData.aiAnalysis.tags.map(tag => <span key={tag} className="px-3 py-1 bg-rose-200 text-rose-800 rounded-full text-sm">{tag}</span>)} </div> </div> <p className="text-xs text-gray-500 text-center">In a real app, you could edit these tags.</p> <button onClick={handleSubmit} className="w-full p-3 bg-green-500 text-white rounded-lg font-semibold">Looks Good! Finish Profile</button> <button onClick={handleBack} className="w-full p-3 mt-2 bg-gray-300 text-black rounded-lg font-semibold">Back</button> </div> );
            default: return null;
        }
    };
    return ( <div className="flex items-center justify-center h-screen bg-gray-100"> <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg"> <div className="relative h-2 bg-gray-200 rounded-full mb-8"> <div className="absolute top-0 left-0 h-2 bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }}></div> </div> {renderStep()} </div> </div> );
};


const Header = () => (<header className="flex items-center justify-center p-4 border-b"><h1 className="text-2xl font-bold text-rose-500">RoomieAI</h1></header>);

const Footer = ({ currentView, setCurrentView, unreadMessageCount, hasNewMatch }) => {
    console.log('🔔 Footer render - unreadMessageCount:', unreadMessageCount, 'hasNewMatch:', hasNewMatch);
    
    const testNotification = () => {
        console.log('🧪 Testing notification system...');
        playNotificationSound();
        console.log('Current state - unreadMessageCount:', unreadMessageCount, 'hasNewMatch:', hasNewMatch);
    };
    
    const navItems = [
        { 
            name: 'match', 
            icon: <HeartIcon className={`w-7 h-7 ${currentView === 'match' ? 'text-rose-500' : 'text-gray-400'}`} />,
            showNotification: hasNewMatch
        },
        { 
            name: 'chats', 
            icon: <ChatIcon className={`w-7 h-7 ${currentView === 'chats' ? 'text-rose-500' : 'text-gray-400'}`} />,
            showNotification: unreadMessageCount > 0,
            notificationCount: unreadMessageCount
        },
        { 
            name: 'profile', 
            icon: <UserIcon className={`w-7 h-7 ${currentView === 'profile' ? 'text-rose-500' : 'text-gray-400'}`} />,
            showNotification: false
        },
    ];

    return (
        <footer className="flex justify-around p-2 border-t bg-white">
            {navItems.map(item => (
                <button key={item.name} onClick={() => setCurrentView(item.name)} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                    {item.icon}
                    {/* New Match Indicator */}
                    {item.showNotification && item.name === 'match' && (
                        <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-yellow-500 notification-pulse notification-bubble"></span>
                    )}
                    {/* Unread Message Indicator */}
                    {item.showNotification && item.name === 'chats' && (
                        <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full ring-2 ring-white bg-red-500 text-white text-xs font-bold flex items-center justify-center notification-bounce notification-bubble">
                            {item.notificationCount > 99 ? '99+' : item.notificationCount}
                        </span>
                    )}
                </button>
            ))}
            {/* Debug button */}
            <button 
                onClick={testNotification} 
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-xs"
                title="Test notifications"
            >
                🧪
            </button>
        </footer>
    );
};

const ProfileScreen = ({ userData, onProfileUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(userData);

    useEffect(() => {
        setFormData(userData);
    }, [userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onProfileUpdate(formData);
        setIsEditing(false);
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col items-center space-y-2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center text-white font-bold text-4xl">
                    {formData.name.charAt(0)}
                </div>
                {isEditing ? (
                    <input name="name" value={formData.name} onChange={handleChange} className="text-2xl font-bold text-center border-b-2" />
                ) : (
                    <h2 className="text-2xl font-bold">{formData.name}, {formData.age}</h2>
                )}
            </div>
            
            <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">My Details</h3>
                {isEditing ? (
                    <div className="space-y-2">
                        <input name="age" type="number" value={formData.age} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Age" />
                    </div>
                ) : (
                    <p><strong>Age:</strong> {formData.age}</p>
                )}
            </div>

            <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">My AI Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {formData.aiAnalysis.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-rose-200 text-rose-800 rounded-full text-sm">{tag}</span>
                    ))}
                </div>
            </div>

            {isEditing ? (
                <button onClick={handleSave} className="w-full p-3 bg-green-500 text-white rounded-lg font-semibold">Save Changes</button>
            ) : (
                <button onClick={() => setIsEditing(true)} className="w-full p-3 bg-gray-200 rounded-lg font-semibold">Edit Profile</button>
            )}
            <button onClick={() => signOut(auth)} className="w-full p-3 bg-red-500 text-white rounded-lg font-semibold">Log Out</button>
        </div>
    );
};

