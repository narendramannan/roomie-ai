import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/init';

async function placeholderAIAnalysis(url) {
  await new Promise((r) => setTimeout(r, 1000));
  return { description: 'AI analysis placeholder', tags: ['sample-tag'] };
}

export default function ImageUpload({ onUpload }) {
  const [uploading, setUploading] = useState(false);

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
      const analysis = await placeholderAIAnalysis(url);
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
      <label htmlFor="photo-upload" className="cursor-pointer block p-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
        <p className="text-gray-500">{uploading ? 'Uploading...' : 'Click to select a photo'}</p>
      </label>
      <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
