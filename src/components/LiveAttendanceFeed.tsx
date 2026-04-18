import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import StudentProfileModal from './StudentProfileModal';

interface AttendanceRecord {
  id: number;
  timestamp: string;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    ienNumber: string;
    department: string;
    branch?: string;
  };
  confidence: number;
  method: string;
  subject?: string;
}

interface LiveAttendanceFeedProps {
  limit?: number;
  refreshInterval?: number;
  showHeader?: boolean;
}

const LiveAttendanceFeed: React.FC<LiveAttendanceFeedProps> = ({
  limit = 10,
  refreshInterval = 10000,
  showHeader = true,
}) => {
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [newRecordsCount, setNewRecordsCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadRecentAttendance();
    const interval = setInterval(loadRecentAttendance, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadRecentAttendance = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/attendance/today');
      
      if (!response.ok) {
        console.error('Failed to fetch attendance:', response.status);
        setRecentAttendance([]);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();

      if (data.success && data.data) {
        const records: AttendanceRecord[] = Array.isArray(data.data) ? data.data : [];
        
        // Sort by timestamp (newest first) and limit
        const sortedRecords = records
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        // Check for new records
        if (recentAttendance.length > 0) {
          const newRecords = sortedRecords.filter(
            record => !recentAttendance.some(existing => existing.id === record.id)
          );
          if (newRecords.length > 0) {
            setNewRecordsCount(newRecords.length);
            setTimeout(() => setNewRecordsCount(0), 3000);
          }
        }

        setRecentAttendance(sortedRecords);
        setLastUpdateTime(new Date());
      } else {
        // No data or error - set empty array
        setRecentAttendance([]);
      }
    } catch (error) {
      console.error('Error loading recent attendance:', error);
      setRecentAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const recordTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - recordTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return recordTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.95) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.85) return 'text-blue-600 dark:text-blue-400';
    if (confidence >= 0.75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getConfidenceBgColor = (confidence: number): string => {
    if (confidence >= 0.95) return 'bg-green-100 dark:bg-green-900/30';
    if (confidence >= 0.85) return 'bg-blue-100 dark:bg-blue-900/30';
    if (confidence >= 0.75) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-orange-100 dark:bg-orange-900/30';
  };

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {showHeader && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Activity className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Live Attendance Feed
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time updates • Auto-refreshes every {refreshInterval / 1000}s
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {newRecordsCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold"
                >
                  +{newRecordsCount} new
                </motion.div>
              )}
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{lastUpdateTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : recentAttendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No attendance records today</p>
            <p className="text-xs">Records will appear here when attendance is marked</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {recentAttendance.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {record.student.firstName[0]}{record.student.lastName[0]}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 
                          className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          onClick={() => handleStudentClick(record.student)}
                        >
                          {record.student.firstName} {record.student.lastName}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {record.student.ienNumber}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {record.student.department}
                          </span>
                          {record.student.branch && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {record.student.branch}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(record.timestamp)}</span>
                        </div>
                        {record.confidence && (
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceBgColor(record.confidence)} ${getConfidenceColor(record.confidence)}`}>
                            {(record.confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="capitalize">{record.method?.replace('_', ' ').toLowerCase() || 'Face Recognition'}</span>
                      </div>
                      {record.subject && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>{record.subject}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Stats */}
      {recentAttendance.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>{recentAttendance.length} students marked today</span>
            </div>
            <button
              onClick={loadRecentAttendance}
              className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Zap className="w-4 h-4" />
              <span>Refresh now</span>
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Student Profile Modal */}
    <StudentProfileModal
      student={selectedStudent}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
};

export default LiveAttendanceFeed;
