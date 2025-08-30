import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import * as Sentry from '@sentry/react';
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import useAuth from './auth/useAuth';
import AuthView from './auth/AuthView';
import MatchView from './matching/MatchView';
import ChatView from './chat/ChatView';
import { db } from './firebase/init';
import { playNotificationSound } from './notifications/notifications';
import OnboardingScreen from './onboarding/OnboardingScreen';
import Footer from './layout/Footer';
import ProfileScreen from './profile/ProfileScreen';
import { useTheme } from './theme';
import PageTransition from './animations/PageTransition';

// --- Main App Component ---
export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const { user, userData, loading } = useAuth();
  const theme = useTheme();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasNewMatch, setHasNewMatch] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (location.pathname === '/chats' && hasNewMatch) {
      setHasNewMatch(false);
      sessionStorage.removeItem('newMatch');
    }
  }, [location.pathname, hasNewMatch]);

  const handleProfileUpdate = async (newData, options = {}) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, newData, { merge: true });
      if (!options.skipNavigate) {
        navigate('/matches');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Sentry.captureException(error);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{
          backgroundColor: theme.colors.background,
          fontFamily: theme.typography.fonts.body,
        }}
      >
        <div
          style={{
            fontSize: theme.typography.sizes.heading,
            fontWeight: theme.typography.weights.bold,
          }}
        >
          Loading Your Perfect Match...
        </div>
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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fonts.body,
      }}
    >
      <div
      className="max-w-md mx-auto shadow-lg h-screen flex flex-col"
      style={{ backgroundColor: theme.colors.surface }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/matches" element={<PageTransition><MatchView currentUserData={userData} /></PageTransition>} />
              <Route path="/chats" element={<PageTransition><ChatView currentUserData={userData} /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProfileScreen userData={userData} onProfileUpdate={handleProfileUpdate} /></PageTransition>} />
              <Route path="*" element={<Navigate to="/matches" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer
          unreadMessageCount={unreadMessageCount}
          hasNewMatch={hasNewMatch}
        />
      </div>
    </div>
  );
}



export const Header = () => {
  const theme = useTheme();
  return (
    <header className="flex items-center justify-center p-4 border-b">
      <h1
        style={{
          fontSize: theme.typography.sizes.title,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.primary,
          fontFamily: theme.typography.fonts.heading,
        }}
      >
        RoomieAI
      </h1>
    </header>
  );
};



