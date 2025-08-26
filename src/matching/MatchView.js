import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/init';
import { HeartIcon, XIcon } from '../icons';
import { playNotificationSound } from '../notifications/notifications';
import { useTheme } from '../theme';

export const calculateCompatibility = (userA, userB) => {
  let score = 0;
  const lifestyleA = userA.lifestyle || {};
  const lifestyleB = userB.lifestyle || {};
  const aiA = userA.aiAnalysis || { tags: [] };
  const aiB = userB.aiAnalysis || { tags: [] };
    
    const sleepDiff = Math.abs((lifestyleA.sleep || 5) - (lifestyleB.sleep || 5));
    score += (10 - sleepDiff) * 2.5;
    const cleanDiff = Math.abs((lifestyleA.cleanliness || 5) - (lifestyleB.cleanliness || 5));
    score += (10 - cleanDiff) * 2.5;
    
    const commonTags = aiA.tags.filter(tag => aiB.tags.includes(tag));
    score += (commonTags.length / Math.min(aiA.tags.length, 5)) * 30;
    score += Math.random() * 20;
    
    // Calculate compatibility insights
    const insights = [];
    
    // Sleep compatibility
    if (sleepDiff <= 2) {
      insights.push({ type: 'sleep', text: sleepDiff === 0 ? 'Same Sleep Schedule' : 'Similar Sleep Habits', icon: '🌙' });
    }
    
    // Cleanliness compatibility
    if (cleanDiff <= 2) {
      insights.push({ type: 'cleanliness', text: cleanDiff === 0 ? 'Same Cleanliness Level' : 'Similar Cleanliness Habits', icon: '✨' });
    }
    
    // Social vibe compatibility
    if (lifestyleA.socialVibe === lifestyleB.socialVibe) {
      insights.push({ type: 'social', text: 'Same Social Preferences', icon: '🏠' });
    }
    
    // AI tag compatibility
    if (commonTags.length > 0) {
      insights.push({ type: 'ai', text: `Shared: ${commonTags[0]}`, icon: '🤖' });
    }
    
    return {
      score: Math.min(100, Math.round(score)),
      insights: insights.slice(0, 3) // Show top 3 insights
    };
};

const MatchView = ({ currentUserData }) => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState(null);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const theme = useTheme();

  const calculateCompatibilityMemo = useCallback((userA, userB) => calculateCompatibility(userA, userB), []);

    useEffect(() => {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const usersRef = collection(db, "users");
          const userGenderPrefs = currentUserData.matchingPreferences.gender;
          const q = query(usersRef, where("gender", "in", userGenderPrefs.includes('Open to All') ? ['Man', 'Woman', 'Non-binary'] : userGenderPrefs));
          const querySnapshot = await getDocs(q);

          let fetchedUsers = [];
          querySnapshot.forEach(doc => {
            const otherUserData = { uid: doc.id, ...doc.data() };
            const alreadyInteracted = (currentUserData.likes || []).includes(doc.id) || (currentUserData.passes || []).includes(doc.id);
            const isPreferenceMatch = (otherUserData.matchingPreferences?.gender || []).includes(currentUserData.gender) || (otherUserData.matchingPreferences?.gender || []).includes('Open to All');

            if (doc.id !== currentUserData.uid && !alreadyInteracted && isPreferenceMatch) {
              const compatibility = calculateCompatibilityMemo(currentUserData, otherUserData);
              fetchedUsers.push({ ...otherUserData, compatibility: compatibility.score, compatibilityInsights: compatibility.insights });
            }
          });

          fetchedUsers.sort((a, b) => b.compatibility - a.compatibility);
          setPotentialMatches(fetchedUsers);
          setCurrentIndex(0);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching users:', error);
          Sentry.captureException(error);
          setLoading(false);
        }
      };

    if (currentUserData?.uid && currentUserData?.matchingPreferences) {
      fetchUsers();
    }
  }, [currentUserData, calculateCompatibilityMemo]);

  const handleSwipe = async (swipedUserId, action) => {
    try {
      const userDocRef = doc(db, "users", currentUserData.uid);
      
      // Track swipe in history for undo functionality
      const swipedProfile = potentialMatches[currentIndex];
      setSwipeHistory(prev => [...prev, { profile: swipedProfile, action, timestamp: Date.now() }]);
      
      if (action === 'like') {
        await updateDoc(userDocRef, { likes: arrayUnion(swipedUserId) });
        const swipedUserDoc = await getDoc(doc(db, "users", swipedUserId));
        if (swipedUserDoc.exists() && (swipedUserDoc.data().likes || []).includes(currentUserData.uid)) {
          await updateDoc(userDocRef, { matches: arrayUnion(swipedUserId) });
          await updateDoc(doc(db, "users", swipedUserId), { matches: arrayUnion(currentUserData.uid) });
          setShowMatchModal(swipedUserDoc.data());
          // Set new match flag for notification
          sessionStorage.setItem('newMatch', 'true');
          console.log('💛 New match made! Setting notification flag');
        }
      } else if (action === 'superlike') {
        await updateDoc(userDocRef, { superLikes: arrayUnion(swipedUserId) });
        // Super likes get priority in the other user's queue
        await updateDoc(doc(db, "users", swipedUserId), { 
          superLikedBy: arrayUnion(currentUserData.uid),
          lastSuperLikedAt: serverTimestamp()
        });
      } else {
        await updateDoc(userDocRef, { passes: arrayUnion(swipedUserId) });
      }
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
      Sentry.captureException(error);
    }
  };

  const handleUndo = async () => {
    if (swipeHistory.length > 0 && currentIndex > 0) {
      const lastSwipe = swipeHistory[swipeHistory.length - 1];
      setSwipeHistory(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);

      // Remove the action from Firebase
      const userDocRef = doc(db, "users", currentUserData.uid);
      try {
        if (lastSwipe.action === 'like') {
          await updateDoc(userDocRef, { likes: currentUserData.likes.filter(id => id !== lastSwipe.profile.uid) });
        } else if (lastSwipe.action === 'superlike') {
          await updateDoc(userDocRef, { superLikes: (currentUserData.superLikes || []).filter(id => id !== lastSwipe.profile.uid) });
        } else {
          await updateDoc(userDocRef, { passes: currentUserData.passes.filter(id => id !== lastSwipe.profile.uid) });
        }
      } catch (error) {
        console.error('Error undoing swipe:', error);
        Sentry.captureException(error);
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full p-4">
        <p style={{ color: theme.colors.textPrimary }}>Finding potential roomies...</p>
      </div>
    );
  if (currentIndex >= potentialMatches.length)
    return (
      <div className="flex justify-center items-center h-full p-4 text-center">
        <p className="text-xl" style={{ color: theme.colors.textSecondary }}>
          No more potential roomies right now. Check back later!
        </p>
      </div>
    );

  const currentProfile = potentialMatches[currentIndex];

  return (
    <div
      className="h-full flex flex-col justify-between"
      style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fonts.body,
        color: theme.colors.textPrimary,
      }}
    >
      {showMatchModal && <MatchModal otherUser={showMatchModal} onClose={() => setShowMatchModal(null)} />}
      {showDetailedProfile && (
        <DetailedProfileModal 
          profile={currentProfile} 
          onClose={() => setShowDetailedProfile(false)}
          onSwipe={handleSwipe}
        />
      )}
      <div
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-gray-300 cursor-pointer transform transition-transform hover:scale-[1.02]"
        onClick={() => setShowDetailedProfile(true)}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
          }}
        >
          <span className="text-6xl font-bold text-white">{currentProfile.name.charAt(0)}</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-end">
          <h3 className="text-white text-3xl font-bold">{currentProfile.name}, {currentProfile.age}</h3>
          <p
            className="font-bold text-lg"
            style={{ color: theme.colors.success }}
          >
            {currentProfile.compatibility}% Match
          </p>
          
          {/* Compatibility Insights */}
          {currentProfile.compatibilityInsights && currentProfile.compatibilityInsights.length > 0 && (
            <div className="mt-2 space-y-1">
              {currentProfile.compatibilityInsights.map((insight, index) => (
                <div key={index} className="flex items-center text-white/90 text-sm">
                  <span className="mr-2">{insight.icon}</span>
                  <span className="font-medium">{insight.text}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {(currentProfile.aiAnalysis?.tags || []).slice(0,3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Tap to view more indicator */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-xs font-medium">Tap to view more</span>
          </div>
        </div>
      </div>
      {/* Undo Button */}
      {swipeHistory.length > 0 && (
        <div className="flex justify-center mb-2">
          <button
            onClick={handleUndo}
            className="px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
            Undo
          </button>
        </div>
      )}
      
      <div className="flex justify-center items-center gap-6 py-4">
        <button
          onClick={() => handleSwipe(currentProfile.uid, 'pass')}
          className="p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.danger }}
        >
          <XIcon className="w-10 h-10" />
        </button>
        <button
          onClick={() => handleSwipe(currentProfile.uid, 'superlike')}
          className="p-5 rounded-full shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.accent }}
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
        <button
          onClick={() => handleSwipe(currentProfile.uid, 'like')}
          className="p-6 rounded-full shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.success }}
        >
          <HeartIcon className="w-12 h-12" />
        </button>
      </div>
    </div>
  );
};

const MatchModal = ({ otherUser, onClose }) => {
  const theme = useTheme();
  useEffect(() => {
    playNotificationSound();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl p-8 text-center shadow-xl transform transition-all scale-100 opacity-100"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h2
          className="text-3xl font-bold text-transparent bg-clip-text"
          style={{ background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
        >
          It's a Match!
        </h2>
        <p className="mt-2" style={{ color: theme.colors.textSecondary }}>
          You and {otherUser.name} have liked each other.
        </p>
        <div className="flex justify-center items-center my-6 space-x-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
          >
            Y
          </div>
          <HeartIcon className="w-10 h-10" style={{ color: theme.colors.accent }} />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
          >
            {otherUser.name.charAt(0)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-lg font-semibold"
          style={{
            backgroundColor: theme.colors.accent,
            color: theme.colors.surface,
            padding: theme.spacing.md,
          }}
        >
          Keep Swiping
        </button>
      </div>
    </div>
  );
};

const DetailedProfileModal = ({ profile, onClose, onSwipe }) => {
  const theme = useTheme();
  const getLifestyleText = (type, value) => {
    switch (type) {
      case 'sleep':
        return value <= 3 ? 'Early Bird' : value <= 7 ? 'Balanced' : 'Night Owl';
      case 'cleanliness':
        return value <= 3 ? 'Very Tidy' : value <= 7 ? 'Balanced' : 'Laid Back';
      case 'socialVibe':
        return {
          'quiet_sanctuary': 'Quiet Sanctuary',
          'occasional_friends': 'Occasional Friends',
          'social_hub': 'Social Hub'
        }[value] || value;
      default:
        return value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
        style={{ backgroundColor: theme.colors.surface }}
      >
        {/* Header */}
        <div
          className="relative p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-5xl">
              {profile.name.charAt(0)}
            </div>
            <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
            <p className="text-lg" style={{ color: theme.colors.secondary }}>
              {profile.compatibility}% Match
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* About Me */}
          {profile.aboutMe && (
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: theme.colors.textPrimary }}
              >
                About Me
              </h3>
              <p className="leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                {profile.aboutMe}
              </p>
            </div>
          )}

          {/* AI Analysis */}
          {profile.aiAnalysis && (
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: theme.colors.textPrimary }}
              >
                AI Personality Analysis
              </h3>
              <p className="mb-3" style={{ color: theme.colors.textSecondary }}>
                {profile.aiAnalysis.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.aiAnalysis.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle */}
          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: theme.colors.textPrimary }}
            >
              Lifestyle
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: theme.colors.textSecondary }}>Sleep Schedule:</span>
                <span className="font-medium">{getLifestyleText('sleep', profile.lifestyle?.sleep)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.colors.textSecondary }}>Cleanliness:</span>
                <span className="font-medium">{getLifestyleText('cleanliness', profile.lifestyle?.cleanliness)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.colors.textSecondary }}>Social Vibe:</span>
                <span className="font-medium">{getLifestyleText('socialVibe', profile.lifestyle?.socialVibe)}</span>
              </div>
            </div>
          </div>

          {/* Personal Questions */}
          {(profile.idealWeekend || profile.importantInRoommate) && (
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: theme.colors.textPrimary }}
              >
                Personal Insights
              </h3>
              <div className="space-y-3">
                {profile.idealWeekend && (
                  <div>
                    <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                      My ideal weekend at home is...
                    </p>
                    <p style={{ color: theme.colors.textPrimary }}>{profile.idealWeekend}</p>
                  </div>
                )}
                {profile.importantInRoommate && (
                  <div>
                    <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                      The most important thing in a roommate is...
                    </p>
                    <p style={{ color: theme.colors.textPrimary }}>{profile.importantInRoommate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compatibility Insights */}
          {profile.compatibilityInsights && profile.compatibilityInsights.length > 0 && (
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: theme.colors.textPrimary }}
              >
                Why You're a Great Match
              </h3>
              <div className="space-y-2">
                {profile.compatibilityInsights.map((insight, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-2xl mr-3">{insight.icon}</span>
                    <span className="font-medium" style={{ color: theme.colors.success }}>
                      {insight.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t flex gap-3" style={{ backgroundColor: theme.colors.background }}>
          <button
            onClick={() => onSwipe(profile.uid, 'pass')}
            className="flex-1 p-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.textSecondary}`,
              color: theme.colors.danger,
            }}
          >
            <XIcon className="w-6 h-6 mx-auto" />
          </button>
          <button
            onClick={() => onSwipe(profile.uid, 'like')}
            className="flex-1 p-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
            style={{ backgroundColor: theme.colors.accent, color: theme.colors.surface }}
          >
            <HeartIcon className="w-12 h-12 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchView;

