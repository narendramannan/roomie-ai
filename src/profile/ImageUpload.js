import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/init';
import { analyzeImage } from '../ai/photoAnalysis';
import { useTheme } from '../theme';

export default function ImageUpload({ onUpload }) {
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');
      const storageRef = ref(storage, `users/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const analysis = await analyzeImage(url);
      await setDoc(doc(db, 'users', user.uid), { photos: [url], aiAnalysis: analysis }, { merge: true });
      if (onUpload) onUpload(url, analysis);
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="photo-upload"
        className="cursor-pointer block p-8 border-2 border-dashed rounded-lg"
        style={{
          borderColor: theme.colors.textSecondary,
          backgroundColor: theme.colors.surface,
        }}
      >
        <p style={{ color: theme.colors.textSecondary }}>
          {uploading ? 'Uploading...' : 'Click to select a photo'}
        </p>
      </label>
      <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
