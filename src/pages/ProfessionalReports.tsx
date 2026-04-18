import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  Building2,
  CheckCircle,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfessionalReports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const departments = ['CE', 'CSD', 'AIDS', 'MECHATRONICS', 'CIVIL', 'IT'];

  const downloadReport = async (type: string) => {
    try {
      setIsGenerating(true);
      let url = '';
      
      switch (type) {
        case 'comprehensive':
          url = `http://localhost:8080/api/reports/excel/comprehensive?department=${selectedDepartment}&startDate=${startDate}&endDate=${endDate}`;
          break;
        case 'summary':
          url = 'http://localhost:8080/api/reports/excel/summary';
          break;
        case 'department':
          if (!selectedDepartment) {
            toast.error('Please select a department');
            setIsGenerating(false);
            return;
          }
          url = `http://localhost:8080/api/reports/excel/department/${selectedDepartment}`;
          break;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `FaceTrackU_Report_${type}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Professional Reports</h1>
            </div>
            <p className="text-emerald-100">
              Generate comprehensive Excel reports with charts and analytics
            </p>
          </div>
          <FileSpreadsheet className="w-16 h-16 opacity-30" />
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Report Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </motion.div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Comprehensive Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FileSpreadsheet className="w-12 h-12 text-blue-500" />
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs font-semibold rounded-full">
              EXCEL
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Comprehensive Report
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Complete attendance data with multiple sheets including summary, student list, and analytics
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Summary Sheet
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Attendance Data
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Student List
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Analytics & Insights
            </li>
          </ul>
          <button
            onClick={() => downloadReport('comprehensive')}
            disabled={isGenerating}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Summary Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-12 h-12 text-green-500" />
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs font-semibold rounded-full">
              EXCEL
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Summary Report
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Quick overview with key metrics and statistics for all departments
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Overall Statistics
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Department Breakdown
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Attendance Rates
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Generated Timestamp
            </li>
          </ul>
          <button
            onClick={() => downloadReport('summary')}
            disabled={isGenerating}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Department Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-12 h-12 text-purple-500" />
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 text-xs font-semibold rounded-full">
              EXCEL
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Department Report
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Detailed report for a specific department with student-wise breakdown
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Department Stats
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Student Details
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Individual Rates
            </li>
            <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Year-wise Data
            </li>
          </ul>
          <button
            onClick={() => downloadReport('department')}
            disabled={isGenerating || !selectedDepartment}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </>
            )}
          </button>
          {!selectedDepartment && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
              ⚠️ Select a department first
            </p>
          )}
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📊 Report Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Included in Reports:</h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• Professional formatting with college branding</li>
              <li>• Multiple sheets for different data views</li>
              <li>• Styled headers and color coding</li>
              <li>• Auto-sized columns for readability</li>
              <li>• Calculated metrics and percentages</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Coming Soon:</h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• PDF exports with charts</li>
              <li>• CSV format for data analysis</li>
              <li>• Email delivery to faculty</li>
              <li>• Scheduled automatic reports</li>
              <li>• Custom report templates</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfessionalReports;
