import { api } from './apiService';

const normalizeExpense = (e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    category: e.category || e.category_name || '',
    categoryId: e.category_id || e.categoryId || null,
    date: e.date ? new Date(e.date) : null,
    isMonthly: e.isMonthly === 1 || e.is_monthly === 1 || e.is_monthly === true ? 1 : 0,
    autoAdd: e.autoAdd === 1 || e.auto_add === 1 || e.auto_add === true,
    dayOfMonth: e.dayOfMonth || e.day_of_month || null,
    company: e.company || ''
});

export const fetchExpenses = async () => {
    const res = await api.get('/expenses');
    // Support shapes:
    // 1) [ ... ]
    // 2) { data: [ ... ] }
    // 3) { success: true, data: [ ... ] }
    // 4) { success: true, data: { data: [ ... ], ...pagination } }
    let list = [];
    if (Array.isArray(res)) {
        list = res;
    } else if (Array.isArray(res?.data)) {
        list = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
    } else if (Array.isArray(res?.results)) { // fallback for other shapes
        list = res.results;
    }
    return list.map(normalizeExpense);
};

export const fetchExpenseById = async (id) => {
    const res = await api.get(`/expenses/${id}`);
    const obj = res?.data || res || null;
    return obj ? normalizeExpense(obj) : null;
};

export const createOrUpdateExpense = async (payload) => {
    // map UI payload -> API schema
    const body = {
        name: payload.name,
        amount: payload.amount,
        category_id: payload.categoryId || payload.category_id || undefined,
        date: payload.date ? new Date(payload.date).toISOString() : null,
        is_monthly: payload.isMonthly === 1 || payload.isMonthly === true ? 1 : 0,
        auto_add: payload.autoAdd === 1 || payload.autoAdd === true ? 1 : 0,
        day_of_month: payload.dayOfMonth || payload.day_of_month || null,
        notes: payload.notes || undefined
    };
    let res;
    if (payload.id) {
        res = await api.put(`/expenses/${payload.id}`, body);
    } else {
        res = await api.post('/expenses', body);
    }
    return res?.data || res;
};

export const deleteExpenseById = async (id) => {
    return api.del(`/expenses/${id}`);
};

export default {
    fetchExpenses,
    fetchExpenseById,
    createOrUpdateExpense,
    deleteExpenseById
};
