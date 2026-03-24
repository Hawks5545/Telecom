import React, { useState, useEffect } from 'react';
import styles from './UserModal.module.css';

const UserModal = ({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;

    const [rolesList, setRolesList]         = useState([]);
    const [tempPassword, setTempPassword]   = useState(null); // ← NUEVO
    const [showPassword, setShowPassword]   = useState(false); // ← NUEVO
    const [userCreated, setUserCreated]     = useState(false); // ← NUEVO

    const [formData, setFormData] = useState({
        nombre:   '',
        apellido: '',
        tipoDoc:  'Cédula de Ciudadanía (C.C)',
        numDoc:   '',
        correo:   '',
        rol:      ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]               = useState('');

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token    = localStorage.getItem('auth_token');
                const response = await fetch('/api/roles', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setRolesList(data);
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const payload = {
            name:   `${formData.nombre} ${formData.apellido}`,
            email:  formData.correo,
            cedula: formData.numDoc,
            role:   formData.rol
        };

        try {
            const token    = localStorage.getItem('auth_token');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // ← NUEVO: guardar contraseña temporal y mostrarla
                setTempPassword(data.temp_password);
                setUserCreated(true);
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

    const handleClose = () => {
        if (userCreated && onSuccess) onSuccess();
        setTempPassword(null);
        setUserCreated(false);
        setShowPassword(false);
        setFormData({
            nombre: '', apellido: '',
            tipoDoc: 'Cédula de Ciudadanía (C.C)',
            numDoc: '', correo: '',
            rol: rolesList[0]?.name || ''
        });
        onClose();
    };

    const handleCopyPassword = () => {

        const input = document.createElement('input');
        input.value = tempPassword;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    }; 

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>

                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>
                        {userCreated ? '✅ Usuario Creado' : 'Registrar Nuevo Usuario'}
                    </h5>
                    <button className={styles.btnClose} onClick={handleClose} disabled={isSubmitting}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className="alert alert-danger p-2 text-center mb-3" style={{fontSize: '0.9rem'}}>
                            {error}
                        </div>
                    )}

                    {/* PANTALLA DE CONTRASEÑA TEMPORAL */}
                    {userCreated && tempPassword ? (
                        <div className="text-center py-2">
                            <div className="mb-3">
                                <i className="bi bi-shield-lock-fill text-success" style={{fontSize: '3rem'}}></i>
                            </div>
                            <p className="text-muted mb-1" style={{fontSize: '0.9rem'}}>
                                El usuario ha sido creado exitosamente.
                            </p>
                            <p className="fw-bold mb-3" style={{fontSize: '0.9rem'}}>
                                Comparte esta contraseña temporal con el usuario.<br/>
                                <span className="text-danger">Solo se muestra una vez.</span>
                            </p>

                            {/* CAJA DE CONTRASEÑA */}
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                <div
                                    className="p-3 rounded border"
                                    style={{
                                        background: '#f8f9fa',
                                        fontFamily: 'monospace',
                                        fontSize: '1.4rem',
                                        fontWeight: 'bold',
                                        letterSpacing: '3px',
                                        color: '#005461',
                                        minWidth: '220px'
                                    }}
                                >
                                    {showPassword ? tempPassword : '••••••••••••'}
                                </div>
                                <div className="d-flex flex-column gap-1">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-success"
                                        onClick={handleCopyPassword}
                                        title="Copiar contraseña"
                                    >
                                        <i className="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            </div>

                            <p className="text-muted small mb-4">
                                <i className="bi bi-info-circle me-1"></i>
                                Al ingresar, el sistema le pedirá al usuario cambiar esta contraseña.
                            </p>

                            <button className={styles.btnSave} onClick={handleClose}>
                                <i className="bi bi-check-lg me-2"></i>Entendido
                            </button>
                        </div>
                    ) : (
                        /* FORMULARIO NORMAL */
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className={styles.label}>Nombres</label>
                                    <input type="text" name="nombre" className="form-control"
                                        placeholder="Ej: Carlos" value={formData.nombre}
                                        onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.label}>Apellidos</label>
                                    <input type="text" name="apellido" className="form-control"
                                        placeholder="Ej: Perez" value={formData.apellido}
                                        onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className={styles.label}>Tipo Documento</label>
                                    <select name="tipoDoc" className="form-select"
                                        value={formData.tipoDoc} onChange={handleChange}>
                                        <option>Cédula de Ciudadanía (C.C)</option>
                                        <option>Cédula de Extranjería (C.E)</option>
                                        <option>Pasaporte</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.label}>Número Documento</label>
                                    <input type="number" name="numDoc" className="form-control"
                                        placeholder="Ej: 1098..." value={formData.numDoc}
                                        onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className={styles.label}>Correo Electrónico</label>
                                <input type="email" name="correo" className="form-control"
                                    placeholder="nombre@empresa.com" value={formData.correo}
                                    onChange={handleChange} required />
                            </div>

                            <div className="mb-4">
                                <label className={styles.label}>Rol Asignado</label>
                                <select name="rol" className="form-select"
                                    value={formData.rol} onChange={handleChange} required>
                                    {rolesList.length === 0 && <option value="">Cargando roles...</option>}
                                    {rolesList.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.display_name || role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnCancel}
                                    onClick={handleClose} disabled={isSubmitting}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnSave} disabled={isSubmitting}>
                                    {isSubmitting ? 'Registrando...' : 'Registrar Usuario'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserModal;
