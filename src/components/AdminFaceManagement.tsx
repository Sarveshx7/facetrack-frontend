import React, { useState, useEffect } from 'react';
import { Users, Trash2, RotateCcw, Download, Upload, Search, Filter, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import advancedFaceRecognitionService from '../services/advancedFaceRecognitionService';

interface StudentFaceData {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  ienNumber: string;
  department: string;
  faceDescriptor?: string;
  enrollmentDate?: string;
  qualityScore?: number;
  enrollmentSteps?: number;
}

interface AdminFaceManagementProps {
  onClose?: () => void;
}

const AdminFaceManagement: React.FC<AdminFaceManagementProps> = ({ onClose }) => {
  const [students, setStudents] = useState<StudentFaceData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentFaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enrolled' | 'not_enrolled'>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'delete' | 're-enroll' | null>(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterStatus]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Get all students from backend
      const response = await fetch('http://localhost:8080/api/students');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setStudents(data.data);
          console.log(`📊 Loaded ${data.data.length} students for face management`);
        }
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error) {
      console.error('❌ Error loading student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.ienNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => {
        const hasEnrollment = student.faceDescriptor && student.faceDescriptor.length > 0;
        return filterStatus === 'enrolled' ? hasEnrollment : !hasEnrollment;
      });
    }

    setFilteredStudents(filtered);
  };

  const handleStudentSelection = (studentId: string, selected: boolean) => {
    const newSelection = new Set(selectedStudents);
    if (selected) {
      newSelection.add(studentId);
    } else {
      newSelection.delete(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const selectAllStudents = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const deleteSelectedFaceData = async () => {
    try {
      const studentIds = Array.from(selectedStudents);
      let successCount = 0;

      for (const studentId of studentIds) {
        const success = await advancedFaceRecognitionService.clearStudentEnrollment(studentId);
        if (success) {
          successCount++;
          
          // Also delete from backend
          try {
            await fetch(`http://localhost:8080/api/students/${studentId}/face-enrollment`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.error(`Failed to delete face data from backend for student ${studentId}`);
          }
        }
      }

      if (successCount > 0) {
        toast.success(`🗑️ Deleted face data for ${successCount} student(s)`);
        await loadStudentData(); // Reload data
        setSelectedStudents(new Set());
      } else {
        toast.error('Failed to delete face data');
      }
    } catch (error) {
      console.error('❌ Error deleting face data:', error);
      toast.error('Error deleting face data');
    }
    
    setShowConfirmDialog(false);
    setActionType(null);
  };

  const reEnrollSelectedStudents = () => {
    const studentIds = Array.from(selectedStudents);
    if (studentIds.length === 1) {
      const student = students.find(s => s.id === studentIds[0]);
      if (student) {
        // Navigate to enrollment page for this student
        toast.success(`Starting re-enrollment for ${student.firstName} ${student.lastName}`);
        // You would typically navigate to the enrollment component here
        // For now, we'll just show a message
        toast('Please use the Face Enrollment page to re-enroll this student', { icon: '📝' });
      }
    } else {
      toast('Please select only one student for re-enrollment', { icon: '⚠️' });
    }
    
    setShowConfirmDialog(false);
    setActionType(null);
  };

  const exportFaceData = async () => {
    try {
      const enrolledStudents = students.filter(s => s.faceDescriptor);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        totalStudents: students.length,
        enrolledStudents: enrolledStudents.length,
        students: enrolledStudents.map(student => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: student.className,
          department: student.department,
          enrollmentDate: student.enrollmentDate,
          qualityScore: student.qualityScore,
          enrollmentSteps: student.enrollmentSteps
          // Note: Not including actual face descriptors for security
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `face-enrollment-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('📥 Face enrollment data exported successfully');
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const getEnrollmentStatus = (student: StudentFaceData) => {
    if (student.faceDescriptor && student.faceDescriptor.length > 0) {
      return {
        status: 'enrolled',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle
      };
    } else {
      return {
        status: 'not_enrolled',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: AlertTriangle
      };
    }
  };

  const enrolledCount = students.filter(s => s.faceDescriptor && s.faceDescriptor.length > 0).length;
  const notEnrolledCount = students.length - enrolledCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-8 h-8 mr-3 text-purple-600" />
                Face Data Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage student face enrollments and data
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                  <p className="text-sm text-blue-600">Total Students</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{enrolledCount}</p>
                  <p className="text-sm text-green-600">Face Enrolled</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{notEnrolledCount}</p>
                  <p className="text-sm text-red-600">Not Enrolled</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{selectedStudents.size}</p>
                  <p className="text-sm text-purple-600">Selected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search and Filter */}
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                >
                  <option value="all">All Students</option>
                  <option value="enrolled">Face Enrolled</option>
                  <option value="not_enrolled">Not Enrolled</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={exportFaceData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              
              {selectedStudents.size > 0 && (
                <>
                  <button
                    onClick={() => {
                      setActionType('re-enroll');
                      setShowConfirmDialog(true);
                    }}
                    disabled={selectedStudents.size !== 1}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Re-enroll
                  </button>
                  
                  <button
                    onClick={() => {
                      setActionType('delete');
                      setShowConfirmDialog(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Face Data
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Students ({filteredStudents.length})
              </h3>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                  onChange={selectAllStudents}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class/Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Face Enrollment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quality Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => {
                    const enrollmentStatus = getEnrollmentStatus(student);
                    const StatusIcon = enrollmentStatus.icon;
                    
                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedStudents.has(student.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {student.ienNumber || student.id}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.className || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {student.department || 'N/A'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrollmentStatus.bgColor} ${enrollmentStatus.borderColor} border`}>
                            <StatusIcon className={`w-4 h-4 mr-1 ${enrollmentStatus.color}`} />
                            <span className={enrollmentStatus.color}>
                              {enrollmentStatus.status === 'enrolled' ? 'Enrolled' : 'Not Enrolled'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {student.qualityScore ? (
                            <span className={`font-medium ${
                              student.qualityScore > 0.8 ? 'text-green-600' :
                              student.qualityScore > 0.6 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {(student.qualityScore * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.enrollmentDate ? (
                            new Date(student.enrollmentDate).toLocaleDateString()
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Action
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {actionType === 'delete' ? (
                  <>Are you sure you want to delete face data for {selectedStudents.size} selected student(s)? This action cannot be undone.</>
                ) : (
                  <>Are you sure you want to re-enroll the selected student? This will clear their existing face data.</>
                )}
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setActionType(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={actionType === 'delete' ? deleteSelectedFaceData : reEnrollSelectedStudents}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    actionType === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {actionType === 'delete' ? 'Delete' : 'Re-enroll'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFaceManagement;
