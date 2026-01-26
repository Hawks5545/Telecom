import './bootstrap';
import '../css/app.scss'; 
import 'bootstrap-icons/font/bootstrap-icons.css';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// COMPONENTES
import LoginContainer from './components/Login/LoginContainer';
import AdminLayout from './components/Admin/AdminLayout';
import ResetPassword from './components/Login/ResetPassword/ResetPassword'; 
import ProtectedRoute from './components/Auth/ProtectedRoute'; // <-- ASEGÚRATE DE CREAR ESTE ARCHIVO

// MÓDULOS
import SearchRecordings from './components/Modules/SearchRecordings/SearchRecordings'; 
import FolderManager from './components/Modules/FolderManager/FolderManager';
import Indexing from './components/Modules/Indexing/Indexing';
import Auditoria from './components/Modules/Auditoria/Auditoria';
import Reportes from './components/Modules/Reportes/Reportes';
import UsersRoles from './components/Modules/UsersRoles/UsersRoles';
import Configuration from './components/Modules/Configuration/Configuration';

const MainApp = () => {
    // Al iniciar, verificamos si ya había una sesión activa
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));
    const [currentView, setCurrentView] = useState('dashboard'); 

    // Obtenemos el rol del usuario logueado
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = userData.role;

    const handleLogin = () => setIsLoggedIn(true);
    
    const handleLogout = () => {
        localStorage.clear(); // Limpiamos todo al salir
        setIsLoggedIn(false);
        setCurrentView('dashboard');
    };

    // --- LÓGICA DE BLINDAJE DE VISTAS ---
    const renderContent = () => {
        switch (currentView) {
            case 'search': 
                return <SearchRecordings />;
            
            case 'folders': 
                return <FolderManager />;
            
            case 'indexing': 
                return <Indexing />;

            case 'audits': 
                // Solo Admin y Senior/Junior ven Auditoría
                return ['admin', 'senior', 'junior'].includes(userRole) 
                    ? <Auditoria/> 
                    : <Navigate to="/search" />;

            case 'reports': 
                // Solo Admin y Senior/Junior ven Reportes
                return ['admin', 'senior', 'junior'].includes(userRole) 
                    ? <Reportes/> 
                    : <Navigate to="/search" />;

            case 'users': 
                // SOLO EL ADMIN ve Usuarios y Roles
                return userRole === 'admin' 
                    ? <UsersRoles/> 
                    : <Navigate to="/search" />;

            case 'configuration': 
                return userRole === 'admin' 
                    ? <Configuration /> 
                    : <Navigate to="/search" />;

            case 'dashboard':
            default: 
                // Si un analista no debe ver el dashboard vacío, lo mandamos a búsqueda
                if (userRole === 'analista') {
                    return <SearchRecordings />;
                }
                return (
                    <div className="card shadow-sm p-4 border-0" style={{borderRadius: '15px'}}>
                        <h1 style={{color: '#005461'}}>Bienvenido al Dashboard</h1>
                        <p className="text-muted">Hola, {userData.name || 'Usuario'}. Tu rol es: {userRole}</p>
                        <div className="mt-4 p-5 text-center bg-light rounded-3">
                            <i className="bi bi-bar-chart-line display-1 text-secondary opacity-25"></i>
                            <p className="mt-3 text-secondary">Estadísticas de grabaciones próximamente...</p>
                        </div>
                    </div>        
                );
        }
    };

    return (
        <>
            {!isLoggedIn ? (
                <LoginContainer onLogin={handleLogin} />
            ) : (
                <AdminLayout 
                    onLogout={handleLogout} 
                    currentView={currentView} 
                    onNavigate={setCurrentView}
                >
                    {renderContent()}
                </AdminLayout>
            )}
        </>
    );
};

function App() {
    return (
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    {/* Ruta para establecer/resetear contraseña */}
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* El resto de la App */}
                    <Route path="/*" element={<MainApp />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
}

if (document.getElementById('root')) {
    const Index = ReactDOM.createRoot(document.getElementById("root"));
    Index.render(<App />);
}