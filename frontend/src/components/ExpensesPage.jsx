import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Bell, Calendar, Settings, RefreshCw, X } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import { showNotification } from '../services/notificationService';
import { fetchExpenses, createOrUpdateExpense, deleteExpenseById } from '../services/expensesApi';
import { postActivity } from '../services/activityLogApi';
import { fetchCategories, createCategory, deleteCategoryById } from '../services/categoriesApi';
import { fetchReminders, updateReminder } from '../services/remindersApi';
import './ExpensesPage.css';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [regularExpenses, setRegularExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    categoryId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isMonthly: false,
    autoAdd: false,
    dayOfMonth: new Date().getDate().toString(),
    company: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '📦',
    color: '#64748b'
  });

  useEffect(() => {
    loadData();
    loadCategories();
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    let allExpenses = [];
    try {
      const remote = await fetchExpenses();
      allExpenses = Array.isArray(remote) ? remote : [];
    } catch (e) {
      console.warn('Expenses API fetch failed:', e?.message || e);
    }

    const recurring = allExpenses.filter(e => e.isMonthly === 1 && (e.autoAdd === true || e.autoAdd === 1));
    const regular = allExpenses
      .filter(e => !e.isMonthly || e.isMonthly === 0 || e.autoAdd === false)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date) - new Date(a.date);
      });

    setExpenses(allExpenses);
    setRecurringExpenses(recurring);
    setRegularExpenses(regular);
  };

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const checkReminders = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    try {
      const reminders = await fetchReminders();
      const pending = (reminders || []).filter(r => {
        const reminderDate = new Date(r.date);
        const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
        return reminderDay <= today && !r.notificationSent && r.isCompleted === 0;
      });
      pending.forEach(async (reminder) => {
        const exp = reminder.expense || null;
        if (exp) {
          await showNotification(
            t('expenseReminder') || 'تذكير مصروف',
            `${exp.name}: ${exp.amount} ${t('currency') || 'EGP'}`,
            { type: 'alert' }
          );
        }
        try { await updateReminder(reminder.id, { notificationSent: true }); } catch { }
      });
    } catch (e) {
      console.warn('Error checking reminders via API:', e?.message || e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: formData.isMonthly && formData.autoAdd ? null : new Date(formData.date), // No date for auto-add templates
      isRecurring: formData.isMonthly ? true : false,
      isMonthly: formData.isMonthly ? 1 : 0,
      autoAdd: formData.isMonthly && formData.autoAdd ? 1 : 0, // Store as 1 or 0
      dayOfMonth: formData.isMonthly && formData.autoAdd ? parseInt(formData.dayOfMonth, 10) : null,
      lastAddedDate: formData.isMonthly && formData.autoAdd ? null : undefined
    };

    // Ensure categoryId (number) is sent
    const selectedCategoryId = formData.categoryId ? parseInt(formData.categoryId, 10) : null;
    const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories.find(c => c.name === formData.category);
    expenseData.categoryId = selectedCategoryId || undefined;
    expenseData.category = selectedCategory?.name || formData.category || '';

    let expenseId;
    if (editingExpense) {
      const payload = { id: editingExpense.id, ...expenseData };
      const saved = await createOrUpdateExpense(payload);
      expenseId = saved?.id || editingExpense.id;
      try { await postActivity({ action: 'update', entityType: 'expense', entityId: expenseId, details: { name: expenseData.name, amount: expenseData.amount, category: expenseData.category }, amount: expenseData.amount }); } catch { }
    } else {
      const saved = await createOrUpdateExpense(expenseData);
      expenseId = saved?.id;
      try { await postActivity({ action: 'add', entityType: 'expense', entityId: expenseId, details: { name: expenseData.name, amount: expenseData.amount, category: expenseData.category }, amount: expenseData.amount }); } catch { }
    }

    setShowAddModal(false);
    setEditingExpense(null);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      categoryId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isMonthly: false,
      autoAdd: false,
      dayOfMonth: new Date().getDate().toString(),
      company: ''
    });
  };

  const handleDelete = async (id) => {
    if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
      try {
        await deleteExpenseById(id);
      } catch (e) {
        console.warn('Expenses API delete failed:', e?.message || e);
      }
      try { await postActivity({ action: 'delete', entityType: 'expense', entityId: id, details: {}, amount: null }); } catch { }
      loadData();
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    // Validation
    if (!categoryForm.name || categoryForm.name.trim() === '') {
      alert(t('pleaseEnterCategoryName') || 'يرجى إدخال اسم التصنيف');
      return;
    }

    try {
      const created = await createCategory({
        name: categoryForm.name.trim(),
        icon: categoryForm.icon,
        color: categoryForm.color
      });
      try { await postActivity({ action: 'add', entityType: 'category', entityId: created?.id, details: { name: categoryForm.name, icon: categoryForm.icon } }); } catch { }
      await loadCategories();
      setCategoryForm({ name: '', icon: '📦', color: '#64748b' });
      alert(t('categoryAddedSuccessfully') || 'تم إضافة التصنيف بنجاح');
    } catch (error) {
      console.error('Error in handleAddCategory:', error);
      alert((t('errorAddingCategory') || 'خطأ في إضافة التصنيف') + ': ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategoryById(id);
      try { await postActivity({ action: 'delete', entityType: 'category', entityId: id, details: {} }); } catch { }
      await loadCategories();
      alert(t('categoryDeletedSuccessfully') || 'تم حذف التصنيف بنجاح');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('errorDeletingCategory') || 'خطأ في حذف التصنيف: ' + error.message);
    }
  };

  const handleCheckNow = async () => {
    try {
      console.log('Manually checking for recurring expenses...');
      await checkAndAddRecurringExpenses();
      await loadData();
      // Also reload Dashboard data if we're on dashboard
      if (window.location.pathname === '/') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error in handleCheckNow:', error);
      alert(t('errorCheckingExpenses') || 'خطأ في فحص المصاريف التلقائية: ' + error.message);
    }
  };

  const iconOptions = ['📦', '🍔', '🚗', '📄', '🛒', '🏥', '📚', '🎬', '💳', '🏠', '📱', '💊', '🎮', '✈️', '🎁'];

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h2>{t('expenses')}</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
            <Settings size={18} />
            <span>{t('manageCategories') || 'إدارة البنود'}</span>
          </button>
          {/* Optional: if backend has a trigger endpoint, call it here. For now, just reload. */}
          <button className="btn btn-secondary" onClick={async () => { await loadData(); }}>
            <RefreshCw size={18} />
            <span>{t('checkNow') || 'تحقق الآن'}</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            <span>{t('addExpense')}</span>
          </button>
        </div>
      </div>

      {recurringExpenses.length > 0 && (
        <div className="recurring-expenses-section">
          <h3 className="section-title">{t('recurringMonthlyExpenses') || 'المصاريف الشهرية التلقائية'}</h3>
          <div className="expenses-list">
            {recurringExpenses.map((expense) => (
              <div key={expense.id} className="expense-card card recurring-expense">
                <div className="expense-header">
                  <div className="expense-name">{expense.name}</div>
                  <div className="expense-amount">{expense.amount?.toLocaleString()} {t('currency') || 'EGP'}</div>
                </div>
                <div className="expense-details">
                  <span className="badge badge-info" style={{
                    backgroundColor: categories.find(c => c.name === expense.category)?.color || '#6366f1'
                  }}>
                    {categories.find(c => c.name === expense.category)?.icon || ''} {expense.category}
                  </span>
                  <span className="expense-recurring-info">
                    {t('dayOfMonth') || 'يوم'} {expense.dayOfMonth} {t('ofEachMonth') || 'من كل شهر'}
                  </span>
                </div>
                {expense.lastAddedDate && (
                  <div className="expense-last-added">
                    {t('lastAdded') || 'آخر إضافة'}: {format(new Date(expense.lastAddedDate), 'dd/MM/yyyy')}
                  </div>
                )}
                <div className="expense-actions">
                  <button className="btn-icon" onClick={() => {
                    setEditingExpense(expense);
                    setFormData({
                      ...expense,
                      date: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                      isMonthly: expense.isMonthly === 1,
                      autoAdd: expense.autoAdd === true,
                      dayOfMonth: expense.dayOfMonth?.toString() || new Date().getDate().toString(),
                      categoryId: (expense.categoryId ?? (categories.find(c => c.name === expense.category)?.id))?.toString() || ''
                    });
                    setShowAddModal(true);
                  }}>
                    <Edit size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(expense.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="regular-expenses-section">
        <h3 className="section-title">{t('regularExpenses') || 'المصاريف العادية'}</h3>
        <div className="expenses-list">
          {regularExpenses.map((expense) => (
            <div key={expense.id} className="expense-card card">
              <div className="expense-header">
                <div className="expense-name">{expense.name}</div>
                <div className="expense-amount">{expense.amount?.toLocaleString()} {t('currency') || 'EGP'}</div>
              </div>
              <div className="expense-details">
                {(() => {
                  const cat = categories.find(c => c.id === expense.categoryId) || categories.find(c => c.name === expense.category);
                  const bg = cat?.color || '#6366f1';
                  const icon = cat?.icon || '';
                  const label = cat?.name || expense.category || t('uncategorized') || 'بدون تصنيف';
                  return (
                    <span className="badge badge-info" style={{ backgroundColor: bg }}>
                      {icon} {label}
                    </span>
                  );
                })()}
                {(() => {
                  const cat = categories.find(c => c.id === expense.categoryId) || categories.find(c => c.name === expense.category);
                  const bg = cat?.color || '#6366f1';
                  const icon = cat?.icon || '';
                  const label = cat?.name || expense.category || t('uncategorized') || 'بدون تصنيف';
                  return (
                    <span className="badge badge-info" style={{ backgroundColor: bg }}>
                      {icon} {label}
                    </span>
                  );
                })()}
                {expense.date && (
                  <span className="expense-date">{format(new Date(expense.date), 'dd/MM/yyyy')}</span>
                )}
              </div>
              {expense.isRecurring && !expense.isMonthly && (
                <div className="expense-recurring">
                  <Bell size={14} />
                  <span>{t('recurring') || 'متكرر'}</span>
                </div>
              )}
              <div className="expense-actions">
                <button className="btn-icon" onClick={() => {
                  setEditingExpense(expense);
                  setFormData({
                    ...expense,
                    date: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                    isMonthly: expense.isMonthly === 1,
                    autoAdd: expense.autoAdd === true,
                    dayOfMonth: expense.dayOfMonth?.toString() || new Date().getDate().toString(),
                    categoryId: (expense.categoryId ?? (categories.find(c => c.name === expense.category)?.id))?.toString() || ''
                  });
                  setShowAddModal(true);
                }}>
                  <Edit size={18} />
                </button>
                <button className="btn-icon" onClick={() => handleDelete(expense.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingExpense(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? t('edit') : t('addExpense')}</h3>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false);
                setEditingExpense(null);
                resetForm();
              }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('name') || 'الاسم'}</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label className="form-label">{t('category')}</label>
                <select
                  className="form-select"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">{t('selectCategory') || 'اختر التصنيف'}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isMonthly}
                    onChange={(e) => setFormData({ ...formData, isMonthly: e.target.checked, autoAdd: e.target.checked ? formData.autoAdd : false })}
                  />
                  {' '}{t('monthlyExpense') || 'مصروف شهري'}
                </label>
              </div>
              {formData.isMonthly && (
                <>
                  <div className="form-group">
                    <label className="form-label checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.autoAdd}
                        onChange={(e) => setFormData({ ...formData, autoAdd: e.target.checked })}
                      />
                      {' '}{t('autoAddMonthly') || 'إضافة تلقائية كل شهر'}
                    </label>
                  </div>
                  {formData.autoAdd && (
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
                      <small className="form-help">{t('expenseDayOfMonthHelp') || 'سيتم إضافة المصروف تلقائياً في نفس اليوم من كل شهر'}</small>
                    </div>
                  )}
                  {!formData.autoAdd && (
                    <div className="form-group">
                      <label className="form-label">{t('date')}</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </>
              )}
              {!formData.isMonthly && (
                <div className="form-group">
                  <label className="form-label">{t('date')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{t('save')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  setEditingExpense(null);
                  resetForm();
                }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('manageCategories') || 'إدارة البنود'}</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="category-form">
              <div className="form-group">
                <label className="form-label">{t('categoryName') || 'اسم التصنيف'}</label>
                <input
                  className="form-input"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder={t('enterCategoryName') || 'أدخل اسم التصنيف'}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('icon') || 'الأيقونة'}</label>
                <div className="icon-selector">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${categoryForm.icon === icon ? 'selected' : ''}`}
                      onClick={() => setCategoryForm({ ...categoryForm, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('color') || 'اللون'}</label>
                <input
                  type="color"
                  className="form-input color-input"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">{t('addCategory') || 'إضافة تصنيف'}</button>
            </form>
            <div className="categories-list">
              <h4>{t('existingCategories') || 'التصنيفات الموجودة'}</h4>
              {categories.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noCategories') || 'لا توجد تصنيفات'}</p>
                </div>
              ) : (
                <div className="categories-grid">
                  {categories.map(cat => (
                    <div key={cat.id || cat.name} className="category-item">
                      <span className="category-icon" style={{ color: cat.color }}>
                        {cat.icon || '📦'}
                      </span>
                      <span className="category-name">{cat.name}</span>
                      {!cat.isDefault && (
                        <button
                          className="btn-icon delete-category"
                          onClick={async () => {
                            if (confirm(t('confirmDeleteCategory') || 'هل أنت متأكد من حذف هذا التصنيف؟')) {
                              await handleDeleteCategory(cat.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;