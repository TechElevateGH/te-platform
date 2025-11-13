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
