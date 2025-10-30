import { api } from './apiService';

export const fetchNotifications = async (params = undefined) => {
    const res = await api.get('/notifications', params);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

export const createNotification = async (payload) => {
    return api.post('/notifications', payload);
};

export const deleteNotificationById = async (id) => {
    return api.del(`/notifications/${id}`);
};

export default {
    fetchNotifications,
    createNotification,
    deleteNotificationById
};
