import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, Camera, Shield, Zap, Users, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import DoodleCharacter from '../components/DoodleCharacter';
import DoodleIntroScene from '../components/DoodleIntroScene';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [isTypingAfterError, setIsTypingAfterError] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const doodleContainerRef = useRef<HTMLDivElement>(null);

  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Track mouse position for doodle eyes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (doodleContainerRef.current) {
        const rect = doodleContainerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Floating animation configuration
  const floatingAnimation = {
    y: [-10, 10, -10],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Don't change emotion while typing - stay sad until they submit
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Username or email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear sad state when trying again
    setIsWrongPassword(false);
    setIsTypingAfterError(false);
    
    if (!validateForm()) {
      // Trigger shake and sad face on validation failure
      console.log('Validation failed - triggering shake');
      setTimeout(() => {
        setIsWrongPassword(true);
      }, 50);
      return;
    }

    setIsLoading(true);
    try {
      await login(formData);
      // Success! Celebrate!
      console.log('Login successful - triggering celebration!');
      setIsLoginSuccess(true);
    } catch (error: any) {
      // Error is handled by the auth context and displayed via toast
      // Trigger shake animation and sad face for wrong password
      console.log('Login failed - triggering shake animation', error);
      // Use setTimeout to ensure state updates properly
      setTimeout(() => {
        setIsWrongPassword(true);
        // Auto-reset after animation completes
        setTimeout(() => {
          setIsWrongPassword(false);
        }, 1500);
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'AI Face Recognition',
      description: 'Advanced facial recognition for seamless attendance',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with JWT authentication',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-time Analytics',
      description: 'Live dashboards and comprehensive reporting',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-Department',
      description: 'Support for all engineering departments',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show intro scene first
  if (showIntro) {
    return <DoodleIntroScene onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={floatingAnimation}
          className="absolute top-20 left-20 w-32 h-32 bg-primary-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 2 }
          }}
          className="absolute top-40 right-32 w-24 h-24 bg-secondary-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 4 }
          }}
          className="absolute bottom-32 left-32 w-40 h-40 bg-success-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 1 }
          }}
          className="absolute bottom-20 right-20 w-28 h-28 bg-warning-200/30 rounded-full blur-xl"
        />
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block space-y-8"
        >
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
            >
              AI Face
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                {' '}Attendance
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-600 dark:text-gray-300"
            >
              Next-generation attendance management with cutting-edge AI technology
            </motion.p>
          </div>

          {/* Animated Doodle Characters */}
          <motion.div
            ref={doodleContainerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative h-96 flex items-end justify-start pl-8"
          >
            {/* Purple Rectangle (Back) - Behind everyone - SHY */}
            <DoodleCharacter
              color="#8B5CF6"
              shape="rectangle"
              size={180}
              position={{ bottom: 100, left: 100, zIndex: 1 }}
              mousePos={mousePos}
              isPasswordFocused={isPasswordFocused}
              isUsernameFocused={isUsernameFocused}
              isPasswordVisible={showPassword}
              isWrongPassword={isWrongPassword}
              isHappy={isTypingAfterError}
              isLoginSuccess={isLoginSuccess}
              delay={0.6}
              personality="shy"
            />
            
            {/* Dark Character (Middle Back) - CALM */}
            <DoodleCharacter
              color="#374151"
              shape="rounded"
              size={190}
              position={{ bottom: 0, left: 180, zIndex: 2 }}
              mousePos={mousePos}
              isPasswordFocused={isPasswordFocused}
              isUsernameFocused={isUsernameFocused}
              isPasswordVisible={showPassword}
              isWrongPassword={isWrongPassword}
              isHappy={isTypingAfterError}
              isLoginSuccess={isLoginSuccess}
              delay={0.7}
              personality="calm"
            />
            
            {/* Yellow Character (Middle Right) - CURIOUS */}
            <DoodleCharacter
              color="#FCD34D"
              shape="pill"
              size={180}
              position={{ bottom: 0, left: 250, zIndex: 3 }}
              mousePos={mousePos}
              isPasswordFocused={isPasswordFocused}
              isUsernameFocused={isUsernameFocused}
              isPasswordVisible={showPassword}
              isWrongPassword={isWrongPassword}
              isHappy={isTypingAfterError}
              isLoginSuccess={isLoginSuccess}
              delay={0.8}
              personality="curious"
            />
            
            {/* Orange Blob (Front Left) - IN FRONT! - ENERGETIC */}
            <DoodleCharacter
              color="#FF8C42"
              shape="blob"
              size={220}
              position={{ bottom: 0, left: 0, zIndex: 10 }}
              mousePos={mousePos}
              isPasswordFocused={isPasswordFocused}
              isUsernameFocused={isUsernameFocused}
              isPasswordVisible={showPassword}
              isWrongPassword={isWrongPassword}
              isHappy={isTypingAfterError}
              isLoginSuccess={isLoginSuccess}
              delay={0.5}
              personality="energetic"
            />
          </motion.div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="glass-morphism rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            {/* Form Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Camera className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
              >
                Welcome Back
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 dark:text-gray-300"
              >
                Sign in to access the admin dashboard
              </motion.p>
            </div>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
            >
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                Demo Credentials:
              </p>
              <div className="text-xs text-primary-600 dark:text-primary-400 space-y-1">
                <div>Username: <span className="font-mono">admin</span></div>
                <div>Password: <span className="font-mono">admin123</span></div>
              </div>
            </motion.div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username/Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="usernameOrEmail"
                    value={formData.usernameOrEmail}
                    onChange={handleInputChange}
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      errors.usernameOrEmail
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Enter username or email"
                  />
                </div>
                {errors.usernameOrEmail && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.usernameOrEmail}
                  </motion.p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      errors.password
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </motion.div>

              {/* Remember Me */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </span>
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Parent Login Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-6"
            >
              <button
                type="button"
                onClick={() => navigate('/guardian-portal')}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <UserCheck className="w-5 h-5" />
                <span className="font-medium">Parent/Guardian Login</span>
              </button>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by AI Face Recognition Technology
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
