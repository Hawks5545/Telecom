// resources/js/app.jsx
import './bootstrap';
import '../css/app.scss'; 
import 'bootstrap-icons/font/bootstrap-icons.css';

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// COMPONENTES
import LoginContainer from './components/Login/LoginContainer';
import AdminLayout from './components/Admin/AdminLayout';

// MÓDULOS
import SearchRecordings from './components/Modules/SearchRecordings/SearchRecordings'; 
import FolderManager from './components/Modules/FolderManager/FolderManager';
import Indexing from './components/Modules/Indexing/Indexing';
import Auditoria from './components/Modules/Auditoria/Auditoria';
import Reportes from './components/Modules/Reportes/Reportes';
import UsersRoles from './components/Modules/UsersRoles/UsersRoles';
import Configuration from './components/Modules/Configuration/Configuration';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // ESTADO PARA CONTROLAR LA VISTA ACTUAL
    const [currentView, setCurrentView] = useState('dashboard'); 

    const handleLogin = () => setIsLoggedIn(true);
    
    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentView('dashboard');
    };

    // Función para renderizar el contenido dinámico
    const renderContent = () => {
        switch (currentView) {
            case 'search':
                return <SearchRecordings />;
            
            case 'folders':
                return <FolderManager />;
            
            case 'indexing':
                return <Indexing />;

            case 'audits':
                return <Auditoria/>;

            case 'reports':
                return <Reportes/>;

            case 'users':
                return <UsersRoles/>;    

            case 'configuration':
                return <Configuration />;    

            case 'dashboard':
            default: 
                return (
                    <div className="card shadow-sm p-4 border-0" style={{borderRadius: '15px'}}>
                        <h1 style={{color: '#005461'}}>Bienvenido al Dashboard</h1>
                        <p className="text-muted">Selecciona una opción del menú lateral.</p>
                        <div className="mt-4 p-5 text-center bg-light rounded-3">
                            <i className="bi bi-bar-chart-line display-1 text-secondary opacity-25"></i>
                            <p className="mt-3 text-secondary">Gráficas próximamente...</p>
                        </div>
                    </div>        
                );
        }
    };

    return (
        <React.StrictMode>
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
        </React.StrictMode>
    );
}

if (document.getElementById('root')) {
    const Index = ReactDOM.createRoot(document.getElementById("root"));
    Index.render(<App />);
}