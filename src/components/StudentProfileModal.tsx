import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-hot-toast';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  ienNumber: string;
  email?: string;
  phone?: string;
  department: string;
  branch?: string;
  year?: number;
  section?: string;
  faceDescriptor?: string;
}

interface AttendanceRecord {
  id: number;
  timestamp: string;
  confidence?: number;
  method?: string;
  subject?: string;
}

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalClasses: 0,
    attended: 0,
    percentage: 0,
    streak: 0,
  });

  useEffect(() => {
    if (student && isOpen) {
      loadStudentData();
    }
  }, [student, isOpen]);

  const loadStudentData = async () => {
    if (!student) return;
    
    setIsLoading(true);
    try {
      // Fetch all attendance records
      const response = await fetch('http://localhost:8080/api/attendance');
      const data = await response.json();

      if (data.success && data.data) {
        // Filter records for this student
        const studentRecords = data.data.filter(
          (record: any) => record.student?.id === student.id
        );

        setAttendanceRecords(studentRecords);

        // Calculate stats
        const totalClasses = 50; // This should come from timetable
        const attended = studentRecords.length;
        const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

        setStats({
          totalClasses,
          attended,
          percentage,
          streak: calculateStreak(studentRecords),
        });
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreak = (records: AttendanceRecord[]): number => {
    // Simple streak calculation - consecutive days
    if (records.length === 0) return 0;
    
    const sortedRecords = records.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    
    for (const record of sortedRecords) {
      const recordDate = new Date(record.timestamp);
      const diffDays = Math.floor(
        (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getAttendanceChartData = () => {
    // Group by week for last 7 weeks
    const weeks = 7;
    const data = [];
    const today = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      data.push({
        week: `Week ${weeks - i}`,
        attendance: weekRecords.length,
        percentage: Math.round((weekRecords.length / 5) * 100), // Assuming 5 days per week
      });
    }

    return data;
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBgColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (percentage >= 75) return 'bg-blue-100 dark:bg-blue-900/30';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (!student) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white/30">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-primary-100 mt-1">{student.ienNumber}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                        {student.department}
                      </span>
                      {student.branch && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          {student.branch}
                        </span>
                      )}
                      {student.faceDescriptor ? (
                        <span className="px-3 py-1 bg-green-500/80 rounded-full text-sm flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Face Enrolled</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/80 rounded-full text-sm flex items-center space-x-1">
                          <XCircle className="w-4 h-4" />
                          <span>Not Enrolled</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Total Classes
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {stats.totalClasses}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Attended
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {stats.attended}
                      </p>
                    </div>

                    <div className={`bg-gradient-to-br p-4 rounded-xl border ${
                      stats.percentage >= 75
                        ? 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800'
                        : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className={`w-5 h-5 ${stats.percentage >= 75 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`} />
                        <span className={`text-sm font-medium ${stats.percentage >= 75 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                          Percentage
                        </span>
                      </div>
                      <p className={`text-3xl font-bold ${stats.percentage >= 75 ? 'text-purple-900 dark:text-purple-100' : 'text-red-900 dark:text-red-100'}`}>
                        {stats.percentage}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          Streak
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {stats.streak} days
                      </p>
                    </div>
                  </div>

                  {/* Attendance Trend Chart */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Attendance Trend (Last 7 Weeks)
                      </h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={getAttendanceChartData()}>
                        <defs>
                          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="attendance"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorAttendance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recent Attendance */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Attendance
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                      {attendanceRecords.slice(0, 10).map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(record.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(record.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {record.subject && ` • ${record.subject}`}
                              </p>
                            </div>
                          </div>
                          {record.confidence && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(record.confidence * 100)} ${getStatusColor(record.confidence * 100)}`}>
                              {(record.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      ))}
                      {attendanceRecords.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                          No attendance records found
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  {(student.email || student.phone) && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        {student.email && (
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {student.email}
                            </span>
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {student.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudentProfileModal;
