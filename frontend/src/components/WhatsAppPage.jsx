import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, User, Calendar, Package } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import { fetchSubscriptions, createSubscription, deleteSubscription } from '../services/whatsappApi';
import './WhatsAppPage.css';

const WhatsAppPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    systemType: 'system1',
    customerName: '',
    subscriptionId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    plan: 'basic',
    status: 'active'
  });

  useEffect(() => {
    loadSubscriptions();
    // Fetch from external API if available
    fetchExternalSubscriptions();
  }, []);

  const fetchExternalSubscriptions = async () => {
    // TODO: Replace with actual API endpoint
    // const response = await fetch('YOUR_API_ENDPOINT');
    // const data = await response.json();
    // Process and merge with local data
  };

  const loadSubscriptions = async () => {
    const data = await fetchSubscriptions();
    setSubscriptions(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.endDate) {
      // Calculate end date based on plan (default 1 month)
      const start = new Date(formData.startDate);
      start.setMonth(start.getMonth() + 1);
      formData.endDate = format(start, 'yyyy-MM-dd');
    }

    const subscriptionData = {
      phone: formData.customerName,
      plan: formData.plan,
      amount: undefined,
      start_date: new Date(formData.startDate),
      end_date: new Date(formData.endDate),
      is_active: formData.status === 'active',
      notes: formData.subscriptionId
    };

    if (editing) {
      await deleteSubscription(editing.id);
      await createSubscription(subscriptionData);
    } else {
      await createSubscription(subscriptionData);
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
    loadSubscriptions();
  };

  const resetForm = () => {
    setFormData({
      systemType: 'system1',
      customerName: '',
      subscriptionId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      plan: 'basic',
      status: 'active'
    });
  };

  const handleDelete = async (id) => {
    if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
      await deleteSubscription(id);
      loadSubscriptions();
    }
  };

  const renewSubscription = async (subscription) => {
    // Backend should handle renewal/update; for now re-create with new end_date
    await deleteSubscription(subscription.id);
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);
    await createSubscription({
      phone: subscription.customerName,
      plan: subscription.plan,
      start_date: subscription.startDate,
      end_date: newEndDate,
      is_active: true,
      notes: subscription.subscriptionId
    });
    loadSubscriptions();
  };

  const stopSubscription = async (id) => {
    await deleteSubscription(id);
    loadSubscriptions();
  };

  const upgradePlan = async (id, newPlan) => {
    const existing = subscriptions.find(s => s.id === id);
    if (!existing) return;
    await deleteSubscription(id);
    await createSubscription({
      phone: existing.customerName,
      plan: newPlan,
      start_date: existing.startDate,
      end_date: existing.endDate,
      is_active: existing.status === 'active',
      notes: existing.subscriptionId
    });
    loadSubscriptions();
  };

  const plans = ['basic', 'premium', 'enterprise'];
  const systemTypes = ['system1', 'system2'];

  return (
    <div className="whatsapp-page">
      <div className="page-header">
        <h2>{t('whatsapp')}</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchExternalSubscriptions}>
            <RefreshCw size={18} />
            <span>{t('refresh') || 'تحديث'}</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            <span>{t('addCustomer') || 'إضافة عميل'}</span>
          </button>
        </div>
      </div>

      <div className="systems-tabs">
        <button className="tab-btn active">{t('system1') || 'النظام الأول'}</button>
        <button className="tab-btn">{t('system2') || 'النظام الثاني'}</button>
      </div>

      <div className="subscriptions-list">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="subscription-card card">
            <div className="subscription-header">
              <div className="subscription-customer">
                <User size={18} />
                {sub.customerName}
              </div>
              <div className={`badge badge-${sub.status === 'active' ? 'success' : 'danger'}`}>
                {sub.status}
              </div>
            </div>

            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">{t('system') || 'النظام'}</span>
                <span className="detail-value">{sub.systemType === 'system1' ? t('system1') || 'النظام الأول' : t('system2') || 'النظام الثاني'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('plan') || 'الباقة'}</span>
                <span className="detail-value">{sub.plan}</span>
              </div>
              <div className="detail-item">
                <Calendar size={14} />
                <span>{format(new Date(sub.startDate), 'dd/MM/yyyy')} - {format(new Date(sub.endDate), 'dd/MM/yyyy')}</span>
              </div>
            </div>

            <div className="subscription-actions">
              <button className="btn btn-sm btn-success" onClick={() => renewSubscription(sub)}>
                {t('renew') || 'تجديد'}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => {
                const newPlan = plans[plans.indexOf(sub.plan) + 1] || plans[0];
                upgradePlan(sub.id, newPlan);
              }}>
                <Package size={16} />
                {t('upgrade') || 'ترقية'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => stopSubscription(sub.id)}>
                {t('stop') || 'إيقاف'}
              </button>
              <button className="btn-icon" onClick={() => {
                setEditing(sub);
                setFormData({
                  ...sub,
                  startDate: format(new Date(sub.startDate), 'yyyy-MM-dd'),
                  endDate: format(new Date(sub.endDate), 'yyyy-MM-dd')
                });
                setShowModal(true);
              }}>
                <Edit size={18} />
              </button>
              <button className="btn-icon" onClick={() => handleDelete(sub.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditing(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? t('edit') : t('addCustomer') || 'إضافة عميل'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('systemType') || 'نوع النظام'}</label>
                <select
                  className="form-select"
                  value={formData.systemType}
                  onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
                  required
                >
                  {systemTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'system1' ? t('system1') || 'النظام الأول' : t('system2') || 'النظام الثاني'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('customerName') || 'اسم العميل'}</label>
                <input
                  className="form-input"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('subscriptionId') || 'رقم الاشتراك'}</label>
                <input
                  className="form-input"
                  value={formData.subscriptionId}
                  onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('startDate') || 'تاريخ البداية'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('endDate') || 'تاريخ النهاية'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('plan') || 'الباقة'}</label>
                <select
                  className="form-select"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  required
                >
                  {plans.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('status') || 'الحالة'}</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="active">{t('active') || 'نشط'}</option>
                  <option value="stopped">{t('stopped') || 'متوقف'}</option>
                  <option value="expired">{t('expired') || 'منتهي'}</option>
                </select>
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

export default WhatsAppPage;
