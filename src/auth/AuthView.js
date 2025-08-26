import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/init';
import AnimatedButton from '../animations/AnimatedButton';

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-rose-400 to-orange-300">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          {isLogin ? 'Welcome Back!' : 'Find Your Roomie'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" 
            required 
            disabled={loading} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" 
            required 
            disabled={loading} 
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <AnimatedButton
            type="submit"
            className="w-full px-4 py-3 font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors disabled:bg-rose-300"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </AnimatedButton>
        </form>
        <p className="text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="ml-1 font-semibold text-rose-500 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthView;
