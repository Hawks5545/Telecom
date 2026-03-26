/**
 * Auth Helper — centraliza el manejo del token
 * Usa sessionStorage para que la sesión expire al cerrar el navegador
 */

export const getToken  = ()        => sessionStorage.getItem('auth_token');
export const setToken  = (token)   => sessionStorage.setItem('auth_token', token);
export const getUser   = ()        => JSON.parse(sessionStorage.getItem('user_data') || '{}');
export const setUser   = (user)    => sessionStorage.setItem('user_data', JSON.stringify(user));
export const clearAuth = ()        => sessionStorage.clear();
export const isLoggedIn = ()       => !!sessionStorage.getItem('auth_token');
