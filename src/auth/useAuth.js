import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubUserData = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ uid: authUser.uid, ...docSnap.data() });
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
}
