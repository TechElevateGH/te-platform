import { createContext, useContext, useEffect, useReducer, useState } from 'react';

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
    // Use sessionStorage for tab-independent auth (allows multiple accounts in different tabs)
    const accessToken = sessionStorage.getItem('accessToken');
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');

    if (accessToken) {
      dispatch({ type: 'login', payload: { userId, userRole, accessToken } });
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken, userId, userRole) => {
    // Use sessionStorage for tab-independent auth
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('userRole', userRole);

    // Track if this is a privileged user (role >= 2) for redirect after session expiry
    const isPrivileged = parseInt(userRole) >= 2;
    sessionStorage.setItem('wasPrivilegedUser', isPrivileged.toString());

    dispatch({ type: 'login', payload: { userId, userRole, accessToken } });
  };

  const logout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('wasPrivilegedUser');
    dispatch({ type: 'logout' });
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
