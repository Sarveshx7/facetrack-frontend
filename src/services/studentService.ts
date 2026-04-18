import { apiService } from './api';
import { API_ENDPOINTS, API_CONFIG, Department } from '../config/api';
import { ApiResponse } from './authService';

export interface Student {
  id?: number;
  ienNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department: Department;
  branch?: string;
  year: number;
  semester: number;
  isActive?: boolean;
  faceEnrolled?: boolean;
  faceDescriptor?: string;
  faceImage?: string;
  enrollmentDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentStats {
  department: Department;
  totalStudents: number;
  activeStudents: number;
  faceEnrolledStudents: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    sort: any;
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface StudentSearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  q?: string;
  department?: Department;
  year?: number;
}

class StudentService {
  /**
   * Create a new student
   */
  async createStudent(student: Student): Promise<Student> {
    try {
      const response = await fetch('http://localhost:8080/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create student');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get all students with pagination
   */
  async getAllStudents(params: StudentSearchParams = {}): Promise<PaginatedResponse<Student>> {
    try {
      const response = await fetch('http://localhost:8080/api/students');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error: any) {
      return {
        content: [],
        pageable: { sort: {}, pageNumber: 0, pageSize: 10 },
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      };
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(id: number): Promise<Student> {
    try {
      const response = await apiService.get<ApiResponse<Student>>(
        API_ENDPOINTS.STUDENTS.BY_ID(id.toString())
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Student not found');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch student');
    }
  }

  /**
   * Get student by IEN number
   */
  async getStudentByIen(ienNumber: string): Promise<Student> {
    try {
      const response = await apiService.get<ApiResponse<Student>>(
        API_ENDPOINTS.STUDENTS.BY_IEN(ienNumber)
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Student not found');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch student');
    }
  }

  /**
   * Update student
   */
  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    try {
      // Try backend first
      const response = await apiService.put<ApiResponse<Student>>(
        API_ENDPOINTS.STUDENTS.BY_ID(id.toString()),
        student
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update student');
      }
    } catch (error: any) {
      // Fallback to demo mode if backend fails
      console.warn('Backend not available, using demo mode:', error.message);
      
      const demoStudents = JSON.parse(localStorage.getItem('demo_students') || '[]');
      const studentIndex = demoStudents.findIndex((s: Student) => s.id === id);
      
      if (studentIndex !== -1) {
        demoStudents[studentIndex] = { ...demoStudents[studentIndex], ...student, updatedAt: new Date().toISOString() };
        localStorage.setItem('demo_students', JSON.stringify(demoStudents));
        return demoStudents[studentIndex];
      } else {
        throw new Error('Student not found');
      }
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(id: number): Promise<void> {
    try {
      // Try backend first
      const response = await apiService.delete<ApiResponse>(
        API_ENDPOINTS.STUDENTS.BY_ID(id.toString())
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete student');
      }
    } catch (error: any) {
      // Fallback to demo mode if backend fails
      console.warn('Backend not available, using demo mode:', error.message);
      
      const demoStudents = JSON.parse(localStorage.getItem('demo_students') || '[]');
      const filteredStudents = demoStudents.filter((s: Student) => s.id !== id);
      localStorage.setItem('demo_students', JSON.stringify(filteredStudents));
    }
  }

  /**
   * Deactivate student (soft delete)
   */
  async deactivateStudent(id: number): Promise<Student> {
    try {
      const response = await apiService.patch<ApiResponse<Student>>(
        API_ENDPOINTS.STUDENTS.DEACTIVATE(id.toString())
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to deactivate student');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to deactivate student');
    }
  }

  /**
   * Search students
   */
  async searchStudents(params: StudentSearchParams): Promise<PaginatedResponse<Student>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.q) queryParams.append('q', params.q);
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      
      const url = `${API_ENDPOINTS.STUDENTS.SEARCH}?${queryParams.toString()}`;
      const response = await apiService.get<ApiResponse<PaginatedResponse<Student>>>(url);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search students');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to search students');
    }
  }

  /**
   * Get students by department
   */
  async getStudentsByDepartment(department: Department): Promise<Student[]> {
    try {
      const response = await apiService.get<ApiResponse<Student[]>>(
        API_ENDPOINTS.STUDENTS.BY_DEPARTMENT(department)
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch students');
    }
  }

  /**
   * Get students by department and year
   */
  async getStudentsByDepartmentAndYear(department: Department, year: number): Promise<Student[]> {
    try {
      const response = await apiService.get<ApiResponse<Student[]>>(
        API_ENDPOINTS.STUDENTS.BY_DEPT_YEAR(department, year)
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch students');
    }
  }

  /**
   * Get active students
   */
  async getActiveStudents(): Promise<Student[]> {
    try {
      const response = await apiService.get<ApiResponse<Student[]>>(
        API_ENDPOINTS.STUDENTS.ACTIVE
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch active students');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch active students');
    }
  }

  /**
   * Get students with face enrolled
   */
  async getStudentsWithFaceEnrolled(): Promise<Student[]> {
    try {
      const response = await apiService.get<ApiResponse<Student[]>>(
        API_ENDPOINTS.STUDENTS.FACE_ENROLLED
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch students with face enrolled');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch students with face enrolled');
    }
  }

  /**
   * Get student statistics by department
   */
  async getStudentStatsByDepartment(): Promise<StudentStats[]> {
    try {
      const response = await apiService.get<ApiResponse<StudentStats[]>>(
        API_ENDPOINTS.STUDENTS.STATS_DEPARTMENT
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch student statistics');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch student statistics');
    }
  }

  /**
   * Bulk create students
   */
  async createStudentsBulk(students: Student[]): Promise<Student[]> {
    try {
      const response = await apiService.post<ApiResponse<Student[]>>(
        API_ENDPOINTS.STUDENTS.BULK,
        students
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create students in bulk');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create students in bulk');
    }
  }

  /**
   * Import students from Excel
   */
  async importStudentsFromExcel(file: File, onProgress?: (progress: number) => void): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.upload<ApiResponse>(
        API_ENDPOINTS.EXCEL.IMPORT_STUDENTS,
        formData,
        onProgress
      );
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to import students');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to import students');
    }
  }

  /**
   * Export students to Excel
   */
  async exportStudentsToExcel(department?: Department): Promise<void> {
    try {
      const url = department 
        ? API_ENDPOINTS.EXCEL.EXPORT_STUDENTS_DEPT(department)
        : API_ENDPOINTS.EXCEL.EXPORT_STUDENTS;
      
      const filename = department 
        ? `students_${department}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      await apiService.download(url, filename);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to export students');
    }
  }

  /**
   * Download student import template
   */
  async downloadStudentTemplate(): Promise<void> {
    try {
      await apiService.download(
        API_ENDPOINTS.EXCEL.TEMPLATE_STUDENTS,
        'student_import_template.xlsx'
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to download template');
    }
  }
}

export const studentService = new StudentService();
export default studentService;
