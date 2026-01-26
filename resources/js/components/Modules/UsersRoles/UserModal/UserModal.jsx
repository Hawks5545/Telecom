import React, { useState } from 'react';
import styles from './UserModal.module.css';

const UserModal = ({ isOpen, onClose, onSuccess }) => {
    
    // Si el modal no está abierto, no renderizamos nada
    if (!isOpen) return null;

    // Estado local para los campos del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        tipoDoc: 'Cédula de Ciudadanía (C.C)',
        numDoc: '',
        correo: '',
        rol: 'Analista' // Valor por defecto
    });

    // Estados para manejar la carga y errores
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        // 1. PREPARAR LOS DATOS (TRADUCCIÓN)
        // Convertimos los datos de tu formulario al formato que espera Laravel
        
        // Mapeo de Roles: Frontend -> Backend
        const roleMap = {
            'Administrador': 'admin',
            'Analista': 'analista',
            'Senior': 'senior',
            'Junior': 'junior'
        };

        const payload = {
            name: `${formData.nombre} ${formData.apellido}`, // Unimos nombre y apellido
            email: formData.correo,
            cedula: formData.numDoc,
            role: roleMap[formData.rol] || 'analista'
        };

        try {
            // Recuperar el token (Asegúrate de que se llame 'auth_token' o como lo hayas guardado en el Login)
            const token = localStorage.getItem('auth_token');

            const response = await fetch('http://127.0.0.1:8000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}` // <--- La llave maestra
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // ÉXITO
                if (onSuccess) {
                    onSuccess(); // Dispara la alerta verde del padre y recarga la tabla
                }
                
                // Limpiar formulario
                setFormData({
                    nombre: '',
                    apellido: '',
                    tipoDoc: 'Cédula de Ciudadanía (C.C)',
                    numDoc: '',
                    correo: '',
                    rol: 'Analista'
                });
                onClose(); // Cerrar modal
            } else {
                // ERROR (Ej: Correo duplicado)
                setError(data.message || 'Error al registrar el usuario.');
            }

        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>Registrar Nuevo Usuario</h5>
                    <button className={styles.btnClose} onClick={onClose} disabled={isSubmitting}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    
                    {/* Mensaje de Error (Si falla el backend) */}
                    {error && (
                        <div className="alert alert-danger p-2 text-center mb-3" style={{fontSize: '0.9rem'}}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        
                        {/* Fila 1: Nombres y Apellidos */}
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className={styles.label}>Nombres</label>
                                <input 
                                    type="text" 
                                    name="nombre"
                                    className="form-control" 
                                    placeholder="Ej: Carlos"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="col-md-6">
                                <label className={styles.label}>Apellidos</label>
                                <input 
                                    type="text" 
                                    name="apellido"
                                    className="form-control" 
                                    placeholder="Ej: Perez"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        {/* Fila 2: Documento */}
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className={styles.label}>Tipo Documento</label>
                                <select 
                                    name="tipoDoc" 
                                    className="form-select"
                                    value={formData.tipoDoc}
                                    onChange={handleChange}
                                >
                                    <option>Cédula de Ciudadanía (C.C)</option>
                                    <option>Cédula de Extranjería (C.E)</option>
                                    <option>Pasaporte</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className={styles.label}>Número Documento</label>
                                <input 
                                    type="number" 
                                    name="numDoc"
                                    className="form-control" 
                                    placeholder="Ej: 1098..."
                                    value={formData.numDoc}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        {/* Fila 3: Correo */}
                        <div className="mb-3">
                            <label className={styles.label}>Correo Electrónico</label>
                            <input 
                                type="email" 
                                name="correo"
                                className="form-control" 
                                placeholder="nombre@empresa.com"
                                value={formData.correo}
                                onChange={handleChange}
                                required 
                            />
                        </div>

                        {/* Fila 4: Rol */}
                        <div className="mb-4">
                            <label className={styles.label}>Rol Asignado</label>
                            <select 
                                name="rol" 
                                className="form-select"
                                value={formData.rol}
                                onChange={handleChange}
                            >
                                <option>Administrador</option>
                                <option>Analista</option>
                                {/* He separado Junior y Senior para coincidir con el backend */}
                                <option>Senior</option>
                                <option>Junior</option>
                            </select>
                        </div>

                        {/* Footer con Botones */}
                        <div className={styles.modalFooter}>
                            <button 
                                type="button" 
                                className={styles.btnCancel} 
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className={styles.btnSave}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Registrando...' : 'Registrar Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserModal;