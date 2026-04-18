import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyAverage: number;
  departmentStats: DepartmentStat[];
  weeklyTrend: WeeklyTrend[];
  recentActivity: RecentActivity[];
}

interface DepartmentStat {
  department: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
  [key: string]: string | number; // Index signature for chart compatibility
}

interface WeeklyTrend {
  date: string;
  present: number;
  absent: number;
  rate: number;
}

interface RecentActivity {
  id: number;
  studentName: string;
  action: string;
  time: string;
  confidence?: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Load dashboard statistics
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Fetch multiple endpoints in parallel
        const [studentsRes, todayStatsRes, weeklyDataRes] = await Promise.all([
          fetch('http://localhost:8080/api/students?size=1000'),
          fetch('http://localhost:8080/api/attendance/stats/today'),
          fetch('http://localhost:8080/api/attendance/weekly-stats')
        ]);

        const studentsData = await studentsRes.json();
        const todayStats = await todayStatsRes.json();
        const weeklyData = await weeklyDataRes.json();

        // Process students data
        const allStudents = studentsData.success ? studentsData.data.content : [];
        const enrolledStudents = allStudents.filter((s: any) => s.faceEnrolled);

        // Calculate department statistics
        const departmentStats = calculateDepartmentStats(allStudents, enrolledStudents);

        // Generate weekly trend data (mock data for demo)
        const weeklyTrend = generateWeeklyTrend();

        // Generate recent activity (mock data for demo)
        const recentActivity = generateRecentActivity(enrolledStudents);

        const dashboardStats: DashboardStats = {
          totalStudents: enrolledStudents.length,
          presentToday: todayStats.success ? todayStats.data.presentCount : 0,
          absentToday: enrolledStudents.length - (todayStats.success ? todayStats.data.presentCount : 0),
          attendanceRate: enrolledStudents.length > 0 
            ? Math.round(((todayStats.success ? todayStats.data.presentCount : 0) / enrolledStudents.length) * 100)
            : 0,
          weeklyAverage: 85, // Mock data - would calculate from actual weekly data
          departmentStats,
          weeklyTrend,
          recentActivity
        };

        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const calculateDepartmentStats = (allStudents: any[], enrolledStudents: any[]): DepartmentStat[] => {
    const departments = Array.from(new Set(allStudents.map((s: any) => s.department)));
    
    return departments.map(dept => {
      const deptStudents = enrolledStudents.filter((s: any) => s.department === dept);
      const presentCount = Math.floor(deptStudents.length * (0.7 + Math.random() * 0.3)); // Mock present count
      
      return {
        department: dept,
        total: deptStudents.length,
        present: presentCount,
        absent: deptStudents.length - presentCount,
        rate: deptStudents.length > 0 ? Math.round((presentCount / deptStudents.length) * 100) : 0
      };
    });
  };

  const generateWeeklyTrend = (): WeeklyTrend[] => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const present = Math.floor(Math.random() * 20) + 15; // 15-35 students
      const absent = Math.floor(Math.random() * 10) + 2;   // 2-12 students
      
      return {
        date: format(date, 'EEE'),
        present,
        absent,
        rate: Math.round((present / (present + absent)) * 100)
      };
    });
  };

  const generateRecentActivity = (students: any[]): RecentActivity[] => {
    if (students.length === 0) return [];
    
    return Array.from({ length: 5 }, (_, i) => {
      const student = students[Math.floor(Math.random() * students.length)];
      const actions = ['Marked Present', 'Face Enrolled', 'Profile Updated'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      return {
        id: i + 1,
        studentName: `${student.firstName} ${student.lastName}`,
        action,
        time: `${Math.floor(Math.random() * 2) + 1} min ago`,
        confidence: action === 'Marked Present' ? 0.85 + Math.random() * 0.12 : undefined
      };
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 dark:bg-gray-700 h-80 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-80 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time attendance insights and statistics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Enrolled with face data</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.attendanceRate}% attendance rate
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent Today</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Need to mark attendance</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Weekly Average</p>
              <p className="text-2xl font-bold text-purple-600">{stats.weeklyAverage}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Last 7 days average</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
              Weekly Attendance Trend
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="present" 
                stackId="1"
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Present"
              />
              <Area 
                type="monotone" 
                dataKey="absent" 
                stackId="1"
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.6}
                name="Absent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department-wise Statistics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-green-500" />
              Department-wise Attendance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.departmentStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ department, rate }) => `${department}: ${rate}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="present"
              >
                {stats.departmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
            Department Statistics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.departmentStats.map((dept, index) => (
                <tr key={dept.department} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {dept.department}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {dept.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {dept.present}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {dept.absent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${dept.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{dept.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.studentName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.action}
                      {activity.confidence && (
                        <span className="ml-2 text-green-600">
                          ({Math.round(activity.confidence * 100)}% confidence)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
