import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, updateDoc, arrayUnion, serverTimestamp, addDoc, orderBy } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Icons (as SVGs) ---
const HeartIcon = ({ className = "w-8 h-8" }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>);
const XIcon = ({ className = "w-8 h-8" }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>);
const ChatIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>);
const UserIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>);
const SendIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>);
const BackIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>);


// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('match'); // 'match', 'chats', 'profile'
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                // Use onSnapshot for real-time updates to user data
                const userDocRef = doc(db, "users", authUser.uid);
                const unsubUserData = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setUserData({ uid: authUser.uid, ...doc.data() });
                    } else {
                        setUserData({ uid: authUser.uid }); 
                    }
                    setUser(authUser);
                    setLoading(false);
                });
                return () => unsubUserData();
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleProfileUpdate = async (newData) => {
        if (!user) return;
        try {
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, newData, { merge: true });
            // No need to set state here, onSnapshot will handle it
            setCurrentView('match');
        } catch (error) {
            console.error('Error updating profile:', error);
            // You could add a toast notification here
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Loading Your Perfect Match...</div></div>;
    }

    if (!user) {
        return <AuthScreen />;
    }

    if (!userData?.lifestyle) {
        return <OnboardingScreen onProfileUpdate={handleProfileUpdate} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-md mx-auto bg-white shadow-lg h-screen flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {currentView === 'match' && <MatchScreen currentUserData={userData} />}
                    {currentView === 'chats' && <ChatsScreen currentUserData={userData} />}
                    {currentView === 'profile' && <ProfileScreen userData={userData} onProfileUpdate={handleProfileUpdate} />}
                </main>
                <Footer currentView={currentView} setCurrentView={setCurrentView} />
            </div>
        </div>
    );
}

// --- Screens & Components ---

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-rose-400 to-orange-300">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-gray-800">
                    {isLogin ? 'Welcome Back!' : 'Find Your Roomie'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" required disabled={loading} />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" required disabled={loading} />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors disabled:bg-rose-300" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="ml-1 font-semibold text-rose-500 hover:underline">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

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

const Footer = ({ currentView, setCurrentView }) => {
    const navItems = [
        { name: 'match', icon: <HeartIcon className={`w-7 h-7 ${currentView === 'match' ? 'text-rose-500' : 'text-gray-400'}`} /> },
        { name: 'chats', icon: <ChatIcon className={`w-7 h-7 ${currentView === 'chats' ? 'text-rose-500' : 'text-gray-400'}`} /> },
        { name: 'profile', icon: <UserIcon className={`w-7 h-7 ${currentView === 'profile' ? 'text-rose-500' : 'text-gray-400'}`} /> },
    ];
    return (
        <footer className="flex justify-around p-2 border-t bg-white">
            {navItems.map(item => (
                <button key={item.name} onClick={() => setCurrentView(item.name)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    {item.icon}
                </button>
            ))}
        </footer>
    );
};

const MatchScreen = ({ currentUserData }) => {
    const [potentialMatches, setPotentialMatches] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showMatchModal, setShowMatchModal] = useState(null);
    const [showDetailedProfile, setShowDetailedProfile] = useState(false);
    const [swipeHistory, setSwipeHistory] = useState([]);

    const calculateCompatibility = useCallback((userA, userB) => {
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
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
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
                    const compatibility = calculateCompatibility(currentUserData, otherUserData);
                    fetchedUsers.push({ ...otherUserData, compatibility: compatibility.score, compatibilityInsights: compatibility.insights });
                }
            });

            fetchedUsers.sort((a, b) => b.compatibility - a.compatibility);
            setPotentialMatches(fetchedUsers);
            setCurrentIndex(0);
            setLoading(false);
        };

        if (currentUserData?.uid && currentUserData?.matchingPreferences) {
            fetchUsers();
        }
    }, [currentUserData, calculateCompatibility]);

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
            // You could add a toast notification here
        }
    };

    const handleUndo = () => {
        if (swipeHistory.length > 0 && currentIndex > 0) {
            const lastSwipe = swipeHistory[swipeHistory.length - 1];
            setSwipeHistory(prev => prev.slice(0, -1));
            setCurrentIndex(prev => prev - 1);
            
            // Remove the action from Firebase
            const userDocRef = doc(db, "users", currentUserData.uid);
            if (lastSwipe.action === 'like') {
                updateDoc(userDocRef, { likes: currentUserData.likes.filter(id => id !== lastSwipe.profile.uid) });
            } else if (lastSwipe.action === 'superlike') {
                updateDoc(userDocRef, { superLikes: (currentUserData.superLikes || []).filter(id => id !== lastSwipe.profile.uid) });
            } else {
                updateDoc(userDocRef, { passes: currentUserData.passes.filter(id => id !== lastSwipe.profile.uid) });
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full p-4"><p>Finding potential roomies...</p></div>;
    if (currentIndex >= potentialMatches.length) return <div className="flex justify-center items-center h-full p-4 text-center"><p className="text-xl text-gray-600">No more potential roomies right now. Check back later!</p></div>;

    const currentProfile = potentialMatches[currentIndex];

    return (
        <div className="h-full flex flex-col justify-between p-4">
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
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white">{currentProfile.name.charAt(0)}</span>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-end">
                    <h3 className="text-white text-3xl font-bold">{currentProfile.name}, {currentProfile.age}</h3>
                    <p className="text-green-300 font-bold text-lg">{currentProfile.compatibility}% Match</p>
                    
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
                            <span key={tag} className="px-2 py-1 bg-white/30 text-white rounded-full text-xs font-semibold">{tag}</span>
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
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                        </svg>
                        Undo
                    </button>
                </div>
            )}
            
            <div className="flex justify-center items-center gap-6 py-4">
                <button onClick={() => handleSwipe(currentProfile.uid, 'pass')} className="p-4 rounded-full bg-white shadow-lg text-red-500 hover:scale-110 transition-transform"><XIcon className="w-10 h-10" /></button>
                <button onClick={() => handleSwipe(currentProfile.uid, 'superlike')} className="p-5 rounded-full bg-white shadow-lg text-yellow-500 hover:scale-110 transition-transform">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
                <button onClick={() => handleSwipe(currentProfile.uid, 'like')} className="p-6 rounded-full bg-white shadow-lg text-green-400 hover:scale-110 transition-transform"><HeartIcon className="w-12 h-12" /></button>
            </div>
        </div>
    );
};

const ChatsScreen = ({ currentUserData }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null); // This will hold the match data for the selected chat

    useEffect(() => {
        const fetchMatches = async () => {
            if (!currentUserData.matches || currentUserData.matches.length === 0) {
                setLoading(false);
                return;
            }
            const matchPromises = currentUserData.matches.map(uid => getDoc(doc(db, "users", uid)));
            const matchDocs = await Promise.all(matchPromises);
            const matchData = matchDocs.filter(doc => doc.exists()).map(doc => ({ uid: doc.id, ...doc.data() }));
            setMatches(matchData);
            setLoading(false);
        };
        fetchMatches();
    }, [currentUserData.matches]);

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
                    <div>
                        <p className="font-semibold">{match.name}</p>
                        <p className="text-sm text-gray-500">Open chat</p>
                    </div>
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        setLoading(true);
        
        const messagesRef = collection(db, `chats/${chatDocId}/messages`);
        await addDoc(messagesRef, {
            text: newMessage,
            senderId: currentUserData.uid,
            timestamp: serverTimestamp()
        });
        
        // Also create the chat document if it doesn't exist
        const chatDocRef = doc(db, "chats", chatDocId);
        await setDoc(chatDocRef, { users: [currentUserData.uid, matchData.uid] }, { merge: true });

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
                            {msg.text}
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

const MatchModal = ({ otherUser, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 text-center shadow-xl transform transition-all scale-100 opacity-100">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">It's a Match!</h2>
                <p className="mt-2 text-gray-600">You and {otherUser.name} have liked each other.</p>
                <div className="flex justify-center items-center my-6 space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white shadow-md">
                        {auth.currentUser.displayName ? auth.currentUser.displayName.charAt(0) : 'Y'}
                    </div>
                    <HeartIcon className="w-10 h-10 text-rose-500" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white shadow-md">
                        {otherUser.name.charAt(0)}
                    </div>
                </div>
                <button onClick={onClose} className="w-full p-3 bg-rose-500 text-white rounded-lg font-semibold">Keep Swiping</button>
            </div>
        </div>
    );
};

const DetailedProfileModal = ({ profile, onClose, onSwipe }) => {
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
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-5xl">
                            {profile.name.charAt(0)}
                        </div>
                        <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
                        <p className="text-purple-200 text-lg">{profile.compatibility}% Match</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* About Me */}
                    {profile.aboutMe && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">About Me</h3>
                            <p className="text-gray-600 leading-relaxed">{profile.aboutMe}</p>
                        </div>
                    )}

                    {/* AI Analysis */}
                    {profile.aiAnalysis && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">AI Personality Analysis</h3>
                            <p className="text-gray-600 mb-3">{profile.aiAnalysis.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.aiAnalysis.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lifestyle */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">Lifestyle</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Sleep Schedule:</span>
                                <span className="font-medium">{getLifestyleText('sleep', profile.lifestyle?.sleep)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Cleanliness:</span>
                                <span className="font-medium">{getLifestyleText('cleanliness', profile.lifestyle?.cleanliness)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Social Vibe:</span>
                                <span className="font-medium">{getLifestyleText('socialVibe', profile.lifestyle?.socialVibe)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Personal Questions */}
                    {(profile.idealWeekend || profile.importantInRoommate) && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">Personal Insights</h3>
                            <div className="space-y-3">
                                {profile.idealWeekend && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">My ideal weekend at home is...</p>
                                        <p className="text-gray-700">{profile.idealWeekend}</p>
                                    </div>
                                )}
                                {profile.importantInRoommate && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">The most important thing in a roommate is...</p>
                                        <p className="text-gray-700">{profile.importantInRoommate}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Compatibility Insights */}
                    {profile.compatibilityInsights && profile.compatibilityInsights.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">Why You're a Great Match</h3>
                            <div className="space-y-2">
                                {profile.compatibilityInsights.map((insight, index) => (
                                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                                        <span className="text-2xl mr-3">{insight.icon}</span>
                                        <span className="text-green-800 font-medium">{insight.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t bg-gray-50 flex gap-3">
                    <button 
                        onClick={() => onSwipe(profile.uid, 'pass')} 
                        className="flex-1 p-3 bg-white border border-gray-300 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                    >
                        <XIcon className="w-6 h-6 mx-auto" />
                    </button>
                    <button 
                        onClick={() => onSwipe(profile.uid, 'like')} 
                        className="flex-1 p-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
                    >
                        <HeartIcon className="w-6 h-6 mx-auto" />
                    </button>
                </div>
            </div>
        </div>
    );
};
