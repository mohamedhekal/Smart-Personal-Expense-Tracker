import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import { fetchSalaries, createOrUpdateSalary, deleteSalaryById } from '../services/salariesApi';
import { postActivity } from '../services/activityLogApi';
import './SalariesPage.css';

const SalariesPage = () => {
    const [salaries, setSalaries] = useState([]);
    const [recurringSalaries, setRecurringSalaries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        company: '',
        amount: '',
        receivedDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        isRecurring: false,
        dayOfMonth: new Date().getDate().toString()
    });

    useEffect(() => {
        loadSalaries();
    }, []);

    const loadSalaries = async () => {
        try {
            const allSalaries = await fetchSalaries();
            const recurring = (allSalaries || []).filter(s => s.isRecurring === 1);
            const regular = (allSalaries || [])
                .filter(s => !s.isRecurring || s.isRecurring === 0)
                .sort((a, b) => {
                    if (!a.receivedDate || !b.receivedDate) return 0;
                    return new Date(b.receivedDate) - new Date(a.receivedDate);
                });
            setSalaries(regular);
            setRecurringSalaries(recurring);
        } catch (e) {
            console.warn('Failed to load salaries via API:', e?.message || e);
            setSalaries([]);
            setRecurringSalaries([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const salaryData = {
            ...formData,
            amount: parseFloat(formData.amount),
            receivedDate: formData.isRecurring ? null : new Date(formData.receivedDate),
            isRecurring: formData.isRecurring ? 1 : 0,
            dayOfMonth: formData.isRecurring ? parseInt(formData.dayOfMonth) : null,
            lastAddedDate: formData.isRecurring ? null : undefined
        };

        let salaryId;
        if (editing) {
            const saved = await createOrUpdateSalary({ id: editing.id, ...salaryData });
            salaryId = saved?.id || editing.id;
            try { await postActivity({ action: 'update', entityType: 'salary', entityId: salaryId, details: { company: salaryData.company, amount: salaryData.amount }, amount: salaryData.amount }); } catch { }
        } else {
            const saved = await createOrUpdateSalary(salaryData);
            salaryId = saved?.id;
            try { await postActivity({ action: 'add', entityType: 'salary', entityId: salaryId, details: { company: salaryData.company, amount: salaryData.amount }, amount: salaryData.amount }); } catch { }
        }

        setShowModal(false);
        setEditing(null);
        resetForm();
        loadSalaries();
    };

    const resetForm = () => {
        setFormData({
            company: '',
            amount: '',
            receivedDate: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
            isRecurring: false,
            dayOfMonth: new Date().getDate().toString()
        });
    };

    const handleCheckNow = async () => {
        // Backend should handle recurring via scheduler; just refresh
        await loadSalaries();
    };

    const handleDelete = async (id) => {
        if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
            await deleteSalaryById(id);
            try { await postActivity({ action: 'delete', entityType: 'salary', entityId: id, details: {}, amount: null }); } catch { }
            loadSalaries();
        }
    };

    return (
        <div className="salaries-page">
            <div className="page-header">
                <h2>{t('salaries')}</h2>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleCheckNow}>
                        <RefreshCw size={18} />
                        <span>{t('checkNow') || 'تحقق الآن'}</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        <span>{t('addSalary')}</span>
                    </button>
                </div>
            </div>

            {recurringSalaries.length > 0 && (
                <div className="recurring-salaries-section">
                    <h3 className="section-title">{t('recurringSalaries') || 'الرواتب الشهرية التلقائية'}</h3>
                    <div className="salaries-grid">
                        {recurringSalaries.map((salary) => (
                            <div key={salary.id} className="salary-card-full card recurring-salary">
                                <div className="salary-header">
                                    <div className="salary-company-large">{salary.company}</div>
                                    <div className="salary-amount-large">{salary.amount?.toLocaleString()} {t('currency') || 'EGP'}</div>
                                </div>
                                <div className="salary-recurring-info">
                                    <span className="recurring-badge">{t('recurring') || 'متكرر'}</span>
                                    <span className="day-of-month">
                                        {t('dayOfMonth') || 'يوم'} {salary.dayOfMonth} {t('ofEachMonth') || 'من كل شهر'}
                                    </span>
                                </div>
                                {salary.lastAddedDate && (
                                    <div className="salary-last-added">
                                        {t('lastAdded') || 'آخر إضافة'}: {format(new Date(salary.lastAddedDate), 'dd/MM/yyyy')}
                                    </div>
                                )}
                                <div className="salary-actions">
                                    <button className="btn-icon" onClick={() => {
                                        setEditing(salary);
                                        setFormData({
                                            ...salary,
                                            receivedDate: salary.receivedDate ? format(new Date(salary.receivedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                                            isRecurring: salary.isRecurring === 1,
                                            dayOfMonth: salary.dayOfMonth?.toString() || new Date().getDate().toString()
                                        });
                                        setShowModal(true);
                                    }}>
                                        <Edit size={18} />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleDelete(salary.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="regular-salaries-section">
                <h3 className="section-title">{t('regularSalaries') || 'الرواتب العادية'}</h3>
                <div className="salaries-grid">
                    {salaries.map((salary) => (
                        <div key={salary.id} className="salary-card-full card">
                            <div className="salary-header">
                                <div className="salary-company-large">{salary.company}</div>
                                <div className="salary-amount-large">{salary.amount?.toLocaleString()} {t('currency') || 'EGP'}</div>
                            </div>
                            {salary.receivedDate && (
                                <div className="salary-date-large">{format(new Date(salary.receivedDate), 'dd/MM/yyyy')}</div>
                            )}
                            {salary.notes && <div className="salary-notes">{salary.notes}</div>}
                            <div className="salary-actions">
                                <button className="btn-icon" onClick={() => {
                                    setEditing(salary);
                                    setFormData({
                                        ...salary,
                                        receivedDate: salary.receivedDate ? format(new Date(salary.receivedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                                        isRecurring: salary.isRecurring === 1,
                                        dayOfMonth: salary.dayOfMonth?.toString() || new Date().getDate().toString()
                                    });
                                    setShowModal(true);
                                }}>
                                    <Edit size={18} />
                                </button>
                                <button className="btn-icon" onClick={() => handleDelete(salary.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    resetForm();
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editing ? t('edit') : t('addSalary')}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('company')}</label>
                                <input
                                    className="form-input"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('amount')}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecurring}
                                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                    />
                                    {' '}{t('monthlyRecurring') || 'راتب شهري تلقائي'}
                                </label>
                            </div>
                            {formData.isRecurring ? (
                                <div className="form-group">
                                    <label className="form-label">{t('dayOfMonth') || 'يوم الشهر'}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="form-input"
                                        value={formData.dayOfMonth}
                                        onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                                        required
                                        placeholder={t('dayOfMonthPlaceholder') || 'مثال: 5'}
                                    />
                                    <small className="form-help">{t('dayOfMonthHelp') || 'سيتم إضافة الراتب تلقائياً في نفس اليوم من كل شهر'}</small>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">{t('date')}</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.receivedDate}
                                        onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">{t('notes')}</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">{t('save')}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => {
                                    setShowModal(false);
                                    setEditing(null);
                                    resetForm();
                                }}>{t('cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalariesPage;
