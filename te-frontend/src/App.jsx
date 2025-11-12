import './App.css';
import Workspace from './components/user/Workspace'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DarkModeProvider } from './context/DarkModeContext'
import { NotificationProvider } from './context/NotificationContext'
import Login from './components/user/Login';
import Home from './components/home/Home';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from './context/DataContext'
import Register from './components/user/Register';
import EmailVerification from './components/user/EmailVerification';
import LeadLogin from './pages/LeadLogin';
import ReferrerLogin from './pages/ReferrerLogin';
import UserAccountManagement from './pages/UserAccountManagement';
import ResumeReviews from './pages/ResumeReviews';
import PostHogProvider from './providers/PostHogProvider';

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
      <PostHogProvider>
        <DarkModeProvider>
          <AuthProvider>
            <NotificationProvider>
              <DataProvider>
                <div className="App gentium-book">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
                    <Route path="/workspace/account-management" element={<ProtectedRoute><UserAccountManagement /></ProtectedRoute>} />
                    <Route path="/workspace/resume-reviews" element={<ProtectedRoute><ResumeReviews /></ProtectedRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/lead-login" element={<LeadLogin />} />
                    <Route path="/referrer-login" element={<ReferrerLogin />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<EmailVerification />} />
                  </Routes>
                </div>
              </DataProvider>
            </NotificationProvider>
          </AuthProvider >
        </DarkModeProvider>
      </PostHogProvider>
    </BrowserRouter>
  );
}

export default App;
