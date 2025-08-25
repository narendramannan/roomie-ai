import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/init';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return { user, userData, loading };
};

export default useAuth;
