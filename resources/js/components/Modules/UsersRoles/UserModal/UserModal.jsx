import React, { useState, useEffect } from 'react'; 
import styles from './UserModal.module.css';

const UserModal = ({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;

    // --- ESTADO PARA LA LISTA DE ROLES (DINÁMICO) ---
    const [rolesList, setRolesList] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        tipoDoc: 'Cédula de Ciudadanía (C.C)',
        numDoc: '',
        correo: '',
        rol: '' 
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // --- 2. EFECTO MÁGICO: CARGAR ROLES AL ABRIR ---
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('http://127.0.0.1:8000/api/roles', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setRolesList(data); 
                    
                    // Si hay roles y no hemos seleccionado nada, seleccionamos el primero por defecto
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, rol: data[0].name }));
                    }
                }
            } catch (err) {
                console.error("Error cargando roles:", err);
            }
        };

        fetchRoles();
    }, []); 

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
        
        // --- 3. PREPARAR DATOS (SIMPLIFICADO) ---
        const payload = {
            name: `${formData.nombre} ${formData.apellido}`,
            email: formData.correo,
            cedula: formData.numDoc,
            role: formData.rol 
        };

        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch('http://127.0.0.1:8000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // ÉXITO
                if (onSuccess) {
                    onSuccess(); 
                }

                setFormData({
                    nombre: '',
                    apellido: '',
                    tipoDoc: 'Cédula de Ciudadanía (C.C)',
                    numDoc: '',
                    correo: '',
                    rol: rolesList[0]?.name || ''
                });
                onClose();
            } else {
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

                        {/* --- Fila 4: ROL (AQUÍ ESTÁ LA MAGIA) --- */}
                        <div className="mb-4">
                            <label className={styles.label}>Rol Asignado</label>
                            <select 
                                name="rol" 
                                className="form-select"
                                value={formData.rol}
                                onChange={handleChange}
                                required
                            >
                                {/* Opción por defecto mientras carga */}
                                {rolesList.length === 0 && <option value="">Cargando roles...</option>}
                                
                                {/* Bucle que dibuja los roles reales de la BD */}
                                {rolesList.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.display_name || role.name}
                                    </option>
                                ))}
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