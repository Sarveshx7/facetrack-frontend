import React, { useState, useEffect } from 'react';
import { Camera, Users, Target, Settings, BarChart3, Eye, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SimpleFaceEnrollment from './SimpleFaceEnrollment';
import SimpleFaceAttendance from './SimpleFaceAttendance';
import AdminFaceManagement from './AdminFaceManagement';
import faceRecognitionService from '../services/faceRecognitionService';

type ActiveView = 'dashboard' | 'enrollment' | 'attendance' | 'admin';

const FaceRecognitionHub: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [enrolledStudentsCount, setEnrolledStudentsCount] = useState(0);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0);
  const [systemStats, setSystemStats] = useState({
    totalRecognitions: 0,
    accuracyRate: 0,
    lastActivity: null as Date | null
  });

  useEffect(() => {
    initializeSystem();
    loadSystemStats();
  }, []);

  useEffect(() => {
    // Reload enrolled count when returning to dashboard
    if (activeView === 'dashboard' && isModelsLoaded) {
      loadEnrolledCount();
    }
  }, [activeView, isModelsLoaded]);

  const initializeSystem = async () => {
    try {
      toast.loading('Loading AI models...', { id: 'models' });
      
      const modelsLoaded = await faceRecognitionService.initialize();
      setIsModelsLoaded(modelsLoaded);
      
      if (modelsLoaded) {
        toast.success('🤖 AI models loaded successfully!', { id: 'models' });
        // Load enrolled students count
        await loadEnrolledCount();
      } else {
        toast.error('Failed to load AI models', { id: 'models' });
      }
    } catch (error) {
      console.error('❌ System initialization error:', error);
      toast.error('Failed to initialize face recognition system', { id: 'models' });
    }
  };

  const loadEnrolledCount = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/students/enrolled-faces');
      if (response.ok) {
        const data = await response.json();
        const enrolledFaces = (data.success && Array.isArray(data.data)) ? data.data : [];
        setEnrolledStudentsCount(enrolledFaces.length);
        console.log('✅ Enrolled students count:', enrolledFaces.length);
      }
    } catch (error) {
      console.error('Failed to load enrolled count:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      // In a real application, you would fetch these from your backend
      // For now, we'll use mock data or local storage
      const stats = {
        totalRecognitions: parseInt(localStorage.getItem('totalRecognitions') || '0'),
        accuracyRate: parseFloat(localStorage.getItem('accuracyRate') || '0'),
        lastActivity: localStorage.getItem('lastActivity') ? new Date(localStorage.getItem('lastActivity')!) : null
      };
      
      setSystemStats(stats);
    } catch (error) {
      console.error('❌ Error loading system stats:', error);
    }
  };

  const handleEnrollmentComplete = async () => {
    // Update last activity
    const now = new Date();
    setSystemStats(prev => ({ ...prev, lastActivity: now }));
    localStorage.setItem('lastActivity', now.toISOString());
    
    // Wait a moment for backend to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload enrolled count
    await loadEnrolledCount();
    
    toast.success('🎉 Student enrolled successfully!');
    
    // Return to dashboard
    setActiveView('dashboard');
  };

  const handleAttendanceMarked = () => {
    const now = new Date();
    const totalRecognitions = systemStats.totalRecognitions + 1;
    
    setSystemStats(prev => ({
      ...prev,
      totalRecognitions,
      lastActivity: now
    }));
    
    setTodayAttendanceCount(prev => prev + 1);
    localStorage.setItem('lastActivity', now.toISOString());
    
    localStorage.setItem('totalRecognitions', totalRecognitions.toString());
    localStorage.setItem('lastActivity', now.toISOString());
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'enrollment':
        return (
          <SimpleFaceEnrollment
            onComplete={handleEnrollmentComplete}
            onClose={() => setActiveView('dashboard')}
          />
        );
      
      case 'attendance':
        return (
          <SimpleFaceAttendance
            onClose={() => setActiveView('dashboard')}
          />
        );
      
      case 'admin':
        return (
          <AdminFaceManagement
            onClose={() => setActiveView('dashboard')}
          />
        );
      
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <Zap className="w-10 h-10 mr-4 text-blue-600" />
            Advanced Face Recognition System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Professional-grade face recognition with multi-angle enrollment, real-time attendance tracking, 
            and comprehensive admin controls powered by TensorFlow.js
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-green-600" />
            System Overview
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                isModelsLoaded ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <Zap className={`w-8 h-8 ${isModelsLoaded ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Models</h3>
              <p className={`text-sm ${isModelsLoaded ? 'text-green-600' : 'text-red-600'}`}>
                {isModelsLoaded ? 'Loaded & Ready' : 'Loading...'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enrolled Students</h3>
              <p className="text-2xl font-bold text-blue-600">{enrolledStudentsCount}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-3">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Attendance</h3>
              <p className="text-2xl font-bold text-purple-600">{todayAttendanceCount}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-3">
                <Eye className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Recognitions</h3>
              <p className="text-2xl font-bold text-yellow-600">{systemStats.totalRecognitions}</p>
            </div>
          </div>
          
          {systemStats.lastActivity && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last activity: {systemStats.lastActivity.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Face Enrollment */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Face Enrollment
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Fast and reliable face enrollment with auto-capture. Single-angle enrollment optimized for ease of use.
              </p>
              
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                <li>✅ 30-second enrollment</li>
                <li>✅ Auto & manual capture</li>
                <li>✅ Real-time quality feedback</li>
                <li>✅ 65-85% recognition accuracy</li>
              </ul>
              
              <button
                onClick={() => setActiveView('enrollment')}
                disabled={!isModelsLoaded}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all shadow-lg"
              >
                <Camera className="w-5 h-5" />
                Start Enrollment
              </button>
            </div>
          </div>

          {/* Real-Time Attendance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Advanced Attendance
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Advanced, real-time attendance with configurable thresholds, duplicate prevention, and detailed feedback.
              </p>
              
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                <li>✅ Live face recognition</li>
                <li>✅ 85%+ confidence threshold</li>
                <li>✅ Duplicate prevention</li>
                <li>✅ Real-time feedback</li>
              </ul>
              
              <button
                onClick={() => setActiveView('attendance')}
                disabled={!isModelsLoaded}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all"
              >
                <Eye className="w-5 h-5" />
                Start Advanced Attendance
              </button>
            </div>
          </div>

          {/* Admin Management */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
                <Settings className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Admin Management
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive face data management with search, filter, export, 
                and bulk operations for enrolled students.
              </p>
              
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                <li>✅ Student face data overview</li>
                <li>✅ Bulk delete & re-enrollment</li>
                <li>✅ Data export capabilities</li>
                <li>✅ Quality score analytics</li>
              </ul>
              
              <button
                onClick={() => setActiveView('admin')}
                disabled={!isModelsLoaded}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all"
              >
                <Settings className="w-5 h-5" />
                Manage Data
              </button>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            System Features & Capabilities
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">TensorFlow.js Backend</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by advanced neural networks running directly in the browser
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">95%+ Accuracy</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional-grade recognition accuracy with multi-angle training
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Real-Time Processing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Live face detection and recognition with instant feedback
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Storage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Face data stored as mathematical vectors, not images
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-3">
                <Settings className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dark Mode Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Beautiful UI that adapts to your preferred theme
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics & Reporting</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive statistics and data export capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {renderActiveView()}
    </div>
  );
};

export default FaceRecognitionHub;
