import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import { logActivity } from '../services/activityLogService';
import { fetchGoldPurchases, fetchGoldSales, createGoldPurchase, updateGoldPurchase, deleteGoldPurchase, createGoldSale, deleteGoldSale } from '../services/goldApi';
import './GoldPage.css';

const GoldPage = () => {
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [purchaseData, setPurchaseData] = useState({
        invoiceValue: '',
        grams: '',
        pricePerGram: '',
        purity: '24',
        type: 'bar',
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });
    const [saleData, setSaleData] = useState({
        saleValue: '',
        pricePerGram: '',
        saleDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const purchasesData = await fetchGoldPurchases();
        const salesData = await fetchGoldSales();

        // Calculate profit/loss for sales and mark purchases as sold
        const purchasesWithDetails = purchasesData.map(purchase => {
            const purchaseSales = salesData.filter(s => s.purchaseId === purchase.id);
            const totalSoldGrams = purchaseSales.reduce((sum, s) => {
                const soldGrams = s.saleValue / s.pricePerGram;
                return sum + soldGrams;
            }, 0);
            const remainingGrams = purchase.grams - totalSoldGrams;
            const totalSaleValue = purchaseSales.reduce((sum, s) => sum + (s.saleValue || 0), 0);
            const totalProfitLoss = totalSaleValue - (purchase.pricePerGram * totalSoldGrams);
            const isFullySold = remainingGrams <= 0;

            return {
                ...purchase,
                remainingGrams: Math.max(0, remainingGrams),
                totalSoldGrams,
                totalSaleValue,
                totalProfitLoss,
                isFullySold,
                sales: purchaseSales
            };
        });

        setPurchases(purchasesWithDetails);
        setSales(salesData);
    };

    const handlePurchaseSubmit = async (e) => {
        e.preventDefault();
        const purchaseInfo = {
            ...purchaseData,
            invoiceValue: parseFloat(purchaseData.invoiceValue),
            grams: parseFloat(purchaseData.grams),
            pricePerGram: parseFloat(purchaseData.pricePerGram),
            purchaseDate: new Date(purchaseData.purchaseDate)
        };

        let purchaseId;
        if (editing) {
            const payload = {
                invoice_value: purchaseInfo.invoiceValue,
                grams: purchaseInfo.grams,
                price_per_gram: purchaseInfo.pricePerGram,
                purity: purchaseInfo.purity,
                type: purchaseInfo.type,
                purchase_date: purchaseInfo.purchaseDate,
                notes: purchaseInfo.notes
            };
            const saved = await updateGoldPurchase(editing.id, payload);
            purchaseId = saved?.id || editing.id;
            await logActivity('update', 'goldPurchase', purchaseId, {
                grams: purchaseInfo.grams,
                type: purchaseInfo.type,
                purity: purchaseInfo.purity
            }, purchaseInfo.invoiceValue);
        } else {
            const payload = {
                invoice_value: purchaseInfo.invoiceValue,
                grams: purchaseInfo.grams,
                price_per_gram: purchaseInfo.pricePerGram,
                purity: purchaseInfo.purity,
                type: purchaseInfo.type,
                purchase_date: purchaseInfo.purchaseDate,
                notes: purchaseInfo.notes
            };
            const saved = await createGoldPurchase(payload);
            purchaseId = saved?.id;
            await logActivity('purchase', 'goldPurchase', purchaseId, {
                grams: purchaseInfo.grams,
                type: purchaseInfo.type,
                purity: purchaseInfo.purity
            }, purchaseInfo.invoiceValue);
        }

        setShowPurchaseModal(false);
        setEditing(null);
        resetPurchaseForm();
        loadData();
    };

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPurchase) return;

        const saleValue = parseFloat(saleData.saleValue);
        const salePricePerGram = parseFloat(saleData.pricePerGram);

        if (!saleValue || !salePricePerGram || salePricePerGram <= 0) {
            alert(t('pleaseEnterValidValues') || 'يرجى إدخال قيم صحيحة');
            return;
        }

        // Calculate sold grams
        const soldGrams = saleValue / salePricePerGram;

        // Check if trying to sell more than available
        if (soldGrams > selectedPurchase.remainingGrams) {
            alert(
                t('insufficientGold') ||
                `لا يوجد ذهب كافي. المتاح: ${selectedPurchase.remainingGrams?.toFixed(2)} ${t('gram') || 'جرام'}، محاولة البيع: ${soldGrams.toFixed(2)} ${t('gram') || 'جرام'}`
            );
            return;
        }

        const saleInfo = {
            purchase_id: selectedPurchase.id,
            sale_value: saleValue,
            price_per_gram: salePricePerGram,
            sale_date: new Date(saleData.saleDate),
            notes: saleData.notes
        };

        // Calculate profit/loss
        const purchaseCost = selectedPurchase.pricePerGram * soldGrams;
        saleInfo.profit_loss = saleValue - purchaseCost;

        const savedSale = await createGoldSale(saleInfo);
        const saleId = savedSale?.id;
        await logActivity('sell', 'goldSale', saleId, {
            purchaseId: selectedPurchase.id,
            grams: soldGrams.toFixed(2),
            pricePerGram: salePricePerGram
        }, saleValue);

        setShowSaleModal(false);
        setSelectedPurchase(null);
        resetSaleForm();
        loadData();
    };

    const resetPurchaseForm = () => {
        setPurchaseData({
            invoiceValue: '',
            grams: '',
            pricePerGram: '',
            purity: '24',
            type: 'bar',
            purchaseDate: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
    };

    const resetSaleForm = () => {
        setSaleData({
            saleValue: '',
            pricePerGram: '',
            saleDate: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
    };

    const handleDelete = async (id) => {
        if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
            await deleteGoldPurchase(id);
            await logActivity('delete', 'goldPurchase', id, {});
            loadData();
        }
    };

    const handleDeleteSale = async (id) => {
        if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
            await deleteGoldSale(id);
            loadData();
        }
    };

    const purityOptions = [
        { value: '24', label: '24 قيراط' },
        { value: '21', label: '21 قيراط' },
        { value: '18', label: '18 قيراط' }
    ];

    const typeOptions = [
        { value: 'bar', label: t('goldBar') || 'سبيكة' },
        { value: 'coin', label: t('goldCoin') || 'جنيه ذهب' },
        { value: 'halfCoin', label: t('halfGoldCoin') || 'نصف جنيه ذهب' },
        { value: 'quarterCoin', label: t('quarterGoldCoin') || 'ربع جنيه ذهب' },
        { value: 'ring', label: t('goldRing') || 'خاتم' },
        { value: 'earring', label: t('goldEarring') || 'حلق' },
        { value: 'necklace', label: t('goldNecklace') || 'انسيال / قلادة' },
        { value: 'bracelet', label: t('goldBracelet') || 'سوار' },
        { value: 'chain', label: t('goldChain') || 'سلسلة' },
        { value: 'pendant', label: t('goldPendant') || 'قلادة' },
        { value: 'brooch', label: t('goldBrooch') || 'بروش' },
        { value: 'other', label: t('otherGold') || 'أخرى' }
    ];

    return (
        <div className="gold-page">
            <div className="page-header">
                <h2>{t('gold') || 'الأوعية الذهبية'}</h2>
                <button className="btn btn-primary" onClick={() => {
                    setEditing(null);
                    resetPurchaseForm();
                    setShowPurchaseModal(true);
                }}>
                    <Plus size={20} />
                    <span>{t('addGoldPurchase') || 'إضافة شراء ذهب'}</span>
                </button>
            </div>

            <div className="gold-summary">
                <div className="summary-card">
                    <div className="summary-icon">
                        <Package size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('totalGoldPurchases') || 'إجمالي المشتريات'}</div>
                        <div className="summary-value">
                            {purchases.reduce((sum, p) => sum + (p.invoiceValue || 0), 0).toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('totalGoldSales') || 'إجمالي المبيعات'}</div>
                        <div className="summary-value">
                            {sales.reduce((sum, s) => sum + (s.saleValue || 0), 0).toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('totalProfitLoss') || 'إجمالي الربح/الخسارة'}</div>
                        <div className={`summary-value ${purchases.reduce((sum, p) => sum + (p.totalProfitLoss || 0), 0) >= 0 ? 'profit' : 'loss'}`}>
                            {purchases.reduce((sum, p) => sum + (p.totalProfitLoss || 0), 0).toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="gold-purchases-list">
                <h3>{t('goldPurchases') || 'المشتريات'}</h3>
                {purchases.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <p>{t('noGoldPurchases') || 'لا توجد مشتريات ذهب'}</p>
                    </div>
                ) : (
                    purchases.map((purchase) => (
                        <div key={purchase.id} className="purchase-card card">
                            <div className="purchase-header">
                                <div className="purchase-info">
                                    <div className="purchase-type-purity">
                                        {typeOptions.find(t => t.value === purchase.type)?.label} - {purchase.purity} {t('carat') || 'قيراط'}
                                    </div>
                                    <div className="purchase-date">{format(new Date(purchase.purchaseDate), 'dd/MM/yyyy')}</div>
                                </div>
                                <div className="purchase-actions">
                                    {!purchase.isFullySold && (
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => {
                                                setSelectedPurchase(purchase);
                                                resetSaleForm();
                                                setShowSaleModal(true);
                                            }}
                                        >
                                            <TrendingUp size={16} />
                                            {t('sell') || 'بيع'}
                                        </button>
                                    )}
                                    <button className="btn-icon" onClick={() => {
                                        setEditing(purchase);
                                        setPurchaseData({
                                            ...purchase,
                                            purchaseDate: format(new Date(purchase.purchaseDate), 'yyyy-MM-dd')
                                        });
                                        setShowPurchaseModal(true);
                                    }}>
                                        <Edit size={18} />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleDelete(purchase.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="purchase-details">
                                <div className="detail-item">
                                    <span className="detail-label">{t('invoiceValue') || 'قيمة الفاتورة'}</span>
                                    <span className="detail-value">{purchase.invoiceValue?.toLocaleString()} {t('currency') || 'EGP'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">{t('grams') || 'الجرامات'}</span>
                                    <span className="detail-value">
                                        {purchase.grams} {t('gram') || 'جرام'}
                                        {purchase.isFullySold ? ` (${t('sold') || 'مباع بالكامل'})` : ` (${purchase.remainingGrams?.toFixed(2)} ${t('remaining') || 'متاح'})`}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">{t('pricePerGram') || 'سعر الجرام'}</span>
                                    <span className="detail-value">{purchase.pricePerGram?.toLocaleString()} {t('currency') || 'EGP'}</span>
                                </div>
                                {purchase.totalSaleValue > 0 && (
                                    <div className="detail-item">
                                        <span className="detail-label">{t('totalSales') || 'إجمالي المبيعات'}</span>
                                        <span className="detail-value">{purchase.totalSaleValue?.toLocaleString()} {t('currency') || 'EGP'}</span>
                                    </div>
                                )}
                                {purchase.totalProfitLoss !== 0 && (
                                    <div className="detail-item">
                                        <span className="detail-label">{t('profitLoss') || 'الربح/الخسارة'}</span>
                                        <span className={`detail-value ${purchase.totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
                                            {purchase.totalProfitLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {Math.abs(purchase.totalProfitLoss).toLocaleString()} {t('currency') || 'EGP'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {purchase.sales && purchase.sales.length > 0 && (
                                <div className="sales-list">
                                    <div className="sales-header">{t('salesHistory') || 'سجل المبيعات'}</div>
                                    {purchase.sales.map((sale) => (
                                        <div key={sale.id} className="sale-item">
                                            <div className="sale-info">
                                                <span>{format(new Date(sale.saleDate), 'dd/MM/yyyy')}</span>
                                                <span>{sale.saleValue?.toLocaleString()} {t('currency') || 'EGP'}</span>
                                                <span>{sale.pricePerGram?.toLocaleString()} {t('currency') || 'EGP'}/{t('gram') || 'جرام'}</span>
                                            </div>
                                            <div className={`sale-profit ${sale.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                                                {sale.profitLoss >= 0 ? '+' : ''}{sale.profitLoss?.toLocaleString()} {t('currency') || 'EGP'}
                                            </div>
                                            <button className="btn-icon-small" onClick={() => handleDeleteSale(sale.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Purchase Modal */}
            {showPurchaseModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowPurchaseModal(false);
                    setEditing(null);
                    resetPurchaseForm();
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editing ? t('edit') : t('addGoldPurchase')}</h3>
                        <form onSubmit={handlePurchaseSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('invoiceValue') || 'قيمة الفاتورة'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={purchaseData.invoiceValue}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, invoiceValue: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('grams') || 'الجرامات'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={purchaseData.grams}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, grams: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('pricePerGram') || 'سعر الجرام'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={purchaseData.pricePerGram}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, pricePerGram: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('purity') || 'العيار'}</label>
                                <select
                                    className="form-input"
                                    value={purchaseData.purity}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, purity: e.target.value })}
                                    required
                                >
                                    {purityOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('goldType') || 'نوع الذهب'}</label>
                                <select
                                    className="form-input"
                                    value={purchaseData.type}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, type: e.target.value })}
                                    required
                                >
                                    {typeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('purchaseDate') || 'تاريخ الشراء'}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={purchaseData.purchaseDate}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, purchaseDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('notes') || 'ملاحظات'}</label>
                                <textarea
                                    className="form-input"
                                    value={purchaseData.notes}
                                    onChange={(e) => setPurchaseData({ ...purchaseData, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => {
                                    setShowPurchaseModal(false);
                                    setEditing(null);
                                    resetPurchaseForm();
                                }}>
                                    {t('cancel') || 'إلغاء'}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editing ? t('update') : t('add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sale Modal */}
            {showSaleModal && selectedPurchase && (
                <div className="modal-overlay" onClick={() => {
                    setShowSaleModal(false);
                    setSelectedPurchase(null);
                    resetSaleForm();
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('sellGold') || 'بيع ذهب'}</h3>
                        <div className="purchase-info-alert">
                            <strong>{t('purchaseInfo') || 'معلومات الشراء'}:</strong>
                            <div>{selectedPurchase.grams} {t('gram') || 'جرام'} × {selectedPurchase.pricePerGram?.toLocaleString()} {t('currency') || 'EGP'}</div>
                            <div>{t('remaining') || 'المتبقي'}: {selectedPurchase.remainingGrams?.toFixed(2)} {t('gram') || 'جرام'}</div>
                        </div>
                        <form onSubmit={handleSaleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('saleValue') || 'قيمة البيع الإجمالية'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={saleData.saleValue}
                                    onChange={(e) => setSaleData({ ...saleData, saleValue: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('pricePerGram') || 'سعر الجرام وقت البيع'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={saleData.pricePerGram}
                                    onChange={(e) => setSaleData({ ...saleData, pricePerGram: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('saleDate') || 'تاريخ البيع'}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={saleData.saleDate}
                                    onChange={(e) => setSaleData({ ...saleData, saleDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('notes') || 'ملاحظات'}</label>
                                <textarea
                                    className="form-input"
                                    value={saleData.notes}
                                    onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => {
                                    setShowSaleModal(false);
                                    setSelectedPurchase(null);
                                    resetSaleForm();
                                }}>
                                    {t('cancel') || 'إلغاء'}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {t('sell') || 'بيع'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoldPage;

