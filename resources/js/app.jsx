import './bootstrap';
import '../css/app.scss'; 
import 'bootstrap-icons/font/bootstrap-icons.css';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// COMPONENTES
import LoginContainer from './components/Login/LoginContainer';
import AdminLayout from './components/Admin/AdminLayout';
import ResetPassword from './components/Login/ResetPassword/ResetPassword'; 
import ProtectedRoute from './components/Auth/ProtectedRoute'; 

// MÓDULOS
import SearchRecordings from './components/Modules/SearchRecordings/SearchRecordings'; 
import FolderManager from './components/Modules/FolderManager/FolderManager';
import Indexing from './components/Modules/Indexing/Indexing';
import Auditoria from './components/Modules/Auditoria/Auditoria';
import Reportes from './components/Modules/Reportes/Reportes';
import UsersRoles from './components/Modules/UsersRoles/UsersRoles';
import Configuration from './components/Modules/Configuration/Configuration';
import Dashboard from './components/Modules/Dashboard/Dashboard'; // <--- [NUEVO] Importamos el Dashboard

const LoginWrapper = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('auth_token');
    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleLoginSuccess = () => {
        navigate('/dashboard', { replace: true });
    };

    return <LoginContainer onLogin={handleLoginSuccess} />;
};

const MainApp = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));
    const [currentView, setCurrentView] = useState('dashboard'); 
    
    // 1. CARGAMOS LOS DATOS DEL USUARIO
    const [userData, setUserData] = useState(() => 
        JSON.parse(localStorage.getItem('user_data') || '{}')
    );

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('auth_token');
            if (!token && isLoggedIn) {
                setIsLoggedIn(false);
                setUserData({});
                navigate('/login'); 
            }
        };
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [isLoggedIn, navigate]);

    // 2. Definimos las variables clave
    const userPerms = userData.permissions || [];
    // const displayRoleName = userData.role_display || userData.role || 'Sin Rol Asignado'; // Ya no es necesario mostrarlo aquí, está en el Dashboard

    // 3. LOGOUT
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch('http://127.0.0.1:8000/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error("Error logout:", error);
        } finally {
            localStorage.clear(); 
            window.location.href = '/login';
        }
    };

    // 4. FUNCIÓN HELPER PARA PERMISOS
    const canSee = (perm) => userPerms.includes('*') || userPerms.includes(perm);

    const renderContent = () => {
        switch (currentView) {
            case 'search': return <SearchRecordings />;
            case 'folders': return <FolderManager />;
            case 'indexing': return <Indexing />;
            
            // RUTAS PROTEGIDAS CON PERMISOS REALES
            case 'audits': 
                return canSee('Auditorías') ? <Auditoria/> : <Navigate to="/dashboard" replace />;
            
            case 'reports': 
                return canSee('Reportes') ? <Reportes/> : <Navigate to="/dashboard" replace />;
            
            case 'users': 
                return (userData.role === 'admin' || canSee('Gestión de Usuarios')) ? <UsersRoles/> : <Navigate to="/dashboard" replace />;
            
            case 'configuration': 
                return userData.role === 'admin' ? <Configuration /> : <Navigate to="/dashboard" replace />;
            
            case 'dashboard':
            default: 
                // Lógica especial: Si no tiene permiso de Dashboard pero sí búsqueda, lo mandamos allá
                if (!canSee('Dashboard') && canSee('Búsqueda de Grabaciones')) return <SearchRecordings />;

                // --- [ACTUALIZADO] Renderizamos el componente real ---
                return <Dashboard />;
        }
    };

    return (
        <AdminLayout 
            onLogout={handleLogout} 
            currentView={currentView} 
            onNavigate={setCurrentView}
        >
            {renderContent()}
        </AdminLayout>
    );
};

function App() {
    return (
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    {/* 1. Login */}
                    <Route path="/login" element={<LoginWrapper />} />

                    {/* 2. Recuperar Contraseña */}
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* 3. RUTAS PROTEGIDAS */}
                    <Route element={<ProtectedRoute />}>
                    
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        <Route path="/*" element={<MainApp />} />
                    </Route>

                    {/* 4. CATCH-ALL: Si no coincide con nada de lo de arriba, es que no hay sesión */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
}

if (document.getElementById('root')) {
    const Index = ReactDOM.createRoot(document.getElementById("root"));
    Index.render(<App />);
}