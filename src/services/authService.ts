import { apiService, tokenManager } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  authorities: string[];
}

export interface LoginResponse {
  token: string;
  type: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  authorities: string[];
  expiresAt?: string;
  issuedAt?: string;
}

export interface ApiResponse<T = any> {
  message: string;
  success: boolean;
  timestamp: string;
  data?: T;
}

class AuthService {
  /**
   * Login admin user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Demo login - works without backend
      if (credentials.usernameOrEmail === 'admin' && credentials.password === 'admin123') {
        const demoResponse: LoginResponse = {
          token: 'demo-jwt-token-12345',
          type: 'Bearer',
          refreshToken: 'demo-refresh-token',
          id: 1,
          username: 'admin',
          email: 'admin@faceattendance.com',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'SUPER_ADMIN',
          authorities: ['ROLE_ADMIN'],
        };
        
        // Store token
        tokenManager.setToken(demoResponse.token);
        return demoResponse;
      }
      
      // Try backend if demo credentials don't match
      const response = await apiService.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      // Backend returns JWT response directly
      if (response.token) {
        // Store token
        tokenManager.setToken(response.token);
        return response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      // If backend fails and not demo credentials, show error
      if (credentials.usernameOrEmail !== 'admin' || credentials.password !== 'admin123') {
        throw new Error('Invalid credentials. Try: admin / admin123');
      }
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  /**
   * Logout admin user
   */
  async logout(): Promise<void> {
    try {
      // Try backend logout (will fail if backend not running, but that's ok)
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Always remove token from storage
      tokenManager.removeToken();
    }
  }

  /**
   * Create default admin user
   */
  async createAdmin(): Promise<AdminUser> {
    try {
      const response = await apiService.post<ApiResponse<AdminUser>>(
        API_ENDPOINTS.AUTH.CREATE_ADMIN
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create admin');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create admin');
    }
  }

  /**
   * Get current admin user info
   */
  async getCurrentUser(): Promise<AdminUser> {
    try {
      const response = await apiService.get<ApiResponse<AdminUser>>(
        API_ENDPOINTS.AUTH.ME
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get user info');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get user info');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return tokenManager.getToken();
  }

  /**
   * Check user role
   */
  hasRole(role: string): boolean {
    try {
      const token = tokenManager.getToken();
      if (!token) return false;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.authorities?.includes(`ROLE_${role}`) || false;
    } catch {
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN') || this.hasRole('SUPER_ADMIN');
  }

  /**
   * Get user info from token
   */
  getUserFromToken(): Partial<AdminUser> | null {
    try {
      const token = tokenManager.getToken();
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        username: payload.sub,
        email: payload.email,
        role: payload.role,
        authorities: payload.authorities || [],
      };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
