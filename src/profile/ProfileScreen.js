import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/init';
import { doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../theme';
import { CheckIcon, PencilIcon, XIcon } from '../icons';

const ProfileScreen = ({ userData, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);
  const [newTag, setNewTag] = useState('');
  const theme = useTheme();

  useEffect(() => {
    setFormData(userData);
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onProfileUpdate(formData);
    setIsEditing(false);
  };

  const persistTags = async (updatedTags) => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { 'aiAnalysis.tags': updatedTags });
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  };

  const handleAddTag = async () => {
    const tag = newTag.trim();
    if (!tag) return;
    const updatedTags = [...(formData.aiAnalysis?.tags || []), tag];
    setFormData((prev) => ({
      ...prev,
      aiAnalysis: { ...(prev.aiAnalysis || {}), tags: updatedTags },
    }));
    setNewTag('');
    await persistTags(updatedTags);
  };

  const handleRemoveTag = async (tag) => {
    const updatedTags = (formData.aiAnalysis?.tags || []).filter(
      (t) => t !== tag
    );
    setFormData((prev) => ({
      ...prev,
      aiAnalysis: { ...(prev.aiAnalysis || {}), tags: updatedTags },
    }));
    await persistTags(updatedTags);
  };

  // Simple profile completion progress
  const sections = [
    formData.photos?.length,
    formData.aboutMe,
    formData.lifestyle,
    formData.aiAnalysis?.tags?.length,
  ];
  const progress = Math.round(
    (sections.filter(Boolean).length / sections.length) * 100
  );

  return (
    <div
      className="space-y-6 p-4 md:p-6"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fonts.body,
        color: theme.colors.textPrimary,
      }}
    >
      {/* Header Card */}
      <div
        className="flex items-center justify-between rounded-xl shadow p-4"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h2
          className="text-xl font-bold"
          style={{ color: theme.colors.textPrimary }}
        >
          My Profile
        </h2>
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: theme.colors.primary }}
        >
          {isEditing ? 'Save' : (
            <>
              <PencilIcon />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: theme.colors.primary,
          }}
        />
      </div>

      {/* Profile Photo */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="relative w-24 h-24">
          {formData.photos && formData.photos[0] ? (
            <img
              src={formData.photos[0]}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-4xl"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})`,
                color: theme.colors.surface,
              }}
            >
              {formData.name?.charAt(0)}
            </div>
          )}
          <span
            className="absolute bottom-0 right-0 p-1 rounded-full"
            style={{ backgroundColor: theme.colors.success }}
          >
            <CheckIcon className="text-white" />
          </span>
        </div>
        <p className="text-lg font-semibold">
          {formData.name}, {formData.age}
        </p>
      </div>

      {/* About Me */}
      <section
        className="rounded-xl shadow p-4"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h3
          className="font-semibold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          About Me
        </h3>
        {isEditing ? (
          <textarea
            name="aboutMe"
            value={formData.aboutMe || ''}
            onChange={handleChange}
            className="w-full p-2 rounded border"
            style={{ borderColor: theme.colors.textSecondary }}
            rows={3}
          />
        ) : (
          <p style={{ color: theme.colors.textSecondary }}>
            {formData.aboutMe || 'Tell us about yourself.'}
          </p>
        )}
      </section>

      {/* Roomie Style */}
      <section
        className="rounded-xl shadow p-4"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h3
          className="font-semibold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          Roomie Style
        </h3>
        {formData.lifestyle ? (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textSecondary }}>Sleep:</span>
              <span>{formData.lifestyle.sleep}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textSecondary }}>Cleanliness:</span>
              <span>{formData.lifestyle.cleanliness}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textSecondary }}>Social Vibe:</span>
              <span>{formData.lifestyle.socialVibe}</span>
            </div>
          </div>
        ) : (
          <p style={{ color: theme.colors.textSecondary }}>No details yet.</p>
        )}
      </section>

      {/* Interests */}
      <section
        className="rounded-xl shadow p-4"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h3
          className="font-semibold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {(formData.aiAnalysis?.tags || []).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.textPrimary,
              }}
            >
              {tag}
              {isEditing && (
                <button
                  aria-label={`Remove ${tag}`}
                  onClick={() => handleRemoveTag(tag)}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {isEditing && (
            <input
              type="text"
              placeholder="Add tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="px-3 py-1 rounded-full text-sm border"
              style={{ borderColor: theme.colors.textSecondary }}
            />
          )}
          {(formData.aiAnalysis?.tags || []).length === 0 && !isEditing && (
            <p style={{ color: theme.colors.textSecondary }}>
              No interests yet.
            </p>
          )}
        </div>
      </section>

      {/* Badges */}
      <section
        className="rounded-xl shadow p-4"
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h3
          className="font-semibold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          Badges
        </h3>
        <div className="flex flex-wrap gap-2">
          {(formData.badges || []).map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full text-sm"
              style={{
                backgroundColor: theme.colors.accent,
                color: theme.colors.surface,
              }}
            >
              {badge}
            </span>
          ))}
          {(formData.badges || []).length === 0 && (
            <p style={{ color: theme.colors.textSecondary }}>
              No badges yet.
            </p>
          )}
        </div>
      </section>

      {/* Log Out */}
      <div className="pt-2">
        <button
          onClick={() => signOut(auth)}
          className="w-full rounded-lg font-semibold p-3"
          style={{
            backgroundColor: theme.colors.danger,
            color: theme.colors.surface,
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;

