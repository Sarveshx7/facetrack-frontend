import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Users, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const DatabaseStatus: React.FC = () => {
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDatabaseStatus();
  }, []);

  const loadDatabaseStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:8080/api/students/enrolled-faces');
      setEnrolledCount(response.data.data?.length || 0);
      
      const allStudents = await axios.get('http://localhost:8080/api/students');
      setTotalStudents(allStudents.data.data?.totalElements || 0);
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to load database status:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🗄️ Database Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View database connection and enrollment statistics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Database Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {isConnected ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" /> Connected
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-2">
                      <XCircle className="w-6 h-6" /> Disconnected
                    </span>
                  )}
                </p>
              </div>
              <Database className="w-12 h-12 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Faces</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {enrolledCount}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalStudents}
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📋 How to Verify Face Enrollment
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Enroll a Face</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to Face Enrollment page and enroll a student's face
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Check This Page</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Return to this page and click "Refresh" to see if the data was saved
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Verify Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Look for the enrolled face in the "Enrolled Faces in Database" section
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              🔍 What to Look For:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Database Status:</strong> Should show "✅ Connected"</li>
              <li>• <strong>Enrolled Faces Count:</strong> Should increase after enrollment</li>
              <li>• <strong>Face Data:</strong> Should show student name, ID, and descriptor points</li>
              <li>• <strong>Timestamp:</strong> Should show recent enrollment date/time</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              ⚠️ Troubleshooting:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• If "❌ Disconnected": Check if backend server is running</li>
              <li>• If "No Data": Try enrolling a face first</li>
              <li>• If API tests fail: Verify backend endpoints are working</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DatabaseStatus;
