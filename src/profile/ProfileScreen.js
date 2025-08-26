import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/init';
import { useTheme } from '../theme';

const ProfileScreen = ({ userData, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);
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

  return (
    <div
      className="space-y-8"
      style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fonts.body,
        color: theme.colors.textPrimary,
      }}
    >
      <header className="flex flex-col items-center space-y-4 text-center">
        {formData.photos && formData.photos[0] ? (
          <img src={formData.photos[0]} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl"
            style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
          >
            {formData.name.charAt(0)}
          </div>
        )}
        {isEditing ? (
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="text-center border-b-2"
            style={{
              fontSize: theme.typography.sizes.heading,
              fontWeight: theme.typography.weights.bold,
              borderColor: theme.colors.primary,
            }}
          />
        ) : (
          <h2
            style={{
              fontSize: theme.typography.sizes.heading,
              fontWeight: theme.typography.weights.bold,
            }}
          >
            {formData.name}, {formData.age}
          </h2>
        )}
      </header>

      <section
        className="rounded-lg shadow"
        style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.md }}
      >
        <h3
          className="font-semibold"
          style={{
            marginBottom: theme.spacing.sm,
            fontSize: theme.typography.sizes.heading,
            color: theme.colors.textPrimary,
          }}
        >
          My Details
        </h3>
        {isEditing ? (
          <div className="space-y-2">
            <input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className="w-full rounded"
              style={{
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.textSecondary}`,
              }}
              placeholder="Age"
            />
          </div>
        ) : (
          <p style={{ color: theme.colors.textSecondary }}>
            <strong>Age:</strong> {formData.age}
          </p>
        )}
      </section>

      <section
        className="rounded-lg shadow"
        style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.md }}
      >
        <h3
          className="font-semibold"
          style={{
            marginBottom: theme.spacing.sm,
            fontSize: theme.typography.sizes.heading,
            color: theme.colors.textPrimary,
          }}
        >
          My AI Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {formData.aiAnalysis.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.textPrimary,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.typography.sizes.small,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="w-full rounded-lg font-semibold"
            style={{
              backgroundColor: theme.colors.success,
              color: theme.colors.surface,
              padding: theme.spacing.md,
            }}
          >
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full rounded-lg font-semibold"
            style={{
              backgroundColor: theme.colors.surface,
              padding: theme.spacing.md,
              color: theme.colors.textPrimary,
              border: `1px solid ${theme.colors.textSecondary}`,
            }}
          >
            Edit Profile
          </button>
        )}
        <button
          onClick={() => signOut(auth)}
          className="w-full rounded-lg font-semibold"
          style={{
            backgroundColor: theme.colors.danger,
            color: theme.colors.surface,
            padding: theme.spacing.md,
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;

