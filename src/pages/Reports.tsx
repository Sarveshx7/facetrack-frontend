import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { DEPARTMENTS, Department } from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AttendanceReports from '../components/AttendanceReports';
import AttendanceCalendar from '../components/AttendanceCalendar';
import StudentProfileModal from '../components/StudentProfileModal';

interface ReportFilters {
  startDate: string;
  endDate: string;
  department: Department | '';
  year: number | '';
  subject: string;
  reportType: 'attendance' | 'performance' | 'department' | 'student';
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface DepartmentStats {
  department: string;
  totalStudents: number;
  averageAttendance: number;
  presentToday: number;
  color: string;
  [key: string]: string | number;
}

interface StudentPerformance {
  name: string;
  ienNumber: string;
  department: string;
  attendance: number;
  totalClasses: number;
  percentage: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'detailed' | 'calendar'>('analytics');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    year: '',
    subject: '',
    reportType: 'attendance',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data
  const mockAttendanceData: AttendanceData[] = [
    { date: '2025-01-01', present: 85, absent: 15, late: 5, percentage: 85 },
    { date: '2025-01-02', present: 92, absent: 8, late: 3, percentage: 92 },
    { date: '2025-01-03', present: 88, absent: 12, late: 7, percentage: 88 },
    { date: '2025-01-04', present: 95, absent: 5, late: 2, percentage: 95 },
    { date: '2025-01-05', present: 90, absent: 10, late: 4, percentage: 90 },
    { date: '2025-01-06', present: 87, absent: 13, late: 6, percentage: 87 },
    { date: '2025-01-07', present: 93, absent: 7, late: 3, percentage: 93 },
  ];

  const mockDepartmentStats: DepartmentStats[] = [
    { department: 'CE', totalStudents: 120, averageAttendance: 92, presentToday: 110, color: '#3B82F6' },
    { department: 'CSD', totalStudents: 80, averageAttendance: 88, presentToday: 70, color: '#10B981' },
    { department: 'AIDS', totalStudents: 60, averageAttendance: 90, presentToday: 54, color: '#F59E0B' },
    { department: 'MECHATRONICS', totalStudents: 45, averageAttendance: 85, presentToday: 38, color: '#EF4444' },
    { department: 'CIVIL', totalStudents: 100, averageAttendance: 87, presentToday: 87, color: '#8B5CF6' },
    { department: 'IT', totalStudents: 75, averageAttendance: 91, presentToday: 68, color: '#06B6D4' },
  ];

  const mockStudentPerformance: StudentPerformance[] = [
    { name: 'John Doe', ienNumber: 'IEN001', department: 'CE', attendance: 45, totalClasses: 50, percentage: 90, status: 'excellent' },
    { name: 'Jane Smith', ienNumber: 'IEN002', department: 'CE', attendance: 42, totalClasses: 50, percentage: 84, status: 'good' },
    { name: 'Mike Johnson', ienNumber: 'IEN003', department: 'CSD', attendance: 38, totalClasses: 50, percentage: 76, status: 'average' },
    { name: 'Sarah Wilson', ienNumber: 'IEN004', department: 'AIDS', attendance: 47, totalClasses: 50, percentage: 94, status: 'excellent' },
    { name: 'David Brown', ienNumber: 'IEN005', department: 'IT', attendance: 35, totalClasses: 50, percentage: 70, status: 'poor' },
  ];

  useEffect(() => {
    loadReportData();
  }, [filters]);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/attendance/subjects');
      const data = await response.json();
      
      if (data.success && data.data) {
        setAvailableSubjects(data.data);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from backend
      const [studentsRes, attendanceRes, todayStatsRes, departmentStatsRes] = await Promise.all([
        fetch('http://localhost:8080/api/students?size=1000'),
        fetch('http://localhost:8080/api/attendance'),
        fetch('http://localhost:8080/api/attendance/stats/today'),
        fetch('http://localhost:8080/api/students/stats/department')
      ]);

      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();
      const todayStats = await todayStatsRes.json();
      const departmentStatsData = await departmentStatsRes.json();

      if (studentsData.success) {
        const allStudents = studentsData.data.content || studentsData.data;
        
        // Use department stats from backend
        if (departmentStatsData.success && departmentStatsData.data) {
          // Enhance with attendance data if available
          const deptStats = departmentStatsData.data.map((dept: any) => ({
            ...dept,
            averageAttendance: 0,
            presentToday: 0,
            totalAttendance: 0
          }));

          // Calculate attendance stats if available
          if (attendanceData.success && attendanceData.data) {
            const attendanceRecords = attendanceData.data;
            const today = new Date().toDateString();
            
            // Count attendance per department
            const deptAttendanceCount: { [key: string]: number } = {};
            
            attendanceRecords.forEach((record: any) => {
              const dept = record.student?.department;
              const recordDate = new Date(record.timestamp).toDateString();
              
              if (dept) {
                // Count total attendance
                deptAttendanceCount[dept] = (deptAttendanceCount[dept] || 0) + 1;
                
                // Count today's attendance
                if (recordDate === today) {
                  const deptStat = deptStats.find((d: any) => d.department === dept);
                  if (deptStat) {
                    deptStat.presentToday++;
                  }
                }
              }
            });
            
            // Calculate average attendance percentage
            deptStats.forEach((dept: any) => {
              const totalStudents = dept.totalStudents || 1;
              const totalAttendance = deptAttendanceCount[dept.department] || 0;
              // Assuming 50 total classes (you can make this dynamic)
              const totalPossibleAttendance = totalStudents * 50;
              dept.averageAttendance = totalPossibleAttendance > 0 
                ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
                : 0;
            });
          }

          setDepartmentStats(deptStats);
        }

        // Calculate student performance from real data
        const studentPerf = allStudents.slice(0, 50).map((student: any) => {
          const studentAttendance = attendanceData.success 
            ? (attendanceData.data || []).filter((a: any) => a.student?.id === student.id)
            : [];
          
          const attendanceCount = studentAttendance.length;
          const totalClasses = 50; // You can make this dynamic
          const percentage = totalClasses > 0 ? Math.round((attendanceCount / totalClasses) * 100) : 0;
          
          let status: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
          if (percentage >= 90) status = 'excellent';
          else if (percentage >= 80) status = 'good';
          else if (percentage >= 70) status = 'average';
          
          return {
            name: `${student.firstName} ${student.lastName}`,
            ienNumber: student.ienNumber,
            department: student.department,
            attendance: attendanceCount,
            totalClasses,
            percentage,
            status
          };
        });
        
        setStudentPerformance(studentPerf);
      }

      // Calculate real attendance trend data from last 7 days
      if (attendanceData.success && attendanceData.data) {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const trendData = last7Days.map(date => {
          const dayRecords = (attendanceData.data || []).filter((record: any) => {
            const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
            return recordDate === date;
          });

          const present = dayRecords.length;
          const totalStudents = studentsData.data?.content?.length || studentsData.data?.length || 100;
          const absent = totalStudents - present;
          const percentage = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

          return {
            date,
            present,
            absent,
            late: 0, // Can be calculated if you have late status
            percentage
          };
        });

        setAttendanceData(trendData);
      } else {
        // Fallback to mock data if no real data available
        setAttendanceData(mockAttendanceData);
      }
      
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
      // Use mock data on error
      setAttendanceData(mockAttendanceData);
      setDepartmentStats(mockDepartmentStats);
      setStudentPerformance(mockStudentPerformance);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsGenerating(true);
    try {
      // Fetch real attendance data from backend
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.department) params.append('department', filters.department);
      if (filters.subject) params.append('subject', filters.subject);
      
      const response = await fetch(`http://localhost:8080/api/attendance?${params.toString()}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch attendance data');
      }
      
      const attendanceRecords = data.data;
      
      if (format === 'csv') {
        downloadCSV(attendanceRecords);
      } else if (format === 'excel') {
        downloadExcel(attendanceRecords);
      } else if (format === 'pdf') {
        downloadPDF(attendanceRecords);
      }
      
      toast.success(`${format.toUpperCase()} report downloaded successfully!`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to generate ${format.toUpperCase()} report`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = (data: any[]) => {
    // Create CSV content
    const headers = ['Date', 'Student Name', 'IEN Number', 'Department', 'Subject', 'Confidence', 'Method'];
    const csvRows = [
      headers.join(','),
      ...data.map(record => [
        new Date(record.timestamp).toLocaleDateString(),
        `"${record.student?.firstName} ${record.student?.lastName}"`,
        record.student?.ienNumber || '',
        record.student?.department || '',
        record.subject || 'N/A',
        record.confidence ? `${(record.confidence * 100).toFixed(2)}%` : 'N/A',
        record.method || 'FACE_RECOGNITION'
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${filters.startDate}_to_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = (data: any[]) => {
    // Create Excel-like HTML table and download
    const tableRows = data.map(record => `
      <tr>
        <td>${new Date(record.timestamp).toLocaleString()}</td>
        <td>${record.student?.firstName} ${record.student?.lastName}</td>
        <td>${record.student?.ienNumber || ''}</td>
        <td>${record.student?.department || ''}</td>
        <td>${record.subject || 'N/A'}</td>
        <td>${record.confidence ? `${(record.confidence * 100).toFixed(2)}%` : 'N/A'}</td>
        <td>${record.method || 'FACE_RECOGNITION'}</td>
      </tr>
    `).join('');
    
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <h2>Attendance Report</h2>
        <p>Period: ${filters.startDate} to ${filters.endDate}</p>
        <p>Department: ${filters.department || 'All'}</p>
        <p>Subject: ${filters.subject || 'All'}</p>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Student Name</th>
              <th>IEN Number</th>
              <th>Department</th>
              <th>Subject</th>
              <th>Confidence</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${filters.startDate}_to_${filters.endDate}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = (data: any[]) => {
    // Create printable HTML for PDF
    const tableRows = data.map(record => `
      <tr>
        <td>${new Date(record.timestamp).toLocaleString()}</td>
        <td>${record.student?.firstName} ${record.student?.lastName}</td>
        <td>${record.student?.ienNumber || ''}</td>
        <td>${record.student?.department || ''}</td>
        <td>${record.subject || 'N/A'}</td>
        <td>${record.confidence ? `${(record.confidence * 100).toFixed(2)}%` : 'N/A'}</td>
      </tr>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align: center; }
            .header { margin-bottom: 20px; }
            .header p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>📊 Attendance Report</h1>
          <div class="header">
            <p><strong>Period:</strong> ${filters.startDate} to ${filters.endDate}</p>
            <p><strong>Department:</strong> ${filters.department || 'All Departments'}</p>
            <p><strong>Subject:</strong> ${filters.subject || 'All Subjects'}</p>
            <p><strong>Total Records:</strong> ${data.length}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Student Name</th>
                <th>IEN Number</th>
                <th>Department</th>
                <th>Subject</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <br>
          <button onclick="window.print()">Print / Save as PDF</button>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'average':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredStudents = studentPerformance.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.ienNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overallStats = {
    totalStudents: departmentStats.reduce((sum, dept) => sum + dept.totalStudents, 0),
    averageAttendance: Math.round(departmentStats.reduce((sum, dept) => sum + dept.averageAttendance, 0) / departmentStats.length),
    presentToday: departmentStats.reduce((sum, dept) => sum + dept.presentToday, 0),
    departments: departmentStats.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive attendance reports, analytics, and export functionality
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => generateReport('csv')}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />}
            <span>CSV</span>
          </button>
          <button
            onClick={() => generateReport('excel')}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />}
            <span>Excel</span>
          </button>
          <button
            onClick={() => generateReport('pdf')}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : <FileText className="w-4 h-4" />}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'detailed'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Database className="w-4 h-4 mr-2" />
            Detailed Records
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'detailed' ? (
        <AttendanceReports />
      ) : activeTab === 'calendar' ? (
        <AttendanceCalendar />
      ) : (
        <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value as Department | '' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Departments</option>
              {Object.values(DEPARTMENTS).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {availableSubjects.length > 0 ? (
                availableSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))
              ) : (
                <>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="Algorithms">Algorithms</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Operating Systems">Operating Systems</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="attendance">Attendance Report</option>
              <option value="performance">Performance Report</option>
              <option value="department">Department Analysis</option>
              <option value="student">Student Details</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={loadReportData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">{overallStats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">{overallStats.averageAttendance}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Today</p>
              <p className="text-2xl font-bold text-purple-600">{overallStats.presentToday}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
              <p className="text-2xl font-bold text-orange-600">{overallStats.departments}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attendance Trend
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="percentage" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Department Distribution
            </h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={departmentStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalStudents"
                  label={({ department, totalStudents }) => `${department}: ${totalStudents}`}
                >
                  {departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Department Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Department Performance
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageAttendance" fill="#3B82F6" name="Average Attendance %" />
              <Bar dataKey="presentToday" fill="#10B981" name="Present Today" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Student Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Student Performance
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.ienNumber}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          onClick={() => {
                            // Create a student object from the performance data
                            const [firstName, ...lastNameParts] = student.name.split(' ');
                            const lastName = lastNameParts.join(' ');
                            setSelectedStudent({
                              firstName,
                              lastName,
                              ienNumber: student.ienNumber,
                              department: student.department,
                            });
                            setIsModalOpen(true);
                          }}
                        >
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {student.ienNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {student.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {student.attendance}/{student.totalClasses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              student.percentage >= 90 ? 'bg-green-500' :
                              student.percentage >= 80 ? 'bg-blue-500' :
                              student.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Low Attendance Alert */}
      {studentPerformance.some(s => s.percentage < 75) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Low Attendance Alert
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                The following students have attendance below 75% and require immediate attention:
              </p>
              <div className="space-y-1">
                {studentPerformance
                  .filter(s => s.percentage < 75)
                  .map(student => (
                    <div key={student.ienNumber} className="text-sm text-red-700 dark:text-red-300">
                      • {student.name} ({student.ienNumber}) - {student.percentage}% attendance
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
        </div>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Reports;
