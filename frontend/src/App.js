import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ResellerDashboard from './pages/ResellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/student" 
            element={token && userRole === 'STUDENT' ? <StudentDashboard /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/reseller" 
            element={token && userRole === 'RESELLER' ? <ResellerDashboard /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/admin" 
            element={token && userRole === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
