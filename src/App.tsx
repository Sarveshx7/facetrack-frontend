import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import AttendanceMarking from './pages/AttendanceMarking';
import FaceRecognitionHub from './components/FaceRecognitionHub';
import DatabaseStatus from './pages/DatabaseStatus';
import TimetableBuilder from './pages/TimetableBuilder';
import Reports from './pages/Reports';
import PredictionsDashboard from './pages/PredictionsDashboard';
import ProfessionalReports from './pages/ProfessionalReports';
import EmailNotifications from './pages/EmailNotifications';
import GradeCalculator from './pages/GradeCalculator';
import GuardianPortal from './pages/GuardianPortal';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginPage />
              </motion.div>
            </PublicRoute>
          }
        />

        {/* Guardian Portal - Public Route */}
        <Route
          path="/guardian-portal"
          element={
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GuardianPortal />
            </motion.div>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="dashboard"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Dashboard />
              </motion.div>
            }
          />
          
          <Route
            path="students"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StudentManagement />
              </motion.div>
            }
          />
          
          
          <Route
            path="attendance"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AttendanceMarking />
              </motion.div>
            }
          />
          
          <Route
            path="advanced-face-recognition"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <FaceRecognitionHub />
              </motion.div>
            }
          />


          <Route
            path="database-status"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DatabaseStatus />
              </motion.div>
            }
          />
          
          <Route
            path="timetable"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TimetableBuilder />
              </motion.div>
            }
          />
          
          <Route
            path="reports"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Reports />
              </motion.div>
            }
          />
          
          <Route
            path="predictions"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PredictionsDashboard />
              </motion.div>
            }
          />
          
          <Route
            path="email-notifications"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <EmailNotifications />
              </motion.div>
            }
          />
          
          <Route
            path="grade-calculator"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GradeCalculator />
              </motion.div>
            }
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App min-h-screen bg-background text-foreground transition-colors duration-300">
              <AppRoutes />
              {/* Toast Notifications - Liquid Glass Theme */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 2000,
                  className: 'liquid-glass-toast',
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: 'var(--toast-text, #1f2937)',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    fontWeight: '500',
                    minWidth: '250px',
                  },
                  success: {
                    duration: 2000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                    style: {
                      background: 'rgba(16, 185, 129, 0.15)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
                      color: '#065f46',
                    },
                  },
                  error: {
                    duration: 2000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                    style: {
                      background: 'rgba(239, 68, 68, 0.15)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
                      color: '#991b1b',
                    },
                  },
                  loading: {
                    duration: 2000,
                    iconTheme: {
                      primary: '#3b82f6',
                      secondary: '#fff',
                    },
                    style: {
                      background: 'rgba(59, 130, 246, 0.15)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
                      color: '#1e40af',
                    },
                  },
                }}
              >
                {(t) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {t.icon}
                      <div>{t.message as React.ReactNode}</div>
                    </div>
                    <button
                      onClick={() => {
                        const toast = require('react-hot-toast').default;
                        toast.dismiss(t.id);
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      aria-label="Close notification"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </Toaster>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
