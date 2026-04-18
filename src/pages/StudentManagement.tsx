import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  FileText,
  X,
  User,
  Camera,
  UserX,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BulkStudentImport from '../components/BulkStudentImport';
import LoadingSpinner from '../components/LoadingSpinner';
import { Student, studentService } from '../services/studentService';
import { DEPARTMENTS, Department } from '../config/api';

interface StudentFormData {
  ienNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: Department;
  year: number;
  semester: number;
}

// Separate modal component to prevent re-creation and focus issues
const StudentModal: React.FC<{
  isOpen: boolean;
  isEdit: boolean;
  formData: StudentFormData;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateField: (field: keyof StudentFormData, value: any) => void;
}> = React.memo(({ isOpen, isEdit, formData, onClose, onSubmit, onUpdateField }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IEN Number
              </label>
              <input
                type="text"
                value={formData.ienNumber}
                onChange={(e) => onUpdateField('ienNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter IEN number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roll Number
              </label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => onUpdateField('rollNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter roll number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => onUpdateField('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => onUpdateField('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onUpdateField('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => onUpdateField('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => onUpdateField('department', e.target.value as Department)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {Object.values(DEPARTMENTS).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => onUpdateField('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {[1, 2, 3, 4].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => onUpdateField('semester', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              {isEdit ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<Department | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');

  const [formData, setFormData] = useState<StudentFormData>({
    ienNumber: '',
    rollNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: 'CE',
    year: 1,
    semester: 1,
  });

  // Memoized form update function to prevent re-renders
  const updateFormData = useCallback((field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Load students
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      // Force refresh with timestamp to avoid caching
      const response = await studentService.getAllStudents({ size: 100 });
      console.log('🔄 Loaded students:', response.content);
      setStudents(response.content);
    } catch (error: any) {
      console.error('❌ Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      const studentData = { 
        ...formData, 
        branch: formData.department 
      };
      
      console.log('🔍 Main form sending student:', studentData);
      
      // Use direct fetch like the debug component
      const response = await fetch('http://localhost:8080/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      
      const data = await response.json();
      console.log('🔍 Main form response:', data);
      
      if (data.success) {
        setShowAddModal(false);
        resetForm();
        toast.success('Student added successfully');
        await loadStudents(); // Reload immediately
      } else {
        throw new Error(data.message || 'Failed to add student');
      }
      
    } catch (error: any) {
      console.error('❌ Main form error:', error);
      toast.error(error.message || 'Failed to add student');
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      // Add branch as same as department for backend compatibility
      const studentData = { ...formData, branch: formData.department };
      await studentService.updateStudent(selectedStudent.id!, studentData as Partial<Student>);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      resetForm();
      loadStudents();
    } catch (error: any) {
      toast.error('Failed to update student');
      console.error('Edit student error:', error);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
      try {
        await studentService.deleteStudent(student.id!);
        toast.success('Student deleted successfully');
        loadStudents();
      } catch (error: any) {
        toast.error('Failed to delete student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      ienNumber: '',
      rollNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: 'CE',
      year: 1,
      semester: 1,
    });
    setSelectedStudent(null);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      ienNumber: student.ienNumber,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      department: student.department,
      year: student.year,
      semester: student.semester,
    });
    setShowEditModal(true);
  };

  // Modal handlers
  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  }, []);

  const handleSubmitModal = async () => {
    if (showEditModal) {
      await handleEditStudent();
    } else {
      await handleAddStudent();
    }
  };

  const handleFaceEnrollment = (student: Student) => {
    setSelectedStudent(student);
    setShowFaceCapture(true);
  };

  const handleFaceCapture = async (faceDescriptor: string, faceImage: string) => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`http://localhost:8080/api/students/${selectedStudent.id}/face-enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceDescriptor,
          faceImage
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Face enrolled successfully!');
        await loadStudents(); // Refresh the student list
        setShowFaceCapture(false);
        setSelectedStudent(null);
      } else {
        throw new Error(data.message || 'Failed to enroll face');
      }
    } catch (error: any) {
      console.error('Face enrollment error:', error);
      toast.error(error.message || 'Failed to enroll face');
    }
  };

  const handleRemoveFaceData = async (student: Student) => {
    if (!student.faceEnrolled) {
      toast.error('Student has no face data to remove');
      return;
    }

    const confirmRemove = window.confirm(
      `Are you sure you want to remove face data for ${student.firstName} ${student.lastName}? This action cannot be undone.`
    );

    if (!confirmRemove) return;

    try {
      const response = await fetch(`http://localhost:8080/api/students/${student.id}/remove-face`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Face data removed successfully!');
        await loadStudents(); // Refresh the student list
      } else {
        throw new Error(data.message || 'Failed to remove face data');
      }
    } catch (error: any) {
      console.error('Remove face data error:', error);
      toast.error(error.message || 'Failed to remove face data');
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.ienNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || student.department === filterDepartment;
    const matchesYear = !filterYear || student.year === filterYear;
    
    return matchesSearch && matchesDepartment && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage student records, import/export data, and track enrollment</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadStudents}
            className="flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Template
          </button>
          <button className="flex items-center px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value as Department | '')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Departments</option>
          {Object.values(DEPARTMENTS).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Years</option>
          {[1, 2, 3, 4].map(year => (
            <option key={year} value={year}>Year {year}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredStudents.length} students
        </span>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IEN/Roll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Year/Sem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{student.ienNumber}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{student.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{student.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      Year {student.year}, Sem {student.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {student.faceEnrolled && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Face Enrolled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!student.faceEnrolled ? (
                          <button
                            onClick={() => handleFaceEnrollment(student)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Enroll Face"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRemoveFaceData(student)}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                            title="Remove Face Data"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(student)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={showAddModal}
        isEdit={false}
        formData={formData}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        onUpdateField={updateFormData}
      />
      
      <StudentModal
        isOpen={showEditModal}
        isEdit={true}
        formData={formData}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        onUpdateField={updateFormData}
      />

      {/* Face enrollment functionality removed - use main face recognition system */}

      <BulkStudentImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={() => {
          loadStudents();
          setShowBulkImport(false);
        }}
      />
    </div>
  );
};

export default StudentManagement;
