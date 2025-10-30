import { api } from './apiService';

export const fetchAllSettings = async () => {
    const res = await api.get('/settings');
    return res?.data || res || {};
};
export const fetchSetting = async (key) => {
    const res = await api.get(`/settings/${encodeURIComponent(key)}`);
    return res?.data || res || null;
};
export const saveSettings = async (settings) => api.post('/settings', { settings });
export const deleteSetting = async (key) => api.del(`/settings/${encodeURIComponent(key)}`);

export default { fetchAllSettings, fetchSetting, saveSettings, deleteSetting };
