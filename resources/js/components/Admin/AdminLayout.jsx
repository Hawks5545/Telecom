// resources/js/components/Admin/AdminLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';

const AdminLayout = ({ children, onLogout, currentView, onNavigate }) => {
    return (
        <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', width: '100%' }}>

            <Sidebar 
                onLogout={onLogout} 
                activeModule={currentView} 
                onNavigate={onNavigate} 
            />

            <main style={{ 
                marginLeft: '120px', 
                padding: '30px',
                width: 'calc(100% - 120px)',
                transition: 'margin-left 0.5s ease'
            }}>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;