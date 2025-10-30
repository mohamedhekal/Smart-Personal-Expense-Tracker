import { api } from './apiService';

const normalizeSalary = (s) => ({
    id: s.id,
    company: s.company,
    amount: s.amount,
    receivedDate: s.receivedDate ? new Date(s.receivedDate) : (s.received_date ? new Date(s.received_date) : null),
    notes: s.notes || '',
    isRecurring: s.isRecurring === 1 || s.is_recurring === 1 || s.is_recurring === true ? 1 : 0,
    dayOfMonth: s.dayOfMonth || s.day_of_month || null
});

export const fetchSalaries = async () => {
    const res = await api.get('/salaries');
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizeSalary);
};

export const fetchSalaryById = async (id) => {
    const res = await api.get(`/salaries/${id}`);
    const obj = res?.data || res || null;
    return obj ? normalizeSalary(obj) : null;
};

export const createOrUpdateSalary = async (payload) => {
    const body = {
        company: payload.company,
        amount: payload.amount,
        received_date: payload.receivedDate ? new Date(payload.receivedDate).toISOString() : null,
        notes: payload.notes || undefined,
        is_recurring: payload.isRecurring === 1 || payload.isRecurring === true ? 1 : 0,
        day_of_month: payload.dayOfMonth || null,
        is_certificate_return: payload.isCertificateReturn || payload.is_certificate_return || false,
        certificate_id: payload.certificateId || payload.certificate_id || null
    };
    let res;
    if (payload.id) {
        res = await api.put(`/salaries/${payload.id}`, body);
    } else {
        res = await api.post('/salaries', body);
    }
    return res?.data || res;
};

export const deleteSalaryById = async (id) => {
    return api.del(`/salaries/${id}`);
};

export default {
    fetchSalaries,
    fetchSalaryById,
    createOrUpdateSalary,
    deleteSalaryById
};
