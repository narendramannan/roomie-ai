// Script to add dummy users to Firebase for testing
// Run this with: node add-dummy-users.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const dummyUsers = [
  {
    email: "sarah@test.com",
    password: "password123",
    name: "Sarah Chen",
    age: 24,
    gender: "Woman",
    matchingPreferences: { gender: ["Man", "Woman"] },
    lifestyle: { sleep: 7, cleanliness: 8, socialVibe: "occasional_friends", workSchedule: "away" },
    aiAnalysis: { 
      description: "Sarah is a creative and organized person who values both personal space and meaningful connections. She enjoys a balanced lifestyle with quiet evenings and occasional social gatherings.",
      tags: ["Creative", "Organized", "Balanced", "Friendly"]
    },
    aboutMe: "Hi! I'm a graphic designer who loves creating beautiful things. I'm looking for a roommate who respects quiet time but is also up for movie nights and cooking together.",
    idealWeekend: "Painting, reading, and maybe a coffee date with friends. I love having people over for dinner but also need my alone time to recharge.",
    importantInRoommate: "Communication and respect for each other's space. I'm pretty clean and organized, so someone with similar habits would be great!"
  },
  {
    email: "mike@test.com",
    password: "password123",
    name: "Mike Rodriguez",
    age: 26,
    gender: "Man",
    matchingPreferences: { gender: ["Woman", "Man"] },
    lifestyle: { sleep: 6, cleanliness: 7, socialVibe: "social_hub", workSchedule: "away" },
    aiAnalysis: { 
      description: "Mike is an outgoing and energetic person who loves bringing people together. He's naturally social but also respects boundaries and personal space.",
      tags: ["Social", "Energetic", "Respectful", "Fun"]
    },
    aboutMe: "Hey there! I'm a software engineer who loves hosting game nights and cooking for friends. I'm looking for someone who enjoys having people over but also values clean living.",
    idealWeekend: "Hosting friends for board games, trying new restaurants, and maybe a hike if the weather's nice. I love making the apartment feel like home.",
    importantInRoommate: "Someone who's clean and communicative. I love having people over but I want to make sure my roommate is comfortable with that too."
  },
  {
    email: "emma@test.com",
    password: "password123",
    name: "Emma Thompson",
    age: 23,
    gender: "Woman",
    matchingPreferences: { gender: ["Woman"] },
    lifestyle: { sleep: 8, cleanliness: 9, socialVibe: "quiet_sanctuary", workSchedule: "away" },
    aiAnalysis: { 
      description: "Emma is a thoughtful and introspective person who values her personal space and quiet environment. She's very organized and appreciates a peaceful home.",
      tags: ["Thoughtful", "Organized", "Peaceful", "Independent"]
    },
    aboutMe: "Hello! I'm a graduate student studying psychology. I'm pretty quiet and love having a peaceful space to study and relax. Looking for a roommate who values quiet time.",
    idealWeekend: "Reading, studying, maybe some yoga, and definitely some alone time. I love having deep conversations but also need my space.",
    importantInRoommate: "Someone who's quiet and respectful of study time. I'm very clean and organized, so someone with similar habits would be perfect."
  },
  {
    email: "alex@test.com",
    password: "password123",
    name: "Alex Kim",
    age: 25,
    gender: "Non-binary",
    matchingPreferences: { gender: ["Open to All"] },
    lifestyle: { sleep: 5, cleanliness: 6, socialVibe: "occasional_friends", workSchedule: "away" },
    aiAnalysis: { 
      description: "Alex is an adaptable and open-minded person who values diversity and meaningful connections. They enjoy a balanced lifestyle with both social and quiet time.",
      tags: ["Adaptable", "Open-minded", "Balanced", "Inclusive"]
    },
    aboutMe: "Hi everyone! I'm a teacher who loves learning about different cultures and perspectives. I'm looking for a roommate who's open-minded and respectful of everyone.",
    idealWeekend: "Exploring new neighborhoods, trying new foods, and maybe having a few friends over. I love learning about different cultures and sharing experiences.",
    importantInRoommate: "Open-mindedness and respect for diversity. I'm pretty flexible with lifestyle differences as long as we can communicate well."
  },
  {
    email: "jake@test.com",
    password: "password123",
    name: "Jake Wilson",
    age: 27,
    gender: "Man",
    matchingPreferences: { gender: ["Woman", "Man"] },
    lifestyle: { sleep: 4, cleanliness: 8, socialVibe: "occasional_friends", workSchedule: "away" },
    aiAnalysis: { 
      description: "Jake is an early bird who values structure and cleanliness. He's friendly and enjoys socializing but also appreciates his morning routine and personal space.",
      tags: ["Early Bird", "Structured", "Clean", "Friendly"]
    },
    aboutMe: "Hey! I'm a fitness trainer who's up early every day. I love keeping things clean and organized, and I'm looking for someone who shares those values.",
    idealWeekend: "Early morning workouts, meal prepping, and maybe catching up with friends. I love having a clean, organized space to come home to.",
    importantInRoommate: "Cleanliness and respect for early morning routines. I'm pretty active and organized, so someone with similar habits would be ideal."
  }
];

async function createDummyUsers() {
  console.log("🚀 Creating dummy users...");
  
  for (const userData of dummyUsers) {
    try {
      console.log(`Creating user: ${userData.name} (${userData.email})`);
      
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        name: userData.name,
        age: userData.age,
        gender: userData.gender,
        matchingPreferences: userData.matchingPreferences,
        lifestyle: userData.lifestyle,
        aiAnalysis: userData.aiAnalysis,
        aboutMe: userData.aboutMe,
        idealWeekend: userData.idealWeekend,
        importantInRoommate: userData.importantInRoommate,
        photos: [],
        likes: [],
        passes: [],
        matches: [],
        superLikes: [],
        superLikedBy: [],
        createdAt: new Date()
      };
      
      await setDoc(doc(db, "users", user.uid), userProfile);
      
      console.log(`✅ Created ${userData.name} successfully!`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
      } else {
        console.log(`❌ Error creating ${userData.name}:`, error.message);
      }
    }
  }
  
  console.log("\n🎉 Dummy user creation complete!");
  console.log("\n📋 Login Credentials:");
  console.log("All users use password: password123");
  dummyUsers.forEach(user => {
    console.log(`${user.name}: ${user.email}`);
  });
}

// Run the script
createDummyUsers().catch(console.error);
