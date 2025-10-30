const API_BASE_URL = localStorage.getItem('api_base_url') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

let accessToken = localStorage.getItem('access_token') || null;

export const setAccessToken = (token) => {
    accessToken = token;
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
};

const defaultHeaders = () => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
};

const handleResponse = async (res) => {
    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            message = data.message || message;
            return Promise.reject({ status: res.status, ...data, message });
        } catch (_) {
            return Promise.reject({ status: res.status, message });
        }
    }
    if (res.status === 204) return null;
    return res.json();
};

export const api = {
    get: async (path, params = undefined) => {
        const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
        const url = `${API_BASE_URL}${path}${qs}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: defaultHeaders()
        });
        const data = await handleResponse(res);
        try { if (localStorage.getItem('debug_api') === '1') console.debug('[API][GET]', url, { data }); } catch { }
        return data;
    },
    post: async (path, body = {}) => {
        const url = `${API_BASE_URL}${path}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: defaultHeaders(),
            body: JSON.stringify(body)
        });
        const data = await handleResponse(res);
        try { if (localStorage.getItem('debug_api') === '1') console.debug('[API][POST]', url, { body, data }); } catch { }
        return data;
    },
    put: async (path, body = {}) => {
        const url = `${API_BASE_URL}${path}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: defaultHeaders(),
            body: JSON.stringify(body)
        });
        const data = await handleResponse(res);
        try { if (localStorage.getItem('debug_api') === '1') console.debug('[API][PUT]', url, { body, data }); } catch { }
        return data;
    },
    del: async (path) => {
        const url = `${API_BASE_URL}${path}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: defaultHeaders()
        });
        const data = await handleResponse(res);
        try { if (localStorage.getItem('debug_api') === '1') console.debug('[API][DELETE]', url, { data }); } catch { }
        return data;
    }
};

export default api;


