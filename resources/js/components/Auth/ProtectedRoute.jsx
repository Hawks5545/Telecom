import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Este componente recibe:
// 1. allowedRoles: Un array con los roles permitidos 
// 2. children: El componente que intentan ver
const ProtectedRoute = ({ allowedRoles, children }) => {
    
    // 1. Verificar si está logueado
    const token = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = userData.role;

    // SI NO TIENE TOKEN -> Lo manda al Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Verificar si tiene el ROL correcto
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />; 
    }

    // SI TODO ESTÁ BIEN -> Le mostramos la página (Children o Outlet)
    return children ? children : <Outlet />;
};

export default ProtectedRoute;