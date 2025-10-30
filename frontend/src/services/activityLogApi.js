import { api } from './apiService';

export const postActivity = async (activity) => {
    return api.post('/activity-log', activity);
};

export const fetchActivities = async (params = undefined) => {
    const res = await api.get('/activity-log', params);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

export const deleteActivityById = async (id) => {
    return api.del(`/activity-log/${id}`);
};

export const deleteAllActivities = async () => {
    return api.del('/activity-log');
};

export default {
    postActivity,
    fetchActivities,
    deleteActivityById,
    deleteAllActivities
};
