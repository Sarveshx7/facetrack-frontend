import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  TrendingUp,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface AttendanceRecord {
  id: number;
  timestamp: string;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    ienNumber: string;
    department: string;
  };
  confidence: number;
  method: string;
  subject?: string;
}

interface DayData {
  date: Date;
  count: number;
  percentage: number;
  records: AttendanceRecord[];
}

const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Map<string, DayData>>(new Map());
  const [selectedDate, setSelectedDate] = useState<DayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    loadMonthData();
  }, [currentDate]);

  const loadMonthData = async () => {
    setIsLoading(true);
    try {
      // Fetch attendance for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const [attendanceRes, studentsRes] = await Promise.all([
        fetch('http://localhost:8080/api/attendance'),
        fetch('http://localhost:8080/api/students?size=1000')
      ]);

      const attendanceData = await attendanceRes.json();
      const studentsData = await studentsRes.json();

      if (studentsData.success) {
        const allStudents = studentsData.data.content || studentsData.data;
        setTotalStudents(allStudents.length);
      }

      if (attendanceData.success && attendanceData.data) {
        const records: AttendanceRecord[] = attendanceData.data;
        const dayMap = new Map<string, DayData>();

        records.forEach(record => {
          const recordDate = new Date(record.timestamp);
          if (recordDate >= startOfMonth && recordDate <= endOfMonth) {
            const dateKey = recordDate.toDateString();
            
            if (!dayMap.has(dateKey)) {
              dayMap.set(dateKey, {
                date: recordDate,
                count: 0,
                percentage: 0,
                records: []
              });
            }
            
            const dayData = dayMap.get(dateKey)!;
            dayData.count++;
            dayData.records.push(record);
          }
        });

        // Calculate percentages
        dayMap.forEach(dayData => {
          dayData.percentage = totalStudents > 0 
            ? Math.round((dayData.count / totalStudents) * 100)
            : 0;
        });

        setAttendanceData(dayMap);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getColorForDay = (date: Date): string => {
    const dayData = attendanceData.get(date.toDateString());
    if (!dayData) return 'bg-gray-100 dark:bg-gray-700';
    
    const percentage = dayData.percentage;
    if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/30 border-green-500';
    if (percentage >= 75) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500';
    if (percentage >= 40) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-500';
    return 'bg-red-100 dark:bg-red-900/30 border-red-500';
  };

  const handleDateClick = (date: Date) => {
    const dayData = attendanceData.get(date.toDateString());
    if (dayData) {
      setSelectedDate(dayData);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Attendance Calendar
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
              disabled={isLoading}
            >
              Today
            </button>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
          {monthName}
        </h3>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mb-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">90%+</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">75-89%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">60-74%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-orange-100 border border-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">40-59%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-red-100 border border-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">&lt;40%</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {getDaysInMonth().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayData = attendanceData.get(date.toDateString());
              const colorClass = getColorForDay(date);
              const today = isToday(date);

              return (
                <motion.button
                  key={date.toISOString()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDateClick(date)}
                  disabled={!dayData}
                  className={`aspect-square rounded-lg border-2 p-2 transition-all ${colorClass} ${
                    today ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                  } ${
                    dayData ? 'cursor-pointer hover:shadow-md' : 'cursor-default opacity-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {date.getDate()}
                    </span>
                    {dayData && (
                      <div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {dayData.count}
                        <div className="text-[10px]">{dayData.percentage}%</div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Date Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {selectedDate.date.toLocaleDateString('default', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span className="text-lg">{selectedDate.count} Students</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-lg">{selectedDate.percentage}% Attendance</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Attendance Records
                </h4>
                <div className="space-y-3">
                  {selectedDate.records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-semibold">
                            {record.student.firstName[0]}{record.student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {record.student.firstName} {record.student.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {record.student.ienNumber} • {record.student.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(record.timestamp).toLocaleTimeString('default', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {record.confidence && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {(record.confidence * 100).toFixed(1)}% confidence
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceCalendar;
