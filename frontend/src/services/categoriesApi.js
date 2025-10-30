import { api } from './apiService';

export const fetchCategories = async () => {
    const res = await api.get('/expense-categories');
    // Support shapes: [..], { data: [...] }, { success: true, data: [...] }
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

export const createCategory = async (payload) => {
    const res = await api.post('/expense-categories', payload);
    // Return created category object when wrapped
    return res?.data || res;
};

export const deleteCategoryById = async (id) => {
    return api.del(`/expense-categories/${id}`);
};

export default {
    fetchCategories,
    createCategory,
    deleteCategoryById
};
