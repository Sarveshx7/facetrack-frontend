
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Camera,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Student } from '../services/studentService';
import { DEPARTMENTS, Department } from '../config/api';
import attendanceService, { AttendanceStats } from '../services/attendanceService';

const AttendanceMarking: React.FC = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDepartment, setFilterDepartment] = useState<Department | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState<AttendanceStats>({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    unmarkedCount: 0,
    totalStudents: 0,
  });

  // Load attendance data
  useEffect(() => {
    loadTodayStats();
    loadTodayAttendance();
  }, [selectedDate]);

  const loadTodayStats = async (showToast = false) => {
    try {
      setIsLoading(true);
      const stats = await attendanceService.getTodayStats();
      setSessionStats(stats);
      if (showToast) {
        toast.success('Stats refreshed successfully!');
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      if (showToast) {
        toast.error('Failed to refresh stats');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      setIsLoading(true);
      const records = await attendanceService.getTodayAttendance();
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };


  const exportAttendance = async () => {
    try {
      toast.success('Export feature coming soon!');
    } catch (error) {
      toast.error('Failed to export attendance');
    }
  };

  const resetAttendanceData = async () => {
    const confirmReset = window.confirm(
      '⚠️ Are you sure you want to reset ALL attendance data?\n\nThis will permanently delete all attendance records and cannot be undone.\n\nThis action is intended for testing purposes only.'
    );

    if (!confirmReset) return;

    try {
      setIsLoading(true);
      const success = await attendanceService.resetAllAttendance();

      if (success) {
        toast.success('🗑️ All attendance data has been reset!');
        // Refresh the data
        loadTodayStats(false);
        loadTodayAttendance();
      } else {
        throw new Error('Failed to reset attendance data');
      }
    } catch (error: any) {
      console.error('Reset attendance error:', error);
      toast.error(error.message || 'Failed to reset attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'LATE':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ABSENT':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'EXCUSED':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4" />;
      case 'LATE':
        return <Clock className="w-4 h-4" />;
      case 'ABSENT':
        return <XCircle className="w-4 h-4" />;
      case 'EXCUSED':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance Marking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mark attendance using face recognition or manual entry
          </p>
        </div>
        <button
          onClick={() => navigate('/advanced-face-recognition')}
          className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Camera className="w-6 h-6" />
          <span className="text-lg">Start Face Recognition</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
              <p className="text-2xl font-bold text-green-600">{sessionStats.presentCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{sessionStats.lateCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
              <p className="text-2xl font-bold text-red-600">{sessionStats.absentCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-blue-600">{sessionStats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Face Recognition Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              MediaPipe Face Recognition
            </h3>
          </div>

          {/* Face Recognition Interface */}
          <div className="text-center">
            <div className="mb-6">
              <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-600">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Real-time Face Attendance
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Live camera with real-time face recognition
                  </p>
                  <button
                    onClick={() => navigate('/advanced-face-recognition')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Start Face Recognition</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="font-semibold text-green-800 dark:text-green-400">✅ Real-time 30fps</div>
                <div className="text-green-600 dark:text-green-500">Instant detection</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="font-semibold text-blue-800 dark:text-blue-400">🎯 High accuracy</div>
                <div className="text-blue-600 dark:text-blue-500">Mobile-grade precision</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls & Recent Records */}
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  loadTodayStats(true);
                  loadTodayAttendance();
                }}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
              </button>
              <button
                onClick={exportAttendance}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
              <button
                onClick={resetAttendanceData}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Reset Data</span>
              </button>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unmarked Students: {sessionStats.unmarkedCount}</span>
                </div>
              </div>
              
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">🧪 Reset Data: For testing - clears all attendance records</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Records */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Attendance ({attendanceRecords.length})
              </h3>
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {record.student?.firstName?.[0] || 'S'}{record.student?.lastName?.[0] || 'T'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {record.student?.firstName || 'Unknown'} {record.student?.lastName || 'Student'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {record.student?.ienNumber || 'N/A'} • {new Date(record.checkInTime || record.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span>{record.status}</span>
                    </span>
                    {record.markingMethod === 'FACE_RECOGNITION' && record.faceConfidence && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {(record.faceConfidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {attendanceRecords.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No attendance records for today</p>
                  <p className="text-xs mt-1">Start face recognition to mark attendance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default AttendanceMarking;
