import './App.css';
import Workspace from './components/user/Workspace'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/user/Login';
import Home from './components/home/Home';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from './context/DataContext'
import Register from './components/user/Register';
import LeadLogin from './pages/LeadLogin';
import UserAccountManagement from './pages/UserAccountManagement';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <div className="App gentium-book">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
              <Route path="/workspace/profile" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
              <Route path="/workspace/account-management" element={<ProtectedRoute><UserAccountManagement /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/lead-login" element={<LeadLogin />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </DataProvider>
      </AuthProvider >
    </BrowserRouter>
  );
}

export default App;
