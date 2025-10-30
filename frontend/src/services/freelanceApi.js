import { api } from './apiService';

const normalizeRevenue = (r) => ({
    id: r.id,
    clientName: r.client ?? r.clientName,
    projectName: r.title ?? r.projectName,
    amount: r.amount ?? r.totalAmount,
    dueDate: r.date ? new Date(r.date) : (r.dueDate ? new Date(r.dueDate) : null),
    status: r.status || 'pending'
});

const normalizePayment = (p) => ({
    id: p.id,
    revenueId: p.revenue_id ?? p.revenueId,
    amount: p.amount,
    date: p.date ? new Date(p.date) : null,
    type: p.type || 'payment',
    notes: p.notes || ''
});

// Revenues
export const fetchRevenues = async () => {
    const res = await api.get('/freelance/revenues');
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizeRevenue);
};
export const fetchRevenueById = async (id) => api.get(`/freelance/revenues/${id}`);
export const createRevenue = async (payload) => api.post('/freelance/revenues', payload);
export const deleteRevenue = async (id) => api.del(`/freelance/revenues/${id}`);

// Payments
export const fetchPayments = async (revenueId = undefined) => {
    const res = await api.get('/freelance/payments', revenueId ? { revenueId } : undefined);
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizePayment);
};
export const fetchPaymentById = async (id) => api.get(`/freelance/payments/${id}`);
export const createPayment = async (payload) => api.post('/freelance/payments', payload);
export const deletePayment = async (id) => api.del(`/freelance/payments/${id}`);

export default {
    fetchRevenues,
    fetchRevenueById,
    createRevenue,
    deleteRevenue,
    fetchPayments,
    fetchPaymentById,
    createPayment,
    deletePayment
};
