import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ConfirmReset } from '../pages/ConfirmReset';
import { Dashboard } from '../pages/Dashboard';
import { Unauthorized } from '../pages/Unauthorized';
import { NotFound } from '../pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/confirm-reset" element={<ConfirmReset />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Placeholder routes para módulos futuros */}
        <Route path="/animals" element={<div>Página de Animais - Em desenvolvimento</div>} />
        <Route path="/pastures" element={<div>Página de Pastos - Em desenvolvimento</div>} />
        <Route path="/vaccinations" element={<div>Página de Vacinações - Em desenvolvimento</div>} />
        <Route path="/pregnancies" element={<div>Página de Gestações - Em desenvolvimento</div>} />
        <Route path="/profile" element={<div>Página de Perfil - Em desenvolvimento</div>} />
      </Route>

      {/* Catch all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};