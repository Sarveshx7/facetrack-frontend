import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Camera,
  ClipboardCheck,
  Calendar,
  FileText,
  Menu,
  X,
  LogOut,
  Settings,
  Sun,
  Moon,
  Palette,
  Activity,
  Zap,
  Brain,
  FileSpreadsheet,
  Mail,
  Calculator,
  UserCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
    description: 'Overview and analytics',
  },
  {
    id: 'students',
    label: 'Students',
    icon: <Users className="w-5 h-5" />,
    path: '/students',
    description: 'Manage student records',
  },
  {
    id: 'advanced-face-recognition',
    label: 'Advanced Face Recognition',
    icon: <Zap className="w-5 h-5" />,
    path: '/advanced-face-recognition',
    description: 'Multi-angle enrollment & real-time attendance',
  },
  {
    id: 'database-status',
    label: 'Database Status',
    icon: <Settings className="w-5 h-5" />,
    path: '/database-status',
    description: 'Verify enrollment data',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: <Calendar className="w-5 h-5" />,
    path: '/timetable',
    description: 'Manage class schedules',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    path: '/reports',
    description: 'Generate and view reports',
  },
  {
    id: 'predictions',
    label: 'AI Predictions',
    icon: <Brain className="w-5 h-5" />,
    path: '/predictions',
    description: 'ML-powered insights',
  },
  {
    id: 'email-notifications',
    label: 'Email Alerts',
    icon: <Mail className="w-5 h-5" />,
    path: '/email-notifications',
    description: 'Send automated emails',
  },
  {
    id: 'grade-calculator',
    label: 'Grade Calculator',
    icon: <Calculator className="w-5 h-5" />,
    path: '/grade-calculator',
    description: 'Predict final grades',
  },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();

  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    const themes = ['light', 'dark', 'blue', 'green'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    const themeEmojis: { [key: string]: string } = {
      light: '☀️',
      dark: '🌙',
      blue: '🔵',
      green: '🟢'
    };
    
    toast.success(`Switched to ${nextTheme} theme ${themeEmojis[nextTheme]}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to close modals
      if (event.key === 'Escape') {
        setShowThemeMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'blue', label: 'Blue', icon: <Palette className="w-4 h-4" /> },
    { value: 'green', label: 'Green', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 lg:static lg:inset-0"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    FaceTrack
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Attendance System
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  {/* Theme Menu */}
                  <AnimatePresence>
                    {showThemeMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                      >
                        {themeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTheme(option.value as any);
                              setShowThemeMenu(false);
                              
                              const themeEmojis: { [key: string]: string } = {
                                light: '☀️',
                                dark: '🌙',
                                blue: '🔵',
                                green: '🟢'
                              };
                              
                              toast.success(`Switched to ${option.label} theme ${themeEmojis[option.value]}`);
                            }}
                            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              theme === option.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {option.icon}
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {menuItems.find(item => item.path === currentPath)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {menuItems.find(item => item.path === currentPath)?.description || 'Welcome back!'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleThemeToggle}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden group"
              title={`Current: ${theme} theme`}
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: theme === 'dark' ? 0 : 360 }}
                transition={{ duration: 0.5 }}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </motion.div>
              
              {/* Tooltip */}
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Toggle theme
              </span>
            </motion.button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-fuchsia-100/50 dark:from-gray-900/50 dark:via-purple-900/10 dark:to-gray-900/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
