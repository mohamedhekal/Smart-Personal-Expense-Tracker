import { api } from './apiService';

const normalizePurchase = (p) => ({
    id: p.id,
    invoiceValue: p.invoice_value ?? p.invoiceValue,
    grams: p.grams,
    pricePerGram: p.price_per_gram ?? p.pricePerGram,
    purity: p.purity,
    type: p.type,
    purchaseDate: p.purchase_date ? new Date(p.purchase_date) : (p.purchaseDate ? new Date(p.purchaseDate) : null),
    notes: p.notes || ''
});

const normalizeSale = (s) => ({
    id: s.id,
    purchaseId: s.purchase_id ?? s.purchaseId,
    saleValue: s.sale_value ?? s.saleValue,
    pricePerGram: s.price_per_gram ?? s.pricePerGram,
    saleDate: s.sale_date ? new Date(s.sale_date) : (s.saleDate ? new Date(s.saleDate) : null),
    profitLoss: s.profit_loss ?? s.profitLoss ?? 0,
    notes: s.notes || ''
});

// Purchases
export const fetchGoldPurchases = async () => {
    const res = await api.get('/gold/purchases');
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizePurchase);
};
export const fetchGoldPurchaseById = async (id) => api.get(`/gold/purchases/${id}`);
export const createGoldPurchase = async (payload) => {
    const res = await api.post('/gold/purchases', payload);
    return res?.data || res;
};
export const updateGoldPurchase = async (id, payload) => {
    const res = await api.put(`/gold/purchases/${id}`, payload);
    return res?.data || res;
};
export const deleteGoldPurchase = async (id) => api.del(`/gold/purchases/${id}`);

// Sales
export const fetchGoldSales = async () => {
    const res = await api.get('/gold/sales');
    let data = [];
    if (Array.isArray(res)) {
        data = res;
    } else if (Array.isArray(res?.data)) {
        data = res.data;
    } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
    }
    return data.map(normalizeSale);
};
export const fetchGoldSaleById = async (id) => api.get(`/gold/sales/${id}`);
export const createGoldSale = async (payload) => {
    const res = await api.post('/gold/sales', payload);
    return res?.data || res;
};
export const deleteGoldSale = async (id) => api.del(`/gold/sales/${id}`);

export default {
    fetchGoldPurchases,
    fetchGoldPurchaseById,
    createGoldPurchase,
    updateGoldPurchase,
    deleteGoldPurchase,
    fetchGoldSales,
    fetchGoldSaleById,
    createGoldSale,
    deleteGoldSale
};
