import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdmin } from '../utils/auth';

const AdminProtectedRoute = () => {
  const location = useLocation();
  const userIsAdmin = isAdmin();

  if (!userIsAdmin) {
    console.warn("Unauthorized access attempt to admin route blocked.");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;