import './App.css';
import Workspace from './components/user/Workspace'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/user/Login';
import Home from './components/home/Home';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from './context/DataContext'
import Register from './components/user/Register';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
        </DataProvider>
      </AuthProvider >
    </BrowserRouter>
  );
}

export default App;
