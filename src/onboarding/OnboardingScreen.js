import React, { useState, useEffect } from 'react';
import ImageUpload from '../profile/ImageUpload';
import { auth, db } from '../firebase/init';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const TOTAL_STEPS = 4;
const SUMMARY_STEP = 5;

const OnboardingScreen = ({ onProfileUpdate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Man',
    location: '',
    budget: '',
    matchingPreferences: { gender: [] },
    lifestyle: {
      sleep: 5,
      cleanliness: 5,
      socialVibe: 'occasional_friends',
    },
    photos: [],
    aiAnalysis: { description: '', tags: [] },
  });
  const [analysis, setAnalysis] = useState({ description: '', tags: [] });

  const navigate = useNavigate();

  const progress = (Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100;

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const handleLifestyleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      lifestyle: { ...p.lifestyle, [name]: value },
    }));
  };
  const handleGenderPrefChange = (gender) => {
    setFormData((prev) => {
      const current = prev.matchingPreferences.gender;
      const newPrefs = current.includes(gender)
        ? current.filter((g) => g !== gender)
        : [...current, gender];
      return {
        ...prev,
        matchingPreferences: { ...prev.matchingPreferences, gender: newPrefs },
      };
    });
  };
  const handleSubmit = async () => {
    await onProfileUpdate(formData, { skipNavigate: true });
    setStep(SUMMARY_STEP);
  };

  useEffect(() => {
    if (step === SUMMARY_STEP) {
      const fetchAnalysis = async () => {
        try {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          const snap = await getDoc(doc(db, 'users', uid));
          const data = snap.data();
          setAnalysis(data?.aiAnalysis || { description: '', tags: [] });
        } catch (err) {
          console.error('Failed to fetch analysis:', err);
          setAnalysis(formData.aiAnalysis);
        }
      };
      fetchAnalysis();
    }
  }, [step, formData.aiAnalysis]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">About You</h3>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full p-3 border rounded-lg"
            />
            <input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your Age"
              className="w-full p-3 border rounded-lg"
            />
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Your Location"
              className="w-full p-3 border rounded-lg"
            />
            <input
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              placeholder="Monthly Budget"
              className="w-full p-3 border rounded-lg"
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            >
              <option>Man</option>
              <option>Woman</option>
              <option>Non-binary</option>
            </select>
            <button
              onClick={handleNext}
              className="w-full p-3 bg-rose-500 text-white rounded-lg font-semibold"
            >
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Who are you looking for?</h3>
            <p className="text-gray-600">Select all that apply.</p>
            {['Man', 'Woman', 'Non-binary', 'Open to All'].map((g) => (
              <button
                key={g}
                onClick={() => handleGenderPrefChange(g)}
                className={`w-full p-3 border rounded-lg font-semibold ${
                  formData.matchingPreferences.gender.includes(g)
                    ? 'bg-rose-500 text-white'
                    : 'bg-white'
                }`}
              >
                {g}
              </button>
            ))}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="w-1/3 p-3 bg-gray-300 text-black rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="w-1/3 p-3 bg-rose-500 text-white rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Your Lifestyle</h3>
            <div>
              <label className="block font-semibold">Sleep Schedule</label>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Early Bird</span>
                <span>Night Owl</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                name="sleep"
                value={formData.lifestyle.sleep}
                onChange={handleLifestyleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold">Cleanliness</label>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Very Tidy</span>
                <span>Laid Back</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                name="cleanliness"
                value={formData.lifestyle.cleanliness}
                onChange={handleLifestyleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold">Social Vibe</label>
              <select
                name="socialVibe"
                value={formData.lifestyle.socialVibe}
                onChange={handleLifestyleChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="quiet_sanctuary">My home is a quiet sanctuary</option>
                <option value="occasional_friends">I have friends over occasionally</option>
                <option value="social_hub">My home is a social hub</option>
              </select>
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="w-1/3 p-3 bg-gray-300 text-black rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="w-1/3 p-3 bg-rose-500 text-white rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 text-center">
            <h3 className="text-2xl font-bold">Upload Your Photo</h3>
            <p className="text-gray-600">Our AI will analyze it to find better matches.</p>
            <ImageUpload
              onUpload={(url, analysis) => {
                setFormData((prev) => ({
                  ...prev,
                  photos: [...prev.photos, url],
                  aiAnalysis: analysis,
                }));
              }}
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="w-1/3 p-3 bg-gray-300 text-black rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.photos.length}
                className="w-1/3 p-3 bg-green-500 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Finish
              </button>
            </div>
          </div>
        );
      case SUMMARY_STEP:
        return (
          <div className="space-y-4 text-center">
            <h3 className="text-2xl font-bold">AI Personality Profile</h3>
            {analysis.description && (
              <p className="text-gray-600">{analysis.description}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {analysis.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="w-full p-3 bg-rose-500 text-white rounded-lg font-semibold"
            >
              Start Matching
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="relative h-2 bg-gray-200 rounded-full mb-4">
          <div
            className="absolute top-0 left-0 h-2 bg-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {step < TOTAL_STEPS && (
          <p className="text-center text-sm text-gray-600 mb-4">You're almost there!</p>
        )}
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingScreen;

