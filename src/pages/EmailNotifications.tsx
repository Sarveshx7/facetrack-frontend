import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailRecord {
  id?: number;
  to: string;
  subject: string;
  body?: string;
  type: string;
  sentAt: string;
  status: string;
}

const EmailNotifications: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailRecord[]>([]);
  const [adminEmail, setAdminEmail] = useState('admin@college.edu');

  const API_BASE_URL = 'http://localhost:8080/api';

  useEffect(() => {
    loadEmailHistory();
  }, []);

  const loadEmailHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/history`);
      const data = await response.json();
      
      if (data.success) {
        setEmailHistory(data.emails || []);
      } else {
        setEmailHistory([]);
      }
    } catch (error) {
      console.error('Error loading email history:', error);
      setEmailHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendLowAttendanceAlerts = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/alerts/low-attendance?threshold=75`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ Sent ${data.emailsSent || 0} low attendance alerts!`);
        await loadEmailHistory();
      } else {
        toast.error(data.message || 'Failed to send alerts');
      }
    } catch (error) {
      console.error('Error sending alerts:', error);
      toast.error('Error: Could not connect to server');
    } finally {
      setIsSending(false);
    }
  };

  const sendDailySummary = async () => {
    if (!adminEmail) {
      toast.error('Please enter admin email');
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/summary/daily?adminEmail=${encodeURIComponent(adminEmail)}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Daily summary sent!');
        await loadEmailHistory();
      } else {
        toast.error(data.message || 'Failed to send summary');
      }
    } catch (error) {
      toast.error('Error: Could not connect to server');
    } finally {
      setIsSending(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all email history?')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/email/history`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Email history cleared');
        setEmailHistory([]);
      } else {
        toast.error('Failed to clear history');
      }
    } catch (error) {
      toast.error('Error clearing history');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LOW_ATTENDANCE_ALERT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'AT_RISK_ALERT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'DAILY_SUMMARY':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'WEEKLY_REPORT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'WELCOME':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-2 max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-3 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <div>
              <h1 className="text-base font-bold">Email Alerts</h1>
              <p className="text-xs text-blue-100">Send automated emails</p>
            </div>
          </div>
          <button
            onClick={loadEmailHistory}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        {/* Low Attendance Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col"
        >
          <div className="flex items-center space-x-1.5 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
              Low Attendance Alerts
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 flex-grow">
            Send alerts to students below 75%
          </p>
          <button
            onClick={sendLowAttendanceAlerts}
            disabled={isSending}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center space-x-1 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSending ? 'Sending...' : 'Send Alerts'}</span>
          </button>
        </motion.div>

        {/* Daily Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col"
        >
          <div className="flex items-center space-x-1.5 mb-1.5">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
              Daily Summary
            </h3>
          </div>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full px-2 py-1 text-xs border rounded mb-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-grow"
            placeholder="admin@college.edu"
          />
          <button
            onClick={sendDailySummary}
            disabled={isSending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center space-x-1 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSending ? 'Sending...' : 'Send Summary'}</span>
          </button>
        </motion.div>
      </div>

      {/* Email History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Email History ({emailHistory.length})
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Recent email notifications sent by the system
            </p>
          </div>
          <button
            onClick={clearHistory}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        <div className="overflow-y-auto max-h-64">{/* Changed overflow-x-auto to overflow-y-auto */}
          {emailHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No emails sent yet. Use the buttons above to send notifications.
              </p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-40">
                    Recipient
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Subject
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                    Sent
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {emailHistory.map((email, index) => (
                  <tr key={email.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-2">
                      <span className={`px-1 py-0.5 text-xs font-medium rounded ${getTypeColor(email.type)}`}>
                        {email.type.replace(/_/g, ' ').substring(0, 15)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white truncate">
                      {email.to}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white truncate">
                      {email.subject}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {email.sentAt}
                    </td>
                    <td className="px-2 py-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmailNotifications;
