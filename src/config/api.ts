// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CREATE_ADMIN: '/auth/create-admin',
    ME: '/auth/me',
  },
  
  // Students
  STUDENTS: {
    BASE: '/students',
    BY_ID: (id: string) => `/students/${id}`,
    BY_IEN: (ien: string) => `/students/ien/${ien}`,
    BY_ROLL: (roll: string) => `/students/roll/${roll}`,
    BY_DEPARTMENT: (dept: string) => `/students/department/${dept}`,
    BY_DEPT_YEAR: (dept: string, year: number) => `/students/department/${dept}/year/${year}`,
    SEARCH: '/students/search',
    ACTIVE: '/students/active',
    FACE_ENROLLED: '/students/face-enrolled',
    STATS_DEPARTMENT: '/students/stats/department',
    BULK: '/students/bulk',
    DEACTIVATE: (id: string) => `/students/${id}/deactivate`,
  },
  
  // Face Recognition
  FACE: {
    ENROLL: (ien: string) => `/face/enroll/${ien}`,
    RECOGNIZE: '/face/recognize',
    VERIFY: (ien: string) => `/face/verify/${ien}`,
    STATUS: (ien: string) => `/face/status/${ien}`,
    DELETE_ENROLLMENT: (ien: string) => `/face/enroll/${ien}`,
    STATS: '/face/stats',
  },
  
  // Attendance
  ATTENDANCE: {
    BASE: '/attendance',
    MARK_FACE: '/attendance/mark/face',
    MARK_MANUAL: '/attendance/mark/manual',
    BY_DATE: (date: string) => `/attendance/date/${date}`,
    BY_DATE_RANGE: '/attendance/date-range',
    BY_DEPT_DATE: (dept: string, date: string) => `/attendance/department/${dept}/date/${date}`,
    STUDENT_HISTORY: (ien: string) => `/attendance/student/${ien}/history`,
    STUDENT_STATS: (ien: string) => `/attendance/student/${ien}/stats`,
    STUDENT_SUBJECTS: (ien: string) => `/attendance/student/${ien}/subjects`,
    DEPT_STATS: '/attendance/stats/department',
    UPDATE: (id: string) => `/attendance/${id}`,
  },
  
  // Timetable
  TIMETABLE: {
    BASE: '/timetable',
    BY_ID: (id: string) => `/timetable/${id}`,
    WEEKLY_SCHEDULE: '/timetable/schedule/weekly',
    CURRENT_CLASS: '/timetable/current-class',
    SUBJECTS: '/timetable/subjects',
    FILTER: '/timetable/filter',
    BY_SUBJECT: (subject: string) => `/timetable/subject/${subject}`,
    BY_FACULTY: (faculty: string) => `/timetable/faculty/${faculty}`,
    BY_CLASSROOM: (classroom: string) => `/timetable/classroom/${classroom}`,
  },
  
  // Excel
  EXCEL: {
    IMPORT_STUDENTS: '/excel/import/students',
    EXPORT_STUDENTS: '/excel/export/students',
    EXPORT_STUDENTS_DEPT: (dept: string) => `/excel/export/students/department/${dept}`,
    EXPORT_ATTENDANCE: '/excel/export/attendance',
    EXPORT_ATTENDANCE_DEPT: (dept: string) => `/excel/export/attendance/department/${dept}`,
    TEMPLATE_STUDENTS: '/excel/template/students',
    STATS: '/excel/stats',
  },
  
  // Health
  HEALTH: '/health',
  DB_TEST: '/db-test',
};

// Department enum
export const DEPARTMENTS = {
  CE: 'CE',
  CSD: 'CSD', 
  AIDS: 'AIDS',
  MECHATRONICS: 'MECHATRONICS',
  CIVIL: 'CIVIL',
  IT: 'IT',
} as const;

export type Department = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];

// Attendance Status enum
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

// Recognition Method enum
export const RECOGNITION_METHOD = {
  FACE_RECOGNITION: 'FACE_RECOGNITION',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  QR_CODE: 'QR_CODE',
  RFID: 'RFID',
} as const;

export type RecognitionMethod = typeof RECOGNITION_METHOD[keyof typeof RECOGNITION_METHOD];

// Class Type enum
export const CLASS_TYPE = {
  LECTURE: 'LECTURE',
  PRACTICAL: 'PRACTICAL',
  TUTORIAL: 'TUTORIAL',
  SEMINAR: 'SEMINAR',
  EXAM: 'EXAM',
  WORKSHOP: 'WORKSHOP',
} as const;

export type ClassType = typeof CLASS_TYPE[keyof typeof CLASS_TYPE];
