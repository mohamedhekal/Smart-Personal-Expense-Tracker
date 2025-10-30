import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, DollarSign, FileText, User, Calendar } from 'lucide-react';
import { t } from '../services/languageService';
import { format } from 'date-fns';
import { fetchRevenues, createRevenue, deleteRevenue, fetchPayments, createPayment, deletePayment } from '../services/freelanceApi';
import './FreelancePage.css';

const FreelancePage = () => {
  const [revenues, setRevenues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    projectName: '',
    duration: '',
    totalAmount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending'
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'payment',
    notes: ''
  });

  useEffect(() => {
    loadRevenues();
  }, []);

  const loadRevenues = async () => {
    const data = await fetchRevenues();
    const withPayments = await Promise.all((data || []).map(async (rev) => {
      const payments = await fetchPayments(rev.id);
      const paidAmount = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      return { ...rev, paidAmount, remainingAmount: (rev.amount || rev.totalAmount || 0) - paidAmount, payments };
    }));
    setRevenues(withPayments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const revenueData = {
      title: formData.projectName,
      client: formData.clientName,
      amount: parseFloat(formData.totalAmount),
      date: new Date(formData.dueDate),
      notes: formData.duration
    };

    if (editing) {
      await deleteRevenue(editing.id);
      await createRevenue(revenueData);
    } else {
      await createRevenue(revenueData);
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
    loadRevenues();
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const payment = {
      revenue_id: selectedRevenue.id,
      amount: parseFloat(paymentData.amount),
      date: new Date(paymentData.date),
      notes: paymentData.notes
    };

    await createPayment(payment);

    // Update revenue status if fully paid
    const updatedRevenue = revenues.find(r => r.id === selectedRevenue.id);
    const newPaidAmount = (updatedRevenue?.paidAmount || 0) + payment.amount;
    const newRemaining = (updatedRevenue?.totalAmount || 0) - newPaidAmount;

    // Backend should compute remaining/status; just reload

    setShowPaymentModal(false);
    setPaymentData({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'payment',
      notes: ''
    });
    loadRevenues();
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      projectName: '',
      duration: '',
      totalAmount: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending'
    });
  };

  const handleDelete = async (id) => {
    if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
      await deleteRevenue(id);
      loadRevenues();
    }
  };

  const generateInvoice = (revenue) => {
    const invoice = {
      client: revenue.clientName,
      project: revenue.projectName,
      total: revenue.totalAmount,
      paid: revenue.paidAmount || 0,
      remaining: revenue.remainingAmount || 0,
      date: format(new Date(revenue.dueDate), 'yyyy-MM-dd')
    };

    const invoiceText = `
      Invoice
      Client: ${invoice.client}
      Project: ${invoice.project}
      Total: ${invoice.total} EGP
      Paid: ${invoice.paid} EGP
      Remaining: ${invoice.remaining} EGP
      Date: ${invoice.date}
    `;

    alert(invoiceText);
  };

  return (
    <div className="freelance-page">
      <div className="page-header">
        <h2>{t('freelance')}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>{t('addRevenue')}</span>
        </button>
      </div>

      <div className="revenues-list">
        {revenues.map((revenue) => (
          <div key={revenue.id} className="revenue-card card">
            <div className="revenue-header">
              <div>
                <div className="revenue-client">
                  <User size={16} />
                  {revenue.clientName}
                </div>
                <div className="revenue-project">{revenue.projectName}</div>
              </div>
              <div className={`badge badge-${revenue.status === 'completed' ? 'success' : 'warning'}`}>
                {revenue.status}
              </div>
            </div>

            <div className="revenue-amounts">
              <div className="amount-item">
                <span className="amount-label">{t('total')}</span>
                <span className="amount-value">{revenue.totalAmount?.toLocaleString()} {t('currency') || 'EGP'}</span>
              </div>
              <div className="amount-item">
                <span className="amount-label">{t('paid')}</span>
                <span className="amount-value success">{revenue.paidAmount?.toLocaleString()} {t('currency') || 'EGP'}</span>
              </div>
              <div className="amount-item">
                <span className="amount-label">{t('remaining')}</span>
                <span className="amount-value danger">{revenue.remainingAmount?.toLocaleString()} {t('currency') || 'EGP'}</span>
              </div>
            </div>

            <div className="revenue-details">
              <div className="revenue-detail">
                <Calendar size={14} />
                <span>{format(new Date(revenue.dueDate), 'dd/MM/yyyy')}</span>
              </div>
              {revenue.duration && (
                <div className="revenue-detail">
                  <span>{revenue.duration}</span>
                </div>
              )}
            </div>

            <div className="revenue-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setSelectedRevenue(revenue);
                  setShowPaymentModal(true);
                }}
              >
                <DollarSign size={16} />
                {t('addPayment') || 'إضافة دفعة'}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => generateInvoice(revenue)}
              >
                <FileText size={16} />
                {t('invoice') || 'فاتورة'}
              </button>
              <button className="btn-icon" onClick={() => {
                setEditing(revenue);
                setFormData({
                  ...revenue,
                  dueDate: format(new Date(revenue.dueDate), 'yyyy-MM-dd')
                });
                setShowModal(true);
              }}>
                <Edit size={18} />
              </button>
              <button className="btn-icon" onClick={() => handleDelete(revenue.id)}>
                <Trash2 size={18} />
              </button>
            </div>

            {revenue.payments && revenue.payments.length > 0 && (
              <div className="payments-list">
                <div className="payments-header">{t('payments') || 'الدفعات'}</div>
                {revenue.payments.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <span>{payment.amount?.toLocaleString()} {t('currency') || 'EGP'}</span>
                    <span className="payment-type">{payment.type}</span>
                    <span className="payment-date">{format(new Date(payment.date), 'dd/MM/yyyy')}</span>
                  </div>
                ))}
              </div>
            )}
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
            <h3>{editing ? t('edit') : t('addRevenue')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('clientName') || 'اسم العميل'}</label>
                <input
                  className="form-input"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('projectName') || 'اسم المشروع'}</label>
                <input
                  className="form-input"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('duration') || 'المدة'}</label>
                <input
                  className="form-input"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder={t('durationPlaceholder') || 'مثال: 3 أشهر'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('totalAmount') || 'المبلغ الإجمالي'}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('dueDate') || 'تاريخ الاستحقاق'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
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

      {showPaymentModal && selectedRevenue && (
        <div className="modal-overlay" onClick={() => {
          setShowPaymentModal(false);
          setSelectedRevenue(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addPayment') || 'إضافة دفعة'}</h3>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label className="form-label">{t('amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  max={selectedRevenue.remainingAmount}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('date')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('type') || 'النوع'}</label>
                <select
                  className="form-select"
                  value={paymentData.type}
                  onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                  required
                >
                  <option value="payment">{t('payment') || 'دفعة'}</option>
                  <option value="settlement">{t('settlement') || 'تسديد'}</option>
                  <option value="discount">{t('discount') || 'خصم'}</option>
                  <option value="refund">{t('refund') || 'إرجاع'}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('notes')}</label>
                <textarea
                  className="form-textarea"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{t('save')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedRevenue(null);
                }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancePage;
