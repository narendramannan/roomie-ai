import React, { useState } from 'react';
import ImageUpload from '../profile/ImageUpload';

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
                        <ImageUpload onUpload={(url, analysis) => {
                            setFormData(prev => ({ ...prev, photos: [url], aiAnalysis: analysis }));
                            handleNext();
                        }} />
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

export default OnboardingScreen;
