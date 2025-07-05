import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userResponse = await axios.get(getApiUrl('/user/me'));
          setUser(userResponse.data);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(getApiUrl('/auth/login'), { email, password });
      const { token: newToken } = response.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      const userResponse = await axios.get(getApiUrl('/user/me'));
      setUser(userResponse.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await axios.post(getApiUrl('/auth/register'), { email, password });
      const { token: newToken } = response.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      const userResponse = await axios.get(getApiUrl('/user/me'));
      setUser(userResponse.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 