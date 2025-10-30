import React, { useEffect, useState } from 'react';
import { BarChart, PieChart, TrendingUp, Calendar, DollarSign, PiggyBank } from 'lucide-react';
import { t } from '../services/languageService';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import './ReportsPage.css';
import { fetchOverview, fetchExpensesByCategory, fetchMonthlyComparison, fetchStats } from '../services/reportsApi';
import { fetchGoals } from '../services/goalsApi';
import { fetchGoldPurchases, fetchGoldSales } from '../services/goldApi';
import { fetchCertificates, fetchWithdrawalsByCertificate } from '../services/certificatesApi';

const ReportsPage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
    const [reports, setReports] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        expensesByCategory: {},
        monthlyComparison: [],
        savingsFund: 0,
        certificatesRemaining: 0,
        goalsSavings: 0,
        goldValue: 0
    });

    useEffect(() => {
        loadReports();
    }, [selectedPeriod]);

    const loadReports = async () => {
        let startDate, endDate;
        const now = new Date();

        switch (selectedPeriod) {
            case 'thisMonth':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'lastMonth':
                startDate = startOfMonth(subMonths(now, 1));
                endDate = endOfMonth(subMonths(now, 1));
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
        }

        // Normalize dates for accurate comparison
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        const normalizedEndDate = new Date(endDate);
        normalizedEndDate.setHours(23, 59, 59, 999);

        // Overview via API
        const overviewRange = selectedPeriod === 'thisMonth' ? 'thisMonth' : selectedPeriod === 'lastMonth' ? 'lastMonth' : 'thisYear';
        const toNum = (v) => {
            const n = typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0);
            return isNaN(n) ? 0 : n;
        };
        const statsRes = await fetchStats(overviewRange);
        const totalSalaries = toNum(statsRes?.total_salaries ?? statsRes?.totalSalaries);
        const totalFreelance = toNum(statsRes?.revenue ?? statsRes?.totalFreelance);
        const totalExpenses = toNum(statsRes?.expenses ?? statsRes?.totalExpenses);
        const balanceFromApi = toNum(statsRes?.balance);

        // Calculate savings fund (always current state, not period-based)
        const goals = await fetchGoals();
        const goalsSavings = (goals || []).reduce((sum, g) => sum + (g.current_amount || g.currentAmount || 0), 0);

        // Calculate total gold purchases value (remaining gold)
        const goldPurchases = await fetchGoldPurchases();
        const goldSales = await fetchGoldSales();
        let goldValue = 0;

        for (const purchase of goldPurchases) {
            const purchaseSales = goldSales.filter(s => s.purchaseId === purchase.id);
            const totalSoldGrams = purchaseSales.reduce((sum, s) => {
                const soldGrams = s.saleValue / s.pricePerGram;
                return sum + soldGrams;
            }, 0);
            const remainingGrams = purchase.grams - totalSoldGrams;
            goldValue += remainingGrams * purchase.pricePerGram;
        }

        const certificates = await fetchCertificates();
        let certificatesRemaining = 0;

        for (const cert of (certificates || [])) {
            const withdrawals = await fetchWithdrawalsByCertificate(cert.id);

            const unpaidWithdrawals = withdrawals.filter(w => !w.isRepaid && (!w.isInstallment || (w.paidInstallments || 0) < (w.installmentCount || 1)));
            const totalUnpaidWithdrawn = unpaidWithdrawals.reduce((sum, w) => {
                if (w.isInstallment && w.installmentCount) {
                    const paidInstallments = w.paidInstallments || 0;
                    const unpaidInstallments = (w.installmentCount || 1) - paidInstallments;
                    return sum + (w.amount / w.installmentCount * unpaidInstallments);
                }
                return sum + (w.amount || 0);
            }, 0);

            // Use maxWithdrawalLimit if set, otherwise use certificate amount
            const withdrawalLimit = cert.maxWithdrawalLimit && cert.maxWithdrawalLimit > 0
                ? cert.maxWithdrawalLimit
                : cert.amount;

            certificatesRemaining += Math.max(0, withdrawalLimit - totalUnpaidWithdrawn);
        }

        const savingsFund = (typeof statsRes?.savings_fund !== 'undefined')
            ? toNum(statsRes.savings_fund)
            : (certificatesRemaining + goalsSavings + goldValue);

        // Expenses by category via API
        const expensesByCategoryRaw = await fetchExpensesByCategory(overviewRange);
        let expensesByCategory = {};
        if (Array.isArray(expensesByCategoryRaw)) {
            // API shape: [{ category_id, total }]
            for (const item of expensesByCategoryRaw) {
                const key = (item.category_name || item.category || item.category_id || 'Other');
                expensesByCategory[key] = toNum(item.total);
            }
        } else if (expensesByCategoryRaw && typeof expensesByCategoryRaw === 'object') {
            expensesByCategory = Object.fromEntries(Object.entries(expensesByCategoryRaw).map(([k, v]) => [k, toNum(v)]));
        }

        // Monthly comparison via API
        const monthlyRaw = await fetchMonthlyComparison(new Date().getFullYear());
        let monthlyData = [];
        if (Array.isArray(monthlyRaw)) {
            monthlyData = monthlyRaw;
        } else if (monthlyRaw && typeof monthlyRaw === 'object') {
            const months = Array.from(new Set([
                ...Object.keys(monthlyRaw.expenses || {}),
                ...Object.keys(monthlyRaw.salaries || {})
            ])).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
            monthlyData = months.map(m => ({
                month: m,
                income: toNum((monthlyRaw.salaries || {})[m]),
                expenses: toNum((monthlyRaw.expenses || {})[m])
            }));
        }

        setReports({
            totalIncome: totalSalaries + totalFreelance,
            totalExpenses,
            balance: balanceFromApi || ((totalSalaries + totalFreelance) - totalExpenses),
            expensesByCategory,
            monthlyComparison: monthlyData,
            savingsFund: savingsFund,
            certificatesRemaining: certificatesRemaining,
            goalsSavings: goalsSavings,
            goldValue: goldValue
        });
    };

    const categoryColors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#06b6d4', '#3b82f6', '#ef4444'
    ];

    return (
        <div className="reports-page">
            <div className="page-header">
                <h2>{t('reports')}</h2>
                <select
                    className="period-select"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                    <option value="thisMonth">{t('thisMonth') || 'هذا الشهر'}</option>
                    <option value="lastMonth">{t('lastMonth') || 'الشهر الماضي'}</option>
                    <option value="thisYear">{t('thisYear') || 'هذا العام'}</option>
                </select>
            </div>

            <div className="summary-cards">
                <div className="summary-card income">
                    <div className="summary-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('totalIncome') || 'إجمالي الدخل'}</div>
                        <div className="summary-value">{reports.totalIncome.toLocaleString()} {t('currency') || 'EGP'}</div>
                    </div>
                </div>

                <div className="summary-card expense">
                    <div className="summary-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('totalExpenses') || 'إجمالي المصاريف'}</div>
                        <div className="summary-value">{reports.totalExpenses.toLocaleString()} {t('currency') || 'EGP'}</div>
                    </div>
                </div>

                <div className="summary-card balance">
                    <div className="summary-icon">
                        <BarChart size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('balance') || 'الرصيد'}</div>
                        <div className={`summary-value ${reports.balance < 0 ? 'negative' : 'positive'}`}>
                            {reports.balance.toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                    </div>
                </div>

                <div className="summary-card savings">
                    <div className="summary-icon">
                        <PiggyBank size={24} />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">{t('savingsFund') || 'الصندوق الادخاري'}</div>
                        <div className="summary-value savings-value">
                            {reports.savingsFund.toLocaleString()} {t('currency') || 'EGP'}
                        </div>
                        {reports.savingsFund > 0 && (() => {
                            const parts = [
                                { label: t('certificates') || 'الشهادات', value: reports.certificatesRemaining },
                                { label: t('goals') || 'الأهداف', value: reports.goalsSavings },
                                { label: t('gold') || 'الذهب', value: reports.goldValue }
                            ].filter(p => (p.value || 0) > 0).sort((a, b) => b.value - a.value);
                            if (parts.length === 0) return null;
                            return (
                                <div className="summary-breakdown">
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

            <div className="chart-section">
                <h3 className="section-title">{t('expensesByCategory') || 'المصاريف حسب التصنيف'}</h3>
                <div className="category-chart">
                    {Object.entries(reports.expensesByCategory).map(([category, amount], index) => {
                        const total = Object.values(reports.expensesByCategory).reduce((sum, a) => sum + a, 0);
                        const percentage = total > 0 ? (amount / total * 100) : 0;
                        return (
                            <div key={category} className="category-item">
                                <div className="category-info">
                                    <div
                                        className="category-color"
                                        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                    ></div>
                                    <span className="category-name">{category}</span>
                                </div>
                                <div className="category-amount">
                                    <span className="amount-value">{amount.toLocaleString()} {t('currency') || 'EGP'}</span>
                                    <span className="amount-percentage">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="category-bar">
                                    <div
                                        className="category-fill"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: categoryColors[index % categoryColors.length]
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="chart-section">
                <h3 className="section-title">{t('monthlyComparison') || 'المقارنة الشهرية'}</h3>
                <div className="monthly-chart">
                    {reports.monthlyComparison.map((month, index) => {
                        const maxValue = Math.max(
                            ...reports.monthlyComparison.map(m => Math.max(m.income, m.expenses)),
                            1
                        );
                        return (
                            <div key={index} className="month-item">
                                <div className="month-label">{month.month}</div>
                                <div className="month-bars">
                                    <div className="bar-group">
                                        <div
                                            className="bar income-bar"
                                            style={{ height: `${(month.income / maxValue) * 100}%` }}
                                        ></div>
                                        <span className="bar-label">{month.income.toLocaleString()}</span>
                                    </div>
                                    <div className="bar-group">
                                        <div
                                            className="bar expense-bar"
                                            style={{ height: `${(month.expenses / maxValue) * 100}%` }}
                                        ></div>
                                        <span className="bar-label">{month.expenses.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
