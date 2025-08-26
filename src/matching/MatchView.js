import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/init';
import { HeartIcon, XIcon } from '../icons';
import { playNotificationSound } from '../notifications/notifications';
import { useTheme } from '../theme';
import AnimatedButton from '../animations/AnimatedButton';
import Sparkle from '../animations/Sparkle';

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
      const swipedProfile = potentialMatches[currentIndex];

      if (action === 'like') {
        await updateDoc(userDocRef, { likes: arrayUnion(swipedUserId) });
        const swipedUserDoc = await getDoc(doc(db, "users", swipedUserId));
        if (swipedUserDoc.exists() && (swipedUserDoc.data().likes || []).includes(currentUserData.uid)) {
          await updateDoc(userDocRef, { matches: arrayUnion(swipedUserId) });
          await updateDoc(doc(db, "users", swipedUserId), { matches: arrayUnion(currentUserData.uid) });
          setShowMatchModal(swipedUserDoc.data());
          sessionStorage.setItem('newMatch', 'true');
          console.log('💛 New match made! Setting notification flag');
        }
      } else {
        await updateDoc(userDocRef, {
          [action === 'superlike' ? 'superLikes' : 'passes']: arrayUnion(swipedUserId)
        });
        if (action === 'superlike') {
          await updateDoc(doc(db, "users", swipedUserId), {
            superLikedBy: arrayUnion(currentUserData.uid),
            lastSuperLikedAt: serverTimestamp()
          });
        }
      }

      setCurrentIndex(prev => prev + 1);
      setShowDetailedProfile(false);
    } catch (error) {
      console.error('Error handling swipe:', error);
      Sentry.captureException(error);
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
      data-testid="match-view"
      className="h-full overflow-y-auto"
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

      <div className="max-w-md mx-auto w-full">
        {/* Hero Section */}
        <div
          className="flex flex-col items-center text-center"
          style={{ marginBottom: theme.spacing.lg }}
        >
          <div
            className="w-32 h-32 rounded-full overflow-hidden shadow-lg"
            style={{ backgroundColor: theme.colors.surface }}
          >
            {currentProfile.photoURL ? (
              <img
                src={currentProfile.photoURL}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl font-bold"
                style={{ color: theme.colors.textSecondary }}
              >
                {currentProfile.name.charAt(0)}
              </div>
            )}
          </div>
          <h2
            className="mt-4 text-2xl font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            Meet {currentProfile.name}
          </h2>
          <AnimatedButton
            onClick={() => setShowDetailedProfile(true)}
            className="mt-4 px-6 py-3 rounded-full font-semibold"
            style={{ backgroundColor: theme.colors.accent, color: theme.colors.surface }}
          >
            View Profile
          </AnimatedButton>
        </div>

        {/* AI Tip */}
        <section
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.colors.surface, marginBottom: theme.spacing.md }}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            AI Tip
          </h3>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {currentProfile.compatibilityInsights?.[0]?.text || 'Complete your profile to receive tailored tips.'}
          </p>
        </section>

        {/* Community Buzz */}
        <section
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.colors.surface, marginBottom: theme.spacing.md }}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Community Buzz
          </h3>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {potentialMatches.length} roomies currently looking for a match.
          </p>
        </section>

        {/* Daily Quests */}
        <section
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Daily Quests
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: theme.colors.textSecondary }}>
            <li>✨ Update your preferences</li>
            <li>💬 Say hi to a match</li>
            <li>🏠 Check out new listings</li>
          </ul>
        </section>
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
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: `${theme.colors.textPrimary}80` }}
    >
      <div
        className="rounded-2xl p-8 text-center shadow-xl transform transition-all scale-100 opacity-100 relative"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Sparkle />
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
            className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl shadow-md"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})`,
              color: theme.colors.surface,
              boxShadow: `0 0 0 4px ${theme.colors.surface}`
            }}
          >
            Y
          </div>
          <HeartIcon className="w-10 h-10" style={{ color: theme.colors.accent }} />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl shadow-md"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              color: theme.colors.surface,
              boxShadow: `0 0 0 4px ${theme.colors.surface}`
            }}
          >
            {otherUser.name.charAt(0)}
          </div>
        </div>
        <AnimatedButton
          onClick={onClose}
          className="w-full rounded-lg font-semibold"
          style={{
            backgroundColor: theme.colors.accent,
            color: theme.colors.surface,
            padding: theme.spacing.md,
          }}
        >
          Keep Swiping
        </AnimatedButton>
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
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: `${theme.colors.textPrimary}80` }}
    >
      <div
        className="rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
        style={{ backgroundColor: theme.colors.surface }}
      >
        {/* Header */}
        <div
          className="relative p-6"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
            color: theme.colors.surface,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4"
            style={{ color: theme.colors.surface, opacity: 0.8 }}
          >
            <XIcon className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div
              className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center font-bold text-5xl"
              style={{ backgroundColor: `${theme.colors.surface}33`, color: theme.colors.surface }}
            >
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
                  <div
                    key={index}
                    className="flex items-center p-3 rounded-lg"
                    style={{ backgroundColor: `${theme.colors.secondary}33` }}
                  >
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

