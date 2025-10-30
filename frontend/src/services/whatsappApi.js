import { api } from './apiService';

const normalizeSub = (s) => ({
    id: s.id,
    customerName: s.phone || s.customerName,
    plan: s.plan || 'basic',
    amount: s.amount || 0,
    startDate: s.start_date ? new Date(s.start_date) : (s.startDate ? new Date(s.startDate) : null),
    endDate: s.end_date ? new Date(s.end_date) : (s.endDate ? new Date(s.endDate) : null),
    status: s.is_active === false ? 'stopped' : 'active',
    subscriptionId: s.notes || s.subscriptionId,
    systemType: s.systemType || 'system1'
});

export const fetchSubscriptions = async () => {
    const res = await api.get('/whatsapp/subscriptions');
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizeSub);
};
export const fetchSubscriptionById = async (id) => api.get(`/whatsapp/subscriptions/${id}`);
export const createSubscription = async (payload) => api.post('/whatsapp/subscriptions', payload);
export const deleteSubscription = async (id) => api.del(`/whatsapp/subscriptions/${id}`);

export default {
    fetchSubscriptions,
    fetchSubscriptionById,
    createSubscription,
    deleteSubscription
};
