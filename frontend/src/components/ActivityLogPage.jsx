import React, { useEffect, useState } from 'react';
import { Filter, Trash2, RefreshCw, Calendar, DollarSign, Briefcase, Target, Wallet, TrendingUp, MessageSquare, Gem, X } from 'lucide-react';
import { t } from '../services/languageService';
import { getActivities, clearOldActivities } from '../services/activityLogService';
import { deleteAllActivities } from '../services/activityLogApi';
import { format } from 'date-fns';
import './ActivityLogPage.css';

const ActivityLogPage = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entityType: '',
        action: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadActivities();
    }, [filters]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const filterObj = {};
            if (filters.entityType) filterObj.entityType = filters.entityType;
            if (filters.action) filterObj.action = filters.action;
            if (filters.startDate) filterObj.startDate = new Date(filters.startDate);
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                filterObj.endDate = endDate;
            }

            const data = await getActivities(filterObj);
            setActivities(data);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearOld = async () => {
        if (confirm(t('confirmClearOldActivities') || 'هل تريد حذف السجلات القديمة (أكثر من سنة)؟')) {
            const result = await clearOldActivities(365);
            if (result.success) {
                alert((t('oldActivitiesCleared') || 'تم حذف السجلات القديمة بنجاح').replace('{count}', result.deleted || 0));
                loadActivities();
            }
        }
    };

    const handleClearAll = async () => {
        if (confirm(t('confirmClearAllActivities') || 'هل أنت متأكد من حذف جميع السجلات؟')) {
            try { await deleteAllActivities(); } catch { }
            setActivities([]);
            alert(t('allActivitiesCleared') || 'تم حذف جميع السجلات');
        }
    };

    const getEntityIcon = (entityType) => {
        const icons = {
            expense: DollarSign,
            salary: Briefcase,
            certificate: Wallet,
            certificateWithdrawal: Wallet,
            gold: Gem,
            goldPurchase: Gem,
            goldSale: Gem,
            goal: Target,
            freelance: TrendingUp,
            whatsapp: MessageSquare,
            category: Target
        };
        return icons[entityType] || Calendar;
    };

    const getActionLabel = (action) => {
        const labels = {
            add: t('added') || 'إضافة',
            update: t('updated') || 'تعديل',
            delete: t('deleted') || 'حذف',
            sell: t('sold') || 'بيع',
            purchase: t('purchased') || 'شراء',
            repay: t('repaid') || 'سداد',
            withdraw: t('withdrawn') || 'سحب',
            pay: t('paid') || 'دفع',
            autoAdded: t('autoAdded') || 'مضاف تلقائياً'
        };
        return labels[action] || action;
    };

    const getEntityTypeLabel = (entityType) => {
        const labels = {
            expense: t('expense') || 'مصروف',
            salary: t('salary') || 'راتب',
            certificate: t('certificate') || 'شهادة',
            certificateWithdrawal: t('withdrawal') || 'سحب',
            gold: t('gold') || 'ذهب',
            goldPurchase: t('goldPurchase') || 'شراء ذهب',
            goldSale: t('goldSale') || 'بيع ذهب',
            goal: t('goal') || 'هدف',
            freelance: t('freelance') || 'فريلانس',
            whatsapp: t('whatsapp') || 'واتساب',
            category: t('category') || 'فئة'
        };
        return labels[entityType] || entityType;
    };

    const entityTypeOptions = [
        { value: '', label: t('all') || 'الكل' },
        { value: 'expense', label: t('expense') || 'مصروف' },
        { value: 'salary', label: t('salary') || 'راتب' },
        { value: 'certificate', label: t('certificate') || 'شهادة' },
        { value: 'certificateWithdrawal', label: t('withdrawal') || 'سحب' },
        { value: 'goldPurchase', label: t('goldPurchase') || 'شراء ذهب' },
        { value: 'goldSale', label: t('goldSale') || 'بيع ذهب' },
        { value: 'goal', label: t('goal') || 'هدف' },
        { value: 'freelance', label: t('freelance') || 'فريلانس' },
        { value: 'category', label: t('category') || 'فئة' }
    ];

    const actionOptions = [
        { value: '', label: t('all') || 'الكل' },
        { value: 'add', label: t('added') || 'إضافة' },
        { value: 'update', label: t('updated') || 'تعديل' },
        { value: 'delete', label: t('deleted') || 'حذف' },
        { value: 'sell', label: t('sold') || 'بيع' },
        { value: 'purchase', label: t('purchased') || 'شراء' },
        { value: 'repay', label: t('repaid') || 'سداد' },
        { value: 'withdraw', label: t('withdrawn') || 'سحب' },
        { value: 'autoAdded', label: t('autoAdded') || 'مضاف تلقائياً' }
    ];

    return (
        <div className="activity-log-page">
            <div className="page-header">
                <h2>{t('activityLog') || 'سجل العمليات'}</h2>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={18} />
                        <span>{t('filters') || 'تصفية'}</span>
                    </button>
                    <button className="btn btn-secondary" onClick={loadActivities}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="filters-panel card">
                    <div className="filters-grid">
                        <div className="form-group">
                            <label className="form-label">{t('entityType') || 'نوع العملية'}</label>
                            <select
                                className="form-input"
                                value={filters.entityType}
                                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                            >
                                {entityTypeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('action') || 'الإجراء'}</label>
                            <select
                                className="form-input"
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            >
                                {actionOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('startDate') || 'من تاريخ'}</label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('endDate') || 'إلى تاريخ'}</label>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="filters-actions">
                        <button className="btn btn-secondary" onClick={() => {
                            setFilters({ entityType: '', action: '', startDate: '', endDate: '' });
                        }}>
                            {t('clearFilters') || 'مسح التصفية'}
                        </button>
                    </div>
                </div>
            )}

            <div className="log-actions">
                <button className="btn btn-sm btn-danger" onClick={handleClearOld}>
                    <Trash2 size={16} />
                    {t('clearOldActivities') || 'حذف السجلات القديمة'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleClearAll}>
                    <Trash2 size={16} />
                    {t('clearAllActivities') || 'حذف جميع السجلات'}
                </button>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : activities.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} />
                    <p>{t('noActivities') || 'لا توجد عمليات مسجلة'}</p>
                </div>
            ) : (
                <div className="activities-list">
                    {activities.map((activity) => {
                        const Icon = getEntityIcon(activity.entityType);
                        return (
                            <div key={activity.id} className="activity-item card">
                                <div className="activity-icon">
                                    <Icon size={20} />
                                </div>
                                <div className="activity-content">
                                    <div className="activity-header">
                                        <div className="activity-info">
                                            <span className="activity-action">{getActionLabel(activity.action)}</span>
                                            <span className="activity-entity">{getEntityTypeLabel(activity.entityType)}</span>
                                        </div>
                                        <div className="activity-date">
                                            {(() => {
                                                const raw = activity.timestamp || activity.created_at || activity.createdAt || activity.date;
                                                const d = raw ? new Date(raw) : null;
                                                return d && !isNaN(d.getTime()) ? format(d, 'dd/MM/yyyy HH:mm') : '';
                                            })()}
                                        </div>
                                    </div>
                                    {activity.details && Object.keys(activity.details).length > 0 && (
                                        <div className="activity-details">
                                            {activity.details.name && <span>{activity.details.name}</span>}
                                            {activity.details.company && <span>{activity.details.company}</span>}
                                            {activity.details.bankName && <span>{activity.details.bankName}</span>}
                                            {activity.details.amount && (
                                                <span className="activity-amount">
                                                    {parseFloat(activity.details.amount).toLocaleString()} {t('currency') || 'EGP'}
                                                </span>
                                            )}
                                            {activity.amount && !activity.details.amount && (
                                                <span className="activity-amount">
                                                    {activity.amount.toLocaleString()} {t('currency') || 'EGP'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {activity.amount && !activity.details?.amount && (
                                        <div className="activity-amount-main">
                                            {activity.amount.toLocaleString()} {t('currency') || 'EGP'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActivityLogPage;

