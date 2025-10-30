import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, Wallet, Briefcase, PiggyBank, MessageSquare } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import './Dashboard.css';
import { fetchStats } from '../services/reportsApi';
import { fetchGoals } from '../services/goalsApi';
import { fetchGoldPurchases, fetchGoldSales } from '../services/goldApi';
import { fetchCertificates, fetchWithdrawalsByCertificate } from '../services/certificatesApi';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalSalaries: 0,
        totalFreelance: 0,
        totalGoldSales: 0,
        totalExpenses: 0,
        balance: 0,
        upcomingPayments: 0,
        activeGoals: 0,
        pendingReminders: 0,
        savingsFund: 0,
        certificatesRemaining: 0,
        goalsSavings: 0,
        goldValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Get current month data
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            // Stats from reports API
            const toNum = (v) => {
                const n = typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0);
                return isNaN(n) ? 0 : n;
            };
            const statsRes = await fetchStats('thisMonth');
            const totalSalaries = toNum(statsRes?.total_salaries ?? statsRes?.totalSalaries);
            const totalExpenses = toNum(statsRes?.expenses ?? statsRes?.totalExpenses);
            const totalFreelancePayments = toNum(statsRes?.revenue ?? statsRes?.totalFreelance);
            const totalGoldSales = toNum(statsRes?.totalGoldSales ?? 0);

            // Active goals and savings
            const goals = await fetchGoals();
            const activeGoals = (goals || []).filter(g => (g.current_amount || g.currentAmount || 0) < (g.target_amount || g.targetAmount || 0));
            const goalsSavings = (goals || []).reduce((sum, g) => sum + (g.current_amount || g.currentAmount || 0), 0);

            // Gold remaining value (approx) from purchases/sales
            const goldPurchases = await fetchGoldPurchases();
            const allGoldSalesRecords = await fetchGoldSales();
            let goldValue = 0;
            for (const purchase of (goldPurchases || [])) {
                const purchaseSales = (allGoldSalesRecords || []).filter(s => s.purchaseId === purchase.id || s.purchase_id === purchase.id);
                const totalSoldGrams = purchaseSales.reduce((sum, s) => {
                    const pricePerGram = toNum(s.pricePerGram ?? s.price_per_gram);
                    const saleValue = toNum(s.saleValue ?? s.sale_value);
                    const soldGrams = pricePerGram > 0 ? (saleValue / pricePerGram) : 0;
                    return sum + soldGrams;
                }, 0);
                const remainingGrams = toNum(purchase.grams) - totalSoldGrams;
                const pricePerGram = toNum(purchase.pricePerGram ?? purchase.price_per_gram);
                goldValue += Math.max(0, remainingGrams) * pricePerGram;
            }

            // Certificates remaining (requires withdrawals per certificate)
            const certificates = await fetchCertificates();
            let certificatesRemaining = 0;
            for (const cert of (certificates || [])) {
                const withdrawals = await fetchWithdrawalsByCertificate(cert.id);
                const unpaidWithdrawals = (withdrawals || []).filter(w => !w.isRepaid && (!w.isInstallment || (toNum(w.paidInstallments) < toNum(w.installmentCount || 1))));
                const totalUnpaidWithdrawn = unpaidWithdrawals.reduce((sum, w) => {
                    if (w.isInstallment && w.installmentCount) {
                        const paidInstallments = toNum(w.paidInstallments);
                        const totalInstallments = toNum(w.installmentCount || 1);
                        const unpaidInstallments = Math.max(0, totalInstallments - paidInstallments);
                        return sum + ((toNum(w.amount) / (totalInstallments || 1)) * unpaidInstallments);
                    }
                    return sum + toNum(w.amount);
                }, 0);
                const withdrawalLimit = toNum(cert.maxWithdrawalLimit ?? cert.max_withdrawal_limit ?? cert.amount);
                certificatesRemaining += Math.max(0, withdrawalLimit - totalUnpaidWithdrawn);
            }

            const savingsFundFromApi = (typeof statsRes?.savings_fund !== 'undefined') ? toNum(statsRes.savings_fund) : null;
            const savingsFund = (savingsFundFromApi !== null) ? savingsFundFromApi : (certificatesRemaining + goalsSavings + goldValue);

            setStats({
                totalIncome: totalSalaries + totalFreelancePayments + totalGoldSales,
                totalSalaries: totalSalaries,
                totalFreelance: totalFreelancePayments,
                totalGoldSales: totalGoldSales,
                totalExpenses,
                balance: (totalSalaries + totalFreelancePayments + totalGoldSales) - totalExpenses,
                upcomingPayments: 0,
                activeGoals: activeGoals.length,
                pendingReminders: 0,
                savingsFund: savingsFund,
                certificatesRemaining: certificatesRemaining,
                goalsSavings: goalsSavings,
                goldValue: goldValue
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>{t('dashboard')}</h2>
                <span className="date-text">{format(new Date(), 'MMMM yyyy')}</span>
            </div>

            <div className="stats-grid">
                <div className="stat-card income">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t('revenue')}</div>
                        <div className="stat-value">{stats.totalIncome.toLocaleString()} {t('currency') || 'EGP'}</div>
                    </div>
                </div>

                <div className="stat-card salary">
                    <div className="stat-icon">
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t('totalSalaries') || 'إجمالي الرواتب'}</div>
                        <div className="stat-value salary-value">{stats.totalSalaries.toLocaleString()} {t('currency') || 'EGP'}</div>
                    </div>
                </div>

                <div className="stat-card expense">
                    <div className="stat-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t('expenses')}</div>
                        <div className="stat-value">{stats.totalExpenses.toLocaleString()} {t('currency') || 'EGP'}</div>
                    </div>
                </div>

                <div className="stat-card balance">
                    <div className="stat-icon">
                        <Wallet size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t('balance') || 'الرصيد'}</div>
                        <div className={`stat-value ${stats.balance < 0 ? 'negative' : ''}`}>
                            {stats.balance.toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                    </div>
                </div>

                <div className="stat-card savings">
                    <div className="stat-icon">
                        <PiggyBank size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">{t('savingsFund') || 'الصندوق الادخاري'}</div>
                        <div className="stat-value savings-value">
                            {stats.savingsFund.toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                        {stats.savingsFund > 0 && (() => {
                            const parts = [
                                { label: t('certificates') || 'الشهادات', value: stats.certificatesRemaining },
                                { label: t('goals') || 'الأهداف', value: stats.goalsSavings },
                                { label: t('gold') || 'الذهب', value: stats.goldValue }
                            ].filter(p => (p.value || 0) > 0).sort((a, b) => b.value - a.value);
                            if (parts.length === 0) return null;
                            return (
                                <div className="stat-breakdown">
                                    {parts.map((p, idx) => (
                                        <small key={idx}>
                                            {p.label}: {p.value.toLocaleString()} {t('currency') || 'EGP'}
                                        </small>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate('/expenses')}>
                    <DollarSign size={20} />
                    <span>{t('expenses')}</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/salaries')}>
                    <DollarSign size={20} />
                    <span>{t('salaries')}</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/certificates')}>
                    <Wallet size={20} />
                    <span>{t('certificates') || 'الشهادات'}</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/goals')}>
                    <Target size={20} />
                    <span>{t('goals')}</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/freelance')}>
                    <TrendingUp size={20} />
                    <span>{t('freelance')}</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/whatsapp')}>
                    <MessageSquare size={20} />
                    <span>{t('whatsapp') || 'الواتساب'}</span>
                </button>
            </div>

            {stats.pendingReminders > 0 && (
                <div className="alert-card">
                    <AlertCircle size={20} />
                    <div>
                        <strong>{t('upcomingReminders') || 'تذكيرات قادمة'}</strong>
                        <p>{stats.pendingReminders} {t('remindersPending') || 'تذكيرات معلقة'}</p>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => navigate('/expenses')}>
                        {t('view') || 'عرض'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
