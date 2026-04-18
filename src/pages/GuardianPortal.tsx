import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, UserCheck, TrendingUp, Calendar, Award, ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DoodleCharacter from '../components/DoodleCharacter';

const GuardianPortal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guardianData, setGuardianData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const navigate = useNavigate();
  
  // Doodle animation states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [isTypingAfterError, setIsTypingAfterError] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  const doodleContainerRef = useRef<HTMLDivElement>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear sad state when trying again
    setIsWrongPassword(false);
    setIsTypingAfterError(false);
    
    try {
      const response = await fetch('http://localhost:8080/api/guardians/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGuardianData(data.guardian);
        setStudentData(data.student);
        setIsLoginSuccess(true);
        setIsLoggedIn(true);
        toast.success('Welcome to Guardian Portal!');
        
        // Load attendance data
        loadAttendanceData(data.guardian.id);
      } else {
        toast.error(data.message || 'Login failed');
        setIsWrongPassword(true);
      }
    } catch (error) {
      toast.error('Error connecting to server');
      setIsWrongPassword(true);
    }
  };

  const loadAttendanceData = async (guardianId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/guardians/${guardianId}/student-attendance`);
      const data = await response.json();
      
      if (data.success) {
        setAttendanceData(data);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleLogout = () => {
    // Clear all state
    setIsLoggedIn(false);
    setGuardianData(null);
    setStudentData(null);
    setAttendanceData(null);
    setEmail('');
    setPassword('');
    setIsLoginSuccess(false);
    setIsWrongPassword(false);
    toast.success('Logged out successfully');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/login')}
          className="absolute top-8 left-8 flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Login</span>
        </motion.button>

        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Doodles */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden md:block"
          >
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Guardian Portal
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-600 dark:text-gray-300"
              >
                Monitor your child's attendance with ease
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
                isUsernameFocused={isEmailFocused}
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
                isUsernameFocused={isEmailFocused}
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
                isUsernameFocused={isEmailFocused}
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
                isUsernameFocused={isEmailFocused}
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
          <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <UserCheck className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
              >
                Guardian Portal
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-300"
              >
                Access your child's attendance records
              </motion.p>
            </div>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Demo Credentials:
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <div>Email: <span className="font-mono">guardian@demo.com</span></div>
                <div>Password: <span className="font-mono">demo123</span></div>
              </div>
            </motion.div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="guardian@example.com"
                    required
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In to Portal
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure Parent Portal • FaceTrackU
              </p>
            </motion.div>
          </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {guardianData?.firstName} {guardianData?.lastName}
            </h1>
            <p className="text-blue-100">
              Monitoring: {studentData?.firstName} {studentData?.lastName}'s attendance
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <Users className="w-8 h-8 text-blue-500 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {studentData?.firstName} {studentData?.lastName}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {attendanceData?.attendanceRate?.toFixed(1) || '0'}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <Calendar className="w-8 h-8 text-purple-500 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Classes Attended</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {attendanceData?.attended || 0}/{attendanceData?.totalClasses || 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <Award className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
          <p className={`text-xl font-bold ${
            attendanceData?.status === 'Good Standing' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {attendanceData?.status || 'N/A'}
          </p>
        </motion.div>
      </div>

      {/* Student Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Student Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
            <p className="text-gray-900 dark:text-white font-medium">{studentData?.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Year</p>
            <p className="text-gray-900 dark:text-white font-medium">Year {studentData?.year}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">IEN Number</p>
            <p className="text-gray-900 dark:text-white font-medium">{studentData?.ienNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="text-gray-900 dark:text-white font-medium">{studentData?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Attendance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Attendance Records
          </h3>
        </div>
        <div className="overflow-x-auto">
          {attendanceData?.attendanceRecords?.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceData.attendanceRecords.slice(0, 10).map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Present
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No attendance records available
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GuardianPortal;
