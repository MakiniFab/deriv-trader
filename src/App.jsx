import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}