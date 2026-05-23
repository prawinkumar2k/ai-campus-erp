import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarModules, setSidebarModules] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Helper function to get token for API calls
  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, []);

  const login = useCallback((token, userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setSidebarModules([]);
    setUserProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Check if user is already logged in and validate token on server
  useEffect(() => {
    const controller = new AbortController();

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const response = await fetch('/api/auth/verify', {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (controller.signal.aborted) return;

          if (response.ok) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else if (response.status === 401) {
            logout();
          }
        } catch (error) {
          if (error.name === 'AbortError') return;
          console.debug('Token validation failed:', error.message);
          logout();
        }
      }

      if (!controller.signal.aborted) setLoading(false);
    };

    initializeAuth();
    return () => controller.abort();
  }, [logout]);

  // Fetch shared data (sidebar and profile) when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setSidebarModules([]);
      setUserProfile(null);
      return;
    }

    const controller = new AbortController();

    const fetchGlobalData = async () => {
      try {
        const headers = getAuthHeaders();

        const sidebarRes = await fetch('/api/auth/sidebar', { headers, signal: controller.signal });
        if (controller.signal.aborted) return;
        if (sidebarRes.ok) {
          const sidebarData = await sidebarRes.json();
          setSidebarModules(Array.isArray(sidebarData?.data) ? sidebarData.data : []);
        } else if (sidebarRes.status === 401) {
          logout();
          return;
        }

        const profileRes = await fetch('/api/auth/profile', { headers, signal: controller.signal });
        if (controller.signal.aborted) return;
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile(profileData.data);
        } else if (profileRes.status === 401) {
          logout();
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.debug('Error fetching global auth data:', error.message);
      }
    };

    fetchGlobalData();
    return () => controller.abort();
  }, [isAuthenticated, getAuthHeaders, logout]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      userProfile,
      sidebarModules,
      login, 
      logout, 
      loading,
      getToken,
      getAuthHeaders,
      setSidebarModules,
      setUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
