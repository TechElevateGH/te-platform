import { createContext, useContext, useEffect, useReducer } from 'react';

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

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (accessToken) {
      dispatch({ type: 'login', payload: { userId, userRole, accessToken } });
    }
  }, []);

  const login = (userId, userRole, accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', userRole);
    dispatch({ type: 'login', payload: { userId, userRole, accessToken } });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
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
        login,
        logout,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
