import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Camera,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import LiveAttendanceFeed from '../components/LiveAttendanceFeed';

// Mock data for demo - replace with real API calls
const mockAttendanceData = [
  { date: '2025-01-15', present: 85, absent: 15, late: 5 },
  { date: '2025-01-16', present: 92, absent: 8, late: 3 },
  { date: '2025-01-17', present: 88, absent: 12, late: 7 },
  { date: '2025-01-18', present: 95, absent: 5, late: 2 },
  { date: '2025-01-19', present: 90, absent: 10, late: 4 },
  { date: '2025-01-20', present: 87, absent: 13, late: 6 },
  { date: '2025-01-21', present: 93, absent: 7, late: 3 },
];

// Department data will be fetched from backend

const mockRecentActivity = [
  { id: 1, type: 'attendance', message: 'John Doe marked present via face recognition', time: '2 minutes ago', status: 'success' },
  { id: 2, type: 'enrollment', message: 'New student enrolled: Jane Smith (CE-2024-001)', time: '5 minutes ago', status: 'info' },
  { id: 3, type: 'alert', message: '5 students have attendance below 75%', time: '10 minutes ago', status: 'warning' },
  { id: 4, type: 'system', message: 'Daily attendance report generated', time: '1 hour ago', status: 'success' },
];

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color,
  delay,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <div className="flex items-center mt-2">
            <span
              className={`text-sm font-medium ${
                changeType === 'increase'
                  ? 'text-green-600'
                  : changeType === 'decrease'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {change}
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last week</span>
          </div>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realStats, setRealStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
    faceEnrolled: 0
  });
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load real data from backend
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real data from backend
        const [studentsRes, todayStatsRes, departmentStatsRes] = await Promise.all([
          fetch('http://localhost:8080/api/students?size=1000'),
          fetch('http://localhost:8080/api/attendance/stats/today'),
          fetch('http://localhost:8080/api/students/stats/department')
        ]);

        const studentsData = await studentsRes.json();
        const todayStats = await todayStatsRes.json();
        const departmentStats = await departmentStatsRes.json();

        if (studentsData.success && todayStats.success) {
          const allStudents = studentsData.data.content;
          const enrolledStudents = allStudents.filter((s: any) => s.faceEnrolled);
          
          setRealStats({
            totalStudents: todayStats.data.totalStudents,
            presentToday: todayStats.data.presentCount,
            attendanceRate: todayStats.data.totalStudents > 0 
              ? Math.round((todayStats.data.presentCount / todayStats.data.totalStudents) * 100)
              : 0,
            faceEnrolled: enrolledStudents.length
          });
        }
        
        if (departmentStats.success && departmentStats.data) {
          setDepartmentData(departmentStats.data);
        }
      } catch (error) {
        console.error('Failed to load real data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadRealData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-primary-100">
              Here's what's happening with your attendance system today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">Current Time</p>
            <p className="text-xl font-mono">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-primary-200 text-sm">
              {currentTime.toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={realStats.totalStudents}
          change="+12%"
          changeType="increase"
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          delay={0.1}
        />
        <StatCard
          title="Present Today"
          value={realStats.presentToday}
          change="+5%"
          changeType="increase"
          icon={<UserCheck className="w-6 h-6 text-white" />}
          color="bg-green-500"
          delay={0.2}
        />
        <StatCard
          title="Attendance Rate"
          value={`${realStats.attendanceRate}%`}
          change="+2.3%"
          changeType="increase"
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          delay={0.3}
        />
        <StatCard
          title="Face Enrolled"
          value={realStats.faceEnrolled}
          change="+8%"
          changeType="increase"
          icon={<Camera className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attendance Trend
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockAttendanceData}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorPresent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Department Distribution
            </h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              >
                {departmentData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/students')}
              className="w-full flex items-center space-x-3 p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/advanced-face-recognition')}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Face Enrollment</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/advanced-face-recognition')}
              className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <UserCheck className="w-5 h-5" />
              <span>Mark Attendance</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/reports')}
              className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Generate Report</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Live Attendance Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <LiveAttendanceFeed limit={8} refreshInterval={10000} />
        </motion.div>
      </div>

      {/* Alerts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Attention Required
            </h4>
            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>• 5 students have attendance below 75% threshold</p>
              <p>• 2 classrooms need timetable updates for next week</p>
              <p>• Face enrollment pending for 23 new students</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
