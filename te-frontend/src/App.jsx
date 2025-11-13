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
import OAuthCallback from './components/user/OAuthCallback';
import Documentation from './pages/Documentation';
import { useState, useEffect } from 'react';
import ColdStartIndicator from './components/_custom/ColdStartIndicator';
import { setColdStartHandlers } from './axiosConfig';

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
  const [showColdStart, setShowColdStart] = useState(false);
  const [activeRequests, setActiveRequests] = useState(new Set());

  useEffect(() => {
    // Set up global handlers for cold start detection
    setColdStartHandlers({
      onSlowRequest: (requestId) => {
        setActiveRequests(prev => new Set([...prev, requestId]));
        setShowColdStart(true);
      },
      onRequestComplete: (requestId) => {
        setActiveRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
        
        // Hide cold start indicator after a brief delay if no more active requests
        setTimeout(() => {
          setActiveRequests(current => {
            if (current.size === 0) {
              setShowColdStart(false);
            }
            return current;
          });
        }, 500);
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <PostHogProvider>
        <DarkModeProvider>
          <AuthProvider>
            <NotificationProvider>
              <DataProvider>
                <div className="App gentium-book">
                  <ColdStartIndicator 
                    isLoading={activeRequests.size > 0} 
                    timeoutReached={showColdStart} 
                  />
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
                    <Route path="/auth/callback" element={<OAuthCallback />} />
                    <Route path="/documentation" element={<Documentation />} />
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
