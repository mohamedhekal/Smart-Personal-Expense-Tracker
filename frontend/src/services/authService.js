import { api, setAccessToken } from './apiService';

export const getCurrentUser = async () => {
    try {
        return await api.get('/user');
    } catch {
        return null;
    }
};

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const token = response?.token || response?.data?.token;
    if (token) setAccessToken(token);
    return response;
};

export const register = async (name, email, password, passwordConfirmation) => {
    const response = await api.post('/auth/register', { name, email, password, password_confirmation: passwordConfirmation });
    const token = response?.token || response?.data?.token;
    if (token) setAccessToken(token);
    return response;
};

export const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) { }
    setAccessToken(null);
};

export const isAuthenticated = () => !!localStorage.getItem('access_token');


