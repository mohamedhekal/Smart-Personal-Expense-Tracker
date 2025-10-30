import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Target, TrendingUp, Bell } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import { logActivity } from '../services/activityLogService';
import { fetchGoals, createGoal, updateGoal, deleteGoalById, addAmountToGoal } from '../services/goalsApi';
import './GoalsPage.css';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    reminderEnabled: true
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const data = await fetchGoals();
    setGoals(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const goalData = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      deadline: formData.deadline ? new Date(formData.deadline) : null
    };

    let goalId;
    if (editing) {
      const payload = {
        title: goalData.title,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        deadline: goalData.deadline,
        reminder_enabled: goalData.reminderEnabled
      };
      const saved = await updateGoal(editing.id, payload);
      goalId = saved?.id || editing.id;
      await logActivity('update', 'goal', goalId, { title: goalData.title, targetAmount: goalData.targetAmount }, goalData.currentAmount);
    } else {
      const payload = {
        title: goalData.title,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        deadline: goalData.deadline,
        reminder_enabled: goalData.reminderEnabled
      };
      const saved = await createGoal(payload);
      goalId = saved?.id;
      await logActivity('add', 'goal', goalId, { title: goalData.title, targetAmount: goalData.targetAmount }, goalData.currentAmount);
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
    loadGoals();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      reminderEnabled: true
    });
  };

  const handleDelete = async (id) => {
    if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
      await deleteGoalById(id);
      await logActivity('delete', 'goal', id, {});
      loadGoals();
    }
  };

  const addAmount = async (goal, amount) => {
    const addedAmount = parseFloat(amount);
    await addAmountToGoal(goal.id, addedAmount);
    await logActivity('update', 'goal', goal.id, { title: goal.title, action: 'addAmount', addedAmount }, addedAmount);
    loadGoals();
  };

  const getProgress = (goal) => {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min((goal.currentAmount || 0) / goal.targetAmount * 100, 100);
  };

  return (
    <div className="goals-page">
      <div className="page-header">
        <h2>{t('goals')}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>{t('addGoal')}</span>
        </button>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => {
          const progress = getProgress(goal);
          const isCompleted = progress >= 100;
          return (
            <div key={goal.id} className={`goal-card card ${isCompleted ? 'completed' : ''}`}>
              <div className="goal-header">
                <div className="goal-icon">
                  <Target size={24} />
                </div>
                <div className="goal-info">
                  <h3 className="goal-title">{goal.title}</h3>
                  <div className="goal-amounts">
                    <span className="goal-current">{goal.currentAmount?.toLocaleString()} {t('currency') || 'EGP'}</span>
                    <span className="goal-separator">/</span>
                    <span className="goal-target">{goal.targetAmount?.toLocaleString()} {t('currency') || 'EGP'}</span>
                  </div>
                </div>
              </div>

              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{progress.toFixed(1)}%</span>
              </div>

              {goal.deadline && (
                <div className="goal-deadline">
                  <Bell size={14} />
                  <span>{format(new Date(goal.deadline), 'dd/MM/yyyy')}</span>
                </div>
              )}

              <div className="goal-actions">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    const amount = prompt(t('addAmount') || 'أدخل المبلغ:');
                    if (amount) addAmount(goal, amount);
                  }}
                >
                  <TrendingUp size={16} />
                  {t('addAmount') || 'إضافة مبلغ'}
                </button>
                <button className="btn-icon" onClick={() => {
                  setEditing(goal);
                  setFormData({
                    ...goal,
                    targetAmount: goal.targetAmount?.toString(),
                    currentAmount: goal.currentAmount?.toString(),
                    deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : ''
                  });
                  setShowModal(true);
                }}>
                  <Edit size={18} />
                </button>
                <button className="btn-icon" onClick={() => handleDelete(goal.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="empty-state">
          <Target size={48} className="empty-state-icon" />
          <p>{t('noGoals') || 'لا توجد أهداف مالية بعد'}</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditing(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? t('edit') : t('addGoal')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('title') || 'العنوان'}</label>
                <input
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('targetAmount') || 'المبلغ المستهدف'}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('currentAmount') || 'المبلغ الحالي'}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('deadline') || 'الموعد النهائي'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.reminderEnabled}
                    onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                  />
                  {' '}{t('enableReminders') || 'تفعيل التذكيرات'}
                </label>
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

export default GoalsPage;
