import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const ChangePasswordModal = ({ isOpen, token, onSuccess }) => {
    if (!isOpen) return null;

    const [formData, setFormData]       = useState({
        current_password:      '',
        password:              '',
        password_confirmation: ''
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError]             = useState('');
    const [isLoading, setIsLoading]     = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Las contraseñas nuevas no coinciden.');
            return;
        }

        if (formData.password === formData.current_password) {
            setError('La nueva contraseña debe ser diferente a la actual.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Accept':        'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                if (onSuccess) onSuccess();
            } else {
                setError(data.message || 'Error al cambiar la contraseña.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                padding: '2rem', width: '100%', maxWidth: '440px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                {/* Header */}
                <div className="text-center mb-4">
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: '#e8f5f7', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <i className="bi bi-shield-lock-fill"
                           style={{fontSize: '1.8rem', color: '#005461'}}></i>
                    </div>
                    <h5 style={{color: '#005461', fontWeight: 700, marginBottom: '0.5rem'}}>
                        Cambio de Contraseña Requerido
                    </h5>
                    <p className="text-muted" style={{fontSize: '0.9rem', marginBottom: 0}}>
                        Por seguridad debes cambiar tu contraseña temporal antes de continuar.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger p-2 text-center mb-3" style={{fontSize: '0.85rem'}}>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Contraseña temporal */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{fontSize: '0.85rem', color: '#546e7a'}}>
                            Contraseña Temporal
                        </label>
                        <div className="input-group">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                name="current_password"
                                className="form-control"
                                placeholder="Ingresa tu contraseña temporal"
                                value={formData.current_password}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={() => setShowCurrent(!showCurrent)}>
                                <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Nueva contraseña */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{fontSize: '0.85rem', color: '#546e7a'}}>
                            Nueva Contraseña
                        </label>
                        <div className="input-group">
                            <input
                                type={showNew ? 'text' : 'password'}
                                name="password"
                                className="form-control"
                                placeholder="Mínimo 12 caracteres"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={() => setShowNew(!showNew)}>
                                <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                        <div className="form-text" style={{fontSize: '0.75rem'}}>
                            Debe tener al menos 12 caracteres, mayúsculas, minúsculas, números y símbolos.
                        </div>
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold" style={{fontSize: '0.85rem', color: '#546e7a'}}>
                            Confirmar Nueva Contraseña
                        </label>
                        <div className="input-group">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                name="password_confirmation"
                                className="form-control"
                                placeholder="Repite la nueva contraseña"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={() => setShowConfirm(!showConfirm)}>
                                <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 fw-bold"
                        style={{
                            background: '#005461', color: 'white',
                            padding: '0.75rem', borderRadius: '8px',
                            fontSize: '1rem'
                        }}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Cambiando...</>
                            : <><i className="bi bi-check-circle me-2"></i>Cambiar Contraseña</>
                        }
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ChangePasswordModal;
