import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Users,
  Camera,
  ClipboardCheck,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const MobileOptimizedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const navigate = useNavigate();
  const location = useLocation();

  // Detect device type
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: 'face-recognition',
      label: 'Face Recognition',
      icon: <Camera className="w-6 h-6" />,
      action: () => navigate('/attendance'),
      color: 'bg-blue-500'
    },
    {
      id: 'add-student',
      label: 'Add Student',
      icon: <Users className="w-6 h-6" />,
      action: () => navigate('/students'),
      color: 'bg-green-500'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="w-6 h-6" />,
      action: () => navigate('/reports'),
      color: 'bg-purple-500'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-6 h-6" />,
      action: () => navigate('/dashboard'),
      color: 'bg-orange-500'
    }
  ];

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Students', path: '/students', icon: <Users className="w-5 h-5" /> },
    { label: 'Attendance', path: '/attendance', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> }
  ];

  const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                📚 Face Attendance
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    className={`${action.color} text-white p-3 rounded-lg flex flex-col items-center space-y-1`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {action.icon}
                    <span className="text-xs font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {deviceType === 'mobile' && <Smartphone className="w-4 h-4 text-gray-400" />}
                  {deviceType === 'tablet' && <Tablet className="w-4 h-4 text-gray-400" />}
                  {deviceType === 'desktop' && <Monitor className="w-4 h-4 text-gray-400" />}
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {deviceType} View
                  </span>
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Mobile-specific header
  const MobileHeader = () => (
    <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            📚 Attendance
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-gray-600 dark:text-gray-400">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );

  // Bottom navigation for mobile
  const BottomNavigation = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-30">
      <div className="flex items-center justify-around">
        {menuItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          );
        })}
        <motion.button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-500 dark:text-gray-400"
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-medium">More</span>
        </motion.button>
      </div>
    </nav>
  );

  // Floating Action Button for mobile
  const FloatingActionButton = () => (
    <motion.button
      onClick={() => navigate('/attendance')}
      className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <Camera className="w-6 h-6" />
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileHeader />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Main Content */}
      <main className={`${deviceType === 'mobile' ? 'pb-20' : 'pb-4'} ${deviceType === 'mobile' ? 'pt-0' : 'pt-4'}`}>
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>
      
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
};

export default MobileOptimizedLayout;
