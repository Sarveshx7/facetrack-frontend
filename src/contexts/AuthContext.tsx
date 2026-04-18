import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AdminUser, LoginCredentials } from '../services/authService';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Check if we have stored user data
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // If no stored user data, logout to clear invalid state
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid token
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const loginResponse = await authService.login(credentials);
      
      // Set user data from login response
      const userData: AdminUser = {
        id: loginResponse.id,
        username: loginResponse.username,
        email: loginResponse.email,
        firstName: loginResponse.firstName,
        lastName: loginResponse.lastName,
        role: loginResponse.role,
        authorities: loginResponse.authorities,
      };
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success(`Welcome back, ${userData.firstName}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      // Clear stored user data
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no stored user data, logout
          authService.logout();
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // Clear invalid token
      authService.logout();
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
