import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Filter,
  FileText,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Search,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  ienNumber: string;
  department: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedAt?: string;
  confidence?: number;
}

interface ReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  startDate: string;
  endDate: string;
  department: string;
  status: string;
  studentSearch: string;
}

interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

const AttendanceReports: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'today',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    department: '',
    status: '',
    studentSearch: ''
  });

  // Load attendance records
  useEffect(() => {
    loadAttendanceRecords();
  }, [filters.dateRange, filters.startDate, filters.endDate]);

  // Filter records when filters change
  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  const loadAttendanceRecords = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on filter
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      
      const today = new Date();
      switch (filters.dateRange) {
        case 'today':
          startDate = endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'week':
          startDate = format(startOfWeek(today), 'yyyy-MM-dd');
          endDate = format(endOfWeek(today), 'yyyy-MM-dd');
          break;
        case 'month':
          startDate = format(startOfMonth(today), 'yyyy-MM-dd');
          endDate = format(endOfMonth(today), 'yyyy-MM-dd');
          break;
      }

      // Fetch attendance records from API
      const response = await fetch(`http://localhost:8080/api/attendance/records?startDate=${startDate}&endDate=${endDate}&size=1000`);
      const data = await response.json();

      if (data.success) {
        // Transform the data to match our interface
        const transformedRecords: AttendanceRecord[] = data.data.content.map((record: any) => ({
          id: record.id,
          studentId: record.student.id,
          studentName: `${record.student.firstName} ${record.student.lastName}`,
          ienNumber: record.student.ienNumber,
          department: record.student.department,
          date: record.date,
          status: record.status,
          markedAt: record.markedAt,
          confidence: record.confidence
        }));

        setRecords(transformedRecords);
      } else {
        console.error('Failed to load attendance records:', data.message);
        toast.error('Failed to load attendance records');
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast.error('Error loading attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(record => record.department === filters.department);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    // Filter by student search
    if (filters.studentSearch) {
      const searchTerm = filters.studentSearch.toLowerCase();
      filtered = filtered.filter(record => 
        record.studentName.toLowerCase().includes(searchTerm) ||
        record.ienNumber.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredRecords(filtered);

    // Calculate statistics
    const totalRecords = filtered.length;
    const presentCount = filtered.filter(r => r.status === 'PRESENT').length;
    const absentCount = filtered.filter(r => r.status === 'ABSENT').length;
    const lateCount = filtered.filter(r => r.status === 'LATE').length;
    const excusedCount = filtered.filter(r => r.status === 'EXCUSED').length;
    const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;

    setStats({
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate
    });
  };

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      
      // Prepare CSV data
      const csvHeaders = [
        'Date',
        'Student Name',
        'IEN Number',
        'Department',
        'Status',
        'Marked At',
        'Confidence'
      ];

      const csvData = filteredRecords.map(record => [
        record.date,
        record.studentName,
        record.ienNumber,
        record.department,
        record.status,
        record.markedAt || 'N/A',
        record.confidence ? `${Math.round(record.confidence * 100)}%` : 'N/A'
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ABSENT':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'EXCUSED':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Attendance Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive attendance analytics and export functionality
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAttendanceRecords}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={isExporting || filteredRecords.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecords}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-blue-500" />
          Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => updateFilter('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="ECE">Electronics</option>
              <option value="CSD">Computer Science & Design</option>
              <option value="AIDS">AI & Data Science</option>
              <option value="MECH">Mechanical</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>

          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Student
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Name or IEN..."
                value={filters.studentSearch}
                onChange={(e) => updateFilter('studentSearch', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
            Attendance Records ({filteredRecords.length})
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading attendance records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No attendance records found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IEN Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Marked At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.ienNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.markedAt ? format(new Date(record.markedAt), 'HH:mm:ss') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.confidence ? `${Math.round(record.confidence * 100)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
