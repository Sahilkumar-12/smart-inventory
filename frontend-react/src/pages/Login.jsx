import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, Lock, Boxes, AlertCircle, LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', name: '' });
  const [googleReady, setGoogleReady] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);

  const parseJwt = (token) => {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      setGoogleReady(false);
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        return;
      }
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const intervalId = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogle();
        clearInterval(intervalId);
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      toast.error('Google sign-in did not return credentials.');
      return;
    }

    setLoading(true);
    try {
      const googleProfile = parseJwt(response.credential);
      const res = await authService.googleLogin({ token: response.credential });
      const userData = {
        name: googleProfile?.name || googleProfile?.email || 'Google User',
        email: googleProfile?.email || '',
        avatar: googleProfile?.picture || '',
      };
      login(userData, res.data.access_token);
      toast.success('✅ Logged in with Google successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      toast.error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID in frontend .env.');
      return;
    }
    if (!googleReady || !window.google?.accounts?.id) {
      toast.error('Google Identity Services is still loading. Please try again in a moment.');
      return;
    }
    window.google.accounts.id.prompt();
  };

  const validateEmail = (email) => {
    if (email.startsWith('@')) {
      return { valid: false, error: 'Email must have username before @ symbol' };
    }
    if (!email.includes('@')) {
      return { valid: false, error: 'Email must contain @ symbol' };
    }
    const parts = email.split('@');
    if (parts.length !== 2) {
      return { valid: false, error: 'Email can only contain one @ symbol' };
    }
    const [username, domain] = parts;
    if (!username || username.trim().length === 0) {
      return { valid: false, error: 'Email must have characters before @ symbol' };
    }
    if (!domain || domain.trim().length === 0) {
      return { valid: false, error: 'Email must have domain after @ symbol' };
    }
    if (!domain.includes('.')) {
      return { valid: false, error: 'Domain must contain a dot (e.g., gmail.com)' };
    }
    const domainLower = domain.toLowerCase();
    const commonTypos = {
      'gamil.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmial.co.uk': 'gmail.co.uk',
      'gmai.co.uk': 'gmail.co.uk',
      'gamil.co.uk': 'gmail.co.uk',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'outloo.com': 'outlook.com',
      'hotmial.com': 'hotmail.com',
    };
    if (commonTypos[domainLower]) {
      return {
        valid: false,
        error: `Did you mean "${username}@${commonTypos[domainLower]}"?`,
      };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format (e.g., user@domain.com)' };
    }
    return { valid: true, error: '' };
  };

  const clearForm = () => {
    setFormData({ email: '', password: '', name: '' });
    setErrors({ email: '', password: '', name: '' });
    if (emailRef.current) {
      emailRef.current.focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailValidation = validateEmail(formData.email.trim());
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error;
      }
    }
    if (!formData.password?.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!isLogin && !formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authService.login({
          username: formData.email.trim(),
          password: formData.password.trim(),
        });
        login({ name: formData.email, email: formData.email }, res.data.access_token);
        toast.success('✅ Logged in successfully!');
        clearForm();
      } else {
        await authService.register({
          username: formData.email.trim(),
          password: formData.password.trim(),
        });
        const loginRes = await authService.login({
          username: formData.email.trim(),
          password: formData.password.trim(),
        });
        login({ name: formData.name.trim() || formData.email, email: formData.email }, loginRes.data.access_token);
        toast.success('✅ Account created successfully!');
        clearForm();
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message;
      if (errorDetail?.toLowerCase().includes('already registered')) {
        setErrors({ ...errors, email: 'User already exists' });
        toast.error('❌ This email is already registered');
      } else if (errorDetail?.toLowerCase().includes('incorrect')) {
        setErrors({ ...errors, email: 'Invalid credentials', password: 'Invalid credentials' });
        toast.error('❌ Invalid email or password');
      } else if (errorDetail?.toLowerCase().includes('not found')) {
        setErrors({ ...errors, email: 'User not found' });
        toast.error('❌ User not found. Please sign up first');
      } else {
        toast.error(`❌ ${errorDetail || 'Authentication failed'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-300 dark:bg-primary-900/30 blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300 dark:bg-blue-900/30 blur-3xl opacity-50"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 glass-card p-10 z-10 shadow-2xl"
      >
        <div>
          <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
            <Boxes className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to Smart Inventory' : 'Create an account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'Welcome back to your dashboard' : 'Join us to manage your inventory smarter'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!import.meta.env.VITE_GOOGLE_CLIENT_ID || loading}
            className="w-full inline-flex justify-center items-center gap-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-100 py-3 px-4 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <LogIn className="h-5 w-5 text-primary-600" />
            {loading ? 'Processing...' : 'Continue with Google'}
          </button>
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="mt-2 text-xs text-red-500">
              Google login is not configured. Set <span className="font-semibold">VITE_GOOGLE_CLIENT_ID</span> in your frontend `.env`.
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
            <span>or use your email account</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div className="relative">
                <input
                  ref={nameRef}
                  name="name"
                  type="text"
                  value={formData.name}
                  className={`input-field pl-4 py-3 bg-gray-50 dark:bg-dark-bg/50 w-full border transition-colors ${
                    errors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Full Name"
                  onChange={handleChange}
                />
                {errors.name && (
                  <div className="flex items-center mt-1 text-red-500 text-xs gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </div>
                )}
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                ref={emailRef}
                name="email"
                type="email"
                value={formData.email}
                className={`input-field pl-10 py-3 bg-gray-50 dark:bg-dark-bg/50 w-full border transition-colors ${
                  errors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Email address"
                onChange={handleChange}
              />
              {errors.email && (
                <div className="flex items-center mt-1 text-red-500 text-xs gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                ref={passwordRef}
                name="password"
                type="password"
                value={formData.password}
                className={`input-field pl-10 py-3 bg-gray-50 dark:bg-dark-bg/50 w-full border transition-colors ${
                  errors.password ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Password"
                onChange={handleChange}
              />
              {errors.password && (
                <div className="flex items-center mt-1 text-red-500 text-xs gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
            <button type="button" onClick={handleSwitchMode} className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
