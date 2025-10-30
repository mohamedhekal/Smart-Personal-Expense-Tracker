import { api } from './apiService';

const normalizeGoal = (g) => ({
    id: g.id,
    title: g.title,
    targetAmount: g.target_amount ?? g.targetAmount,
    currentAmount: g.current_amount ?? g.currentAmount ?? 0,
    deadline: g.deadline ? new Date(g.deadline) : null,
    reminderEnabled: g.reminder_enabled ?? g.reminderEnabled ?? true
});

export const fetchGoals = async () => {
    const res = await api.get('/goals');
    const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return data.map(normalizeGoal);
};
export const fetchGoalById = async (id) => {
    const res = await api.get(`/goals/${id}`);
    const obj = res?.data || res || null;
    return obj ? normalizeGoal(obj) : null;
};
export const createGoal = async (payload) => {
    const res = await api.post('/goals', payload);
    return res?.data || res;
};
export const updateGoal = async (id, payload) => {
    const res = await api.put(`/goals/${id}`, payload);
    return res?.data || res;
};
export const deleteGoalById = async (id) => api.del(`/goals/${id}`);
export const addAmountToGoal = async (id, amount) => api.post(`/goals/${id}/add-amount`, { amount });

export default { fetchGoals, fetchGoalById, createGoal, updateGoal, deleteGoalById, addAmountToGoal };
