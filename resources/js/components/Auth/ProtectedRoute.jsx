import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Este componente recibe:
// 1. allowedRoles: Un array con los roles permitidos (ej: ['admin', 'senior'])
// 2. children: El componente que intentan ver (la página)
const ProtectedRoute = ({ allowedRoles, children }) => {
    
    // 1. Verificar si está logueado
    const token = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = userData.role;

    // SI NO TIENE TOKEN -> Lo mandamos al Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Verificar si tiene el ROL correcto
    // Si la ruta exige roles específicos y el usuario NO tiene uno de ellos...
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // ... Lo mandamos al Dashboard (o a una página de "Acceso Denegado")
        // Nota: Si es analista y dashboard está prohibido, quizás redirigir a '/search'
        return <Navigate to="/" replace />; 
    }

    // SI TODO ESTÁ BIEN -> Le mostramos la página (Children o Outlet)
    return children ? children : <Outlet />;
};

export default ProtectedRoute;