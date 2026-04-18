export interface AttendanceRecord {
  id?: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    ienNumber: string;
    department: string;
  };
  checkInTime: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  markingMethod: 'FACE_RECOGNITION' | 'MANUAL';
  faceConfidence?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceStats {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  unmarkedCount: number;
  totalStudents: number;
}

class AttendanceService {
  private baseUrl = 'http://localhost:8080/api';

  // Mark attendance for a student
  async markAttendance(studentId: number, confidence: number = 1.0): Promise<boolean> {
    try {
      // Check if attendance already marked today
      const todayAttendance = await this.getTodayAttendance();
      const alreadyMarked = todayAttendance.find(record => 
        record.student?.id === studentId || record.studentId === studentId
      );
      
      if (alreadyMarked) {
        console.log('⚠️ Attendance already marked for student:', studentId);
        return false; // Don't show error toast, just return false
      }
      
      const attendanceData = {
        studentId,
        markingMethod: 'FACE_RECOGNITION',
        faceConfidence: confidence,
        checkInTime: new Date().toISOString(),
        status: 'PRESENT'
      };
      
      console.log('📝 Marking attendance:', attendanceData);
      
      const response = await fetch(`${this.baseUrl}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Attendance marked successfully:', result);
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to mark attendance:', error.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
      return false;
    }
  }

  // Get today's attendance statistics
  async getTodayStats(): Promise<AttendanceStats> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance/stats/today`);
      if (response.ok) {
        const result = await response.json();
        return result.data || {
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          unmarkedCount: 0,
          totalStudents: 0
        };
      }
      return {
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        unmarkedCount: 0,
        totalStudents: 0
      };
    } catch (error) {
      console.error('❌ Error getting today stats:', error);
      return {
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        unmarkedCount: 0,
        totalStudents: 0
      };
    }
  }

  // Get today's attendance records
  async getTodayAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance/today?size=50`);
      if (response.ok) {
        const result = await response.json();
        return result.data?.content || [];
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting today attendance:', error);
      return [];
    }
  }

  // Reset all attendance data (for testing)
  async resetAllAttendance(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance/reset-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🗑️ All attendance data reset:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error resetting attendance:', error);
      return false;
    }
  }

  // Manual attendance marking
  async markManualAttendance(studentId: number, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'): Promise<boolean> {
    try {
      const attendanceData = {
        studentId,
        markingMethod: 'MANUAL',
        checkInTime: new Date().toISOString(),
        status
      };
      
      const response = await fetch(`${this.baseUrl}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Manual attendance marked:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error marking manual attendance:', error);
      return false;
    }
  }
}

const attendanceService = new AttendanceService();
export default attendanceService;
