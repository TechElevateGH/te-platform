import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import posthog from 'posthog-js';

const AuthenticationContext = createContext();

export const useAuth = () => {
  return useContext(AuthenticationContext);
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'login':
      return {
        userId: action.payload.userId,
        userRole: action.payload.userRole,
        accessToken: action.payload.accessToken,
      };
    case 'logout':
      return { userId: null, userRole: null, accessToken: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { userId: null, userRole: null, accessToken: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're on the OAuth callback page without params (stale redirect from browser restore)
    if (window.location.pathname === '/auth/callback') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasParams = urlParams.has('token') || urlParams.has('error') || urlParams.has('user_id');

      if (!hasParams) {
        // This is a stale OAuth callback URL (browser restore after close)
        console.warn('[AuthContext] Detected stale OAuth callback - browser was reopened');
        const accessToken = localStorage.getItem('accessToken');
        const lastLogin = localStorage.getItem('lastSuccessfulLogin');

        // Check if user was recently logged in (within last 30 days)
        const recentlyLoggedIn = lastLogin && (Date.now() - parseInt(lastLogin)) < 30 * 24 * 60 * 60 * 1000;

        if (accessToken && recentlyLoggedIn) {
          // User is authenticated and login is recent, go to workspace
          console.log('[AuthContext] User authenticated, redirecting to workspace');
          window.location.replace('/workspace');
        } else {
          // Not authenticated or login is stale, go to login
          console.log('[AuthContext] Not authenticated or stale login, redirecting to login');
          window.location.replace('/login');
        }
        return;
      }
    }

    // Use localStorage for persistent auth across tabs
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (accessToken) {
      dispatch({ type: 'login', payload: { userId, userRole, accessToken } });
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken, userId, userRole) => {
    // Use localStorage for persistent auth across tabs
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', userRole);

    // Track if this is a privileged user (role >= 2) for redirect after session expiry
    const isPrivileged = parseInt(userRole) >= 2;
    localStorage.setItem('wasPrivilegedUser', isPrivileged.toString());

    dispatch({ type: 'login', payload: { userId, userRole, accessToken } });

    // Identify user in PostHog
    posthog.identify(userId, {
      role: userRole,
      isPrivileged: isPrivileged,
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('wasPrivilegedUser');
    dispatch({ type: 'logout' });

    // Reset PostHog user
    posthog.reset();
  };

  const isAuthenticated = !!state.accessToken;


  return (
    <AuthenticationContext.Provider
      value={{
        userId: state.userId,
        userRole: state.userRole,
        accessToken: state.accessToken,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
