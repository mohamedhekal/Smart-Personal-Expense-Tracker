import { api } from './apiService';

const normalizeCert = (c) => ({
    id: c.id,
    bankName: c.bank_name ?? c.bankName,
    certificateName: c.certificate_name ?? c.certificateName,
    certificateNumber: c.certificate_number ?? c.certificateNumber,
    amount: c.amount,
    monthlyReturn: c.monthly_return ?? c.monthlyReturn,
    returnDayOfMonth: c.return_day_of_month ?? c.returnDayOfMonth,
    lastReturnDate: c.last_return_date ? new Date(c.last_return_date) : (c.lastReturnDate ? new Date(c.lastReturnDate) : null),
    maxWithdrawalLimit: c.max_withdrawal_limit ?? c.maxWithdrawalLimit ?? c.amount,
    depositDate: c.deposit_date ? new Date(c.deposit_date) : (c.depositDate ? new Date(c.depositDate) : null),
    maturityDate: c.maturity_date ? new Date(c.maturity_date) : (c.maturityDate ? new Date(c.maturityDate) : null)
});

const normalizeWithdrawal = (w) => ({
    id: w.id,
    certificateId: w.certificate_id ?? w.certificateId,
    amount: w.amount,
    date: w.date ? new Date(w.date) : null,
    repaymentDate: w.repayment_date ? new Date(w.repayment_date) : (w.repaymentDate ? new Date(w.repaymentDate) : null),
    isRepaid: !!(w.is_repaid ?? w.isRepaid),
    isInstallment: !!(w.is_installment ?? w.isInstallment),
    installmentCount: w.installment_count ?? w.installmentCount ?? null,
    paidInstallments: w.paid_installments ?? w.paidInstallments ?? 0
});

// Certificates
export const fetchCertificates = async () => {
    const res = await api.get('/certificates');
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizeCert);
};

export const fetchCertificateById = async (id) => {
    const res = await api.get(`/certificates/${id}`);
    const obj = res?.data || res || null;
    return obj ? normalizeCert(obj) : null;
};

export const createCertificate = async (payload) => {
    return api.post('/certificates', payload);
};

export const updateCertificate = async (id, payload) => {
    return api.put(`/certificates/${id}`, payload);
};

export const deleteCertificate = async (id) => {
    return api.del(`/certificates/${id}`);
};

// Withdrawals
export const fetchWithdrawalsByCertificate = async (certificateId) => {
    const res = await api.get(`/certificates/${certificateId}/withdrawals`);
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizeWithdrawal);
};

export const fetchWithdrawalById = async (id) => {
    const res = await api.get(`/certificate-withdrawals/${id}`);
    const obj = res?.data || res || null;
    return obj ? normalizeWithdrawal(obj) : null;
};

export const createWithdrawal = async (certificateId, payload) => {
    return api.post(`/certificates/${certificateId}/withdrawals`, payload);
};

export const repayWithdrawal = async (id) => {
    // backend supports both aliases
    return api.post(`/certificate-withdrawals/${id}/repay`);
};

export const payWithdrawalInstallment = async (id) => {
    return api.post(`/withdrawals/${id}/pay-installment`);
};

export const deleteWithdrawal = async (id) => {
    return api.del(`/certificate-withdrawals/${id}`);
};

export default {
    fetchCertificates,
    fetchCertificateById,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    fetchWithdrawalsByCertificate,
    fetchWithdrawalById,
    createWithdrawal,
    repayWithdrawal,
    payWithdrawalInstallment,
    deleteWithdrawal
};
