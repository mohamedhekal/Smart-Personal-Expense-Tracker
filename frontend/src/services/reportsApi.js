import { api } from './apiService';

export const fetchOverview = async (range) => {
    const res = await api.get('/reports/overview', { range });
    return res?.data || res || {};
};

export const fetchExpensesByCategory = async (range) => {
    const res = await api.get('/reports/expenses-by-category', { range });
    return res?.data || res || {};
};

export const fetchMonthlyComparison = async (year) => {
    const res = await api.get('/reports/monthly-comparison', { year });
    // API returns an object { year, expenses: {...}, salaries: {...} }
    return res?.data || res || {};
};

export const fetchStats = async (range) => {
    const res = await api.get('/reports/stats', { range });
    return res?.data || res || {};
};

export default { fetchOverview, fetchExpensesByCategory, fetchMonthlyComparison, fetchStats };
