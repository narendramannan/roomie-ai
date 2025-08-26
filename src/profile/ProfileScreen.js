import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/init';

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
                {formData.photos && formData.photos[0] ? (
                    <img src={formData.photos[0]} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center text-white font-bold text-4xl">
                        {formData.name.charAt(0)}
                    </div>
                )}
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

export default ProfileScreen;

