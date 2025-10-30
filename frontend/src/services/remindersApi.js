import { api } from './apiService';

export const fetchReminders = async (params = undefined) => {
    const res = await api.get('/reminders', params);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

export const createReminder = async (payload) => {
    return api.post('/reminders', payload);
};

export const updateReminder = async (id, payload) => {
    return api.put(`/reminders/${id}`, payload);
};

export const deleteReminderById = async (id) => {
    return api.del(`/reminders/${id}`);
};

export default {
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminderById
};
