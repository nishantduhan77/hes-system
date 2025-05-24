import axios from 'axios';
import { wsService } from './websocket';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>('/api/auth/login', credentials);
      const { token } = response.data;
      
      this.setAuthHeader(token);
      localStorage.setItem('token', token);
      wsService.connect(token);
      
      return response.data;
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    wsService.disconnect();
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private setAuthHeader(token: string) {
    this.token = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService(); 