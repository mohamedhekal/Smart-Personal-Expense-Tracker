import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Banknote, AlertTriangle, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { t } from '../services/languageService';
import { format, addDays, differenceInDays } from 'date-fns';
import { showNotification } from '../services/notificationService';
import { logActivity } from '../services/activityLogService';
import { fetchCertificates, createCertificate, updateCertificate, deleteCertificate, fetchWithdrawalsByCertificate, createWithdrawal, repayWithdrawal, payWithdrawalInstallment } from '../services/certificatesApi';
import './CertificatesPage.css';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    certificateName: '',
    certificateNumber: '',
    amount: '',
    maxWithdrawalLimit: '',
    monthlyReturn: '',
    returnDayOfMonth: '',
    depositDate: format(new Date(), 'yyyy-MM-dd'),
    maturityDate: ''
  });
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isInstallment: false,
    installmentCount: 1
  });

  useEffect(() => {
    loadCertificates();
    checkWithdrawalDeadlines();
    const interval = setInterval(checkWithdrawalDeadlines, 86400000); // Check daily
    return () => clearInterval(interval);
  }, []);

  const loadCertificates = async () => {
    const data = await fetchCertificates();
    const withDetails = await Promise.all((data || []).map(async (cert) => {
      const withdrawals = await fetchWithdrawalsByCertificate(cert.id);

      // Calculate total withdrawn (unpaid withdrawals only)
      const unpaidWithdrawals = withdrawals.filter(w => !w.isRepaid && (!w.isInstallment || (w.paidInstallments || 0) < (w.installmentCount || 1)));
      const totalUnpaidWithdrawn = unpaidWithdrawals.reduce((sum, w) => {
        if (w.isInstallment && w.installmentCount) {
          // For installments, count unpaid portion only
          const paidInstallments = w.paidInstallments || 0;
          const unpaidInstallments = (w.installmentCount || 1) - paidInstallments;
          return sum + (w.amount / w.installmentCount * unpaidInstallments);
        }
        return sum + (w.amount || 0);
      }, 0);

      // Total withdrawn (all withdrawals for display)
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

      // Total repaid
      const totalRepaid = withdrawals.reduce((sum, w) => {
        if (w.isRepaid) return sum + (w.amount || 0);
        if (w.isInstallment && w.installmentCount) {
          const installmentsPaid = w.paidInstallments || 0;
          return sum + (w.amount / w.installmentCount * installmentsPaid);
        }
        return sum;
      }, 0);

      const pendingRepayment = totalWithdrawn - totalRepaid;

      // Calculate remaining amount considering max withdrawal limit
      // If maxWithdrawalLimit is set, it's the maximum that can be withdrawn
      // Otherwise, use the certificate amount
      const withdrawalLimit = cert.maxWithdrawalLimit && cert.maxWithdrawalLimit > 0
        ? cert.maxWithdrawalLimit
        : cert.amount;

      // Remaining amount = withdrawal limit - unpaid withdrawals
      // When you repay, the amount returns to available balance
      const remainingAmount = Math.max(0, withdrawalLimit - totalUnpaidWithdrawn);

      // Get dangerous withdrawals (close to 55 days)
      // Exclude fully repaid withdrawals and installments
      const dangerousWithdrawals = withdrawals.filter(w => {
        if (w.isRepaid) return false; // Fully repaid
        if (w.isInstallment) {
          // For installments, check if fully paid
          if ((w.paidInstallments || 0) >= (w.installmentCount || 1)) return false;
        }
        const repaymentDate = addDays(new Date(w.date), 55);
        const daysLeft = differenceInDays(repaymentDate, new Date());
        return daysLeft <= 10 && daysLeft >= 0;
      });

      return {
        ...cert,
        withdrawals,
        totalWithdrawn,
        totalRepaid,
        pendingRepayment,
        remainingAmount,
        dangerousWithdrawals
      };
    }));
    setCertificates(withDetails);
  };

  const checkWithdrawalDeadlines = async () => {
    // Reload certificates and compute deadlines client-side
    try {
      const data = await fetchCertificates();
      for (const cert of (data || [])) {
        const withdrawals = await fetchWithdrawalsByCertificate(cert.id);
        const now = new Date();
        for (const w of (withdrawals || [])) {
          if (w.isInstallment || w.isRepaid) continue;
          const repaymentDate = addDays(new Date(w.date), 55);
          const daysLeft = differenceInDays(repaymentDate, now);
          if (daysLeft <= 7 && daysLeft > 0) {
            await showNotification(
              t('withdrawalDeadline') || 'تحذير: موعد استرداد السحب قريب',
              `${cert?.bankName || ''} - ${cert?.certificateNumber || ''}: ${daysLeft} ${t('daysLeft') || 'أيام متبقية'}`,
              { type: 'alert' }
            );
          }
        }
      }
    } catch (e) {
      console.warn('Deadline check failed:', e?.message || e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const maxWithdrawalLimit = formData.maxWithdrawalLimit
      ? parseFloat(formData.maxWithdrawalLimit)
      : null;

    // Validate: maxWithdrawalLimit should not exceed certificate amount
    if (maxWithdrawalLimit && maxWithdrawalLimit > amount) {
      alert(t('maxWithdrawalLimitExceedsAmount') || 'الحد الأقصى للسحب لا يمكن أن يتجاوز قيمة الشهادة');
      return;
    }

    const certData = {
      ...formData,
      amount: amount,
      maxWithdrawalLimit: maxWithdrawalLimit,
      monthlyReturn: parseFloat(formData.monthlyReturn) || 0,
      returnDayOfMonth: formData.monthlyReturn && parseFloat(formData.monthlyReturn) > 0 && formData.returnDayOfMonth
        ? parseInt(formData.returnDayOfMonth, 10) : null,
      lastReturnDate: null,
      depositDate: new Date(formData.depositDate),
      maturityDate: formData.maturityDate ? new Date(formData.maturityDate) : null,
      withdrawals: [],
      repayments: []
    };

    let certId;
    if (editing) {
      const payload = {
        bank_name: certData.bankName,
        certificate_name: certData.certificateName,
        certificate_number: certData.certificateNumber,
        amount: certData.amount,
        monthly_return: certData.monthlyReturn,
        return_day_of_month: certData.returnDayOfMonth,
        max_withdrawal_limit: certData.maxWithdrawalLimit,
        deposit_date: certData.depositDate,
        maturity_date: certData.maturityDate
      };
      const saved = await updateCertificate(editing.id, payload);
      certId = saved?.id || editing.id;
      await logActivity('update', 'certificate', certId, {
        bankName: certData.bankName,
        certificateName: certData.certificateName,
        amount: certData.amount
      }, certData.amount);
    } else {
      const payload = {
        bank_name: certData.bankName,
        certificate_name: certData.certificateName,
        certificate_number: certData.certificateNumber,
        amount: certData.amount,
        monthly_return: certData.monthlyReturn,
        return_day_of_month: certData.returnDayOfMonth,
        max_withdrawal_limit: certData.maxWithdrawalLimit,
        deposit_date: certData.depositDate,
        maturity_date: certData.maturityDate
      };
      const saved = await createCertificate(payload);
      certId = saved?.id;
      await logActivity('add', 'certificate', certId, {
        bankName: certData.bankName,
        certificateName: certData.certificateName,
        amount: certData.amount
      }, certData.amount);
    }

    setShowModal(false);
    setEditing(null);
    resetForm();
    loadCertificates();
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    const withdrawalAmount = parseFloat(withdrawalData.amount);

    // Check if there's enough remaining in certificate
    // Use remainingAmount which correctly excludes repaid withdrawals
    const remaining = selectedCertificate.remainingAmount || 0;
    if (withdrawalAmount > remaining) {
      alert(t('insufficientCertificateFunds') || `المبلغ المتاح: ${remaining.toLocaleString()} ${t('currency') || 'EGP'}`);
      return;
    }

    const withdrawal = {
      amount: withdrawalAmount,
      date: new Date(withdrawalData.date),
      repayment_date: withdrawalData.isInstallment ? null : addDays(new Date(withdrawalData.date), 55),
      is_installment: withdrawalData.isInstallment || false,
      installment_count: withdrawalData.isInstallment ? parseInt(withdrawalData.installmentCount, 10) : null
    };

    const created = await createWithdrawal(selectedCertificate.id, withdrawal);
    const withdrawalId = created?.id;
    await logActivity('withdraw', 'certificateWithdrawal', withdrawalId, {
      certificateId: selectedCertificate.id,
      bankName: selectedCertificate.bankName,
      isInstallment: withdrawal.is_installment
    }, withdrawal.amount);

    setShowWithdrawalModal(false);
    setWithdrawalData({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isInstallment: false,
      installmentCount: 1
    });
    loadCertificates();
  };

  const markAsRepaid = async (withdrawalId) => {
    await repayWithdrawal(withdrawalId);
    await logActivity('repay', 'certificateWithdrawal', withdrawalId, {});
    loadCertificates();
  };

  const payInstallment = async (withdrawalId, withdrawal) => {
    await payWithdrawalInstallment(withdrawalId);
    const paid = (withdrawal.paidInstallments || 0) + 1;
    const installmentAmount = withdrawal.amount / (withdrawal.installmentCount || 1);
    await logActivity('pay', 'certificateWithdrawal', withdrawalId, {
      certificateId: withdrawal.certificateId,
      installment: `${paid}/${withdrawal.installmentCount}`
    }, installmentAmount);
    loadCertificates();
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      certificateName: '',
      certificateNumber: '',
      amount: '',
      maxWithdrawalLimit: '',
      monthlyReturn: '',
      returnDayOfMonth: '',
      depositDate: format(new Date(), 'yyyy-MM-dd'),
      maturityDate: ''
    });
  };

  const handleDelete = async (id) => {
    if (confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
      await deleteCertificate(id);
      await logActivity('delete', 'certificate', id, {});
      loadCertificates();
    }
  };

  return (
    <div className="certificates-page">
      <div className="page-header">
        <h2>{t('certificates') || 'الشهادات الادخارية'}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>{t('addCertificate') || 'إضافة شهادة'}</span>
        </button>
      </div>

      {/* Dangerous Withdrawals Alert */}
      {certificates.some(c => c.dangerousWithdrawals && c.dangerousWithdrawals.length > 0) && (
        <div className="danger-alert">
          <AlertTriangle size={20} />
          <div>
            <strong>{t('dangerousWithdrawals') || 'سحوبات خطرة تحتاج للسداد العاجل!'}</strong>
            <p>{t('dangerousWithdrawalsDesc') || 'لديك سحوبات قاربت على 55 يوم وتحتاج للسداد فوراً'}</p>
          </div>
        </div>
      )}

      <div className="certificates-list">
        {certificates.map((cert) => {
          const daysUntilRepayment = cert.withdrawals
            .filter(w => {
              if (w.isRepaid) return false;
              if (w.isInstallment && (w.paidInstallments || 0) >= (w.installmentCount || 1)) return false;
              return !w.isInstallment; // Only non-installment withdrawals
            })
            .map(w => {
              if (!w.repaymentDate) return null;
              const repaymentDate = new Date(w.repaymentDate);
              return differenceInDays(repaymentDate, new Date());
            })
            .filter(d => d !== null && d >= 0)
            .sort((a, b) => a - b)[0];

          return (
            <div key={cert.id} className="certificate-card card">
              <div className="certificate-header">
                <div className="certificate-bank">
                  <Banknote size={20} />
                  <div>
                    <div className="bank-name">{cert.bankName}</div>
                    {cert.certificateName && (
                      <div className="certificate-name">{cert.certificateName}</div>
                    )}
                  </div>
                </div>
                {daysUntilRepayment !== undefined && daysUntilRepayment < 10 && (
                  <div className={`badge ${daysUntilRepayment < 3 ? 'badge-danger' : 'badge-warning'}`}>
                    <AlertTriangle size={14} />
                    {daysUntilRepayment} {t('daysLeft') || 'أيام'}
                  </div>
                )}
              </div>

              <div className="certificate-details">
                {cert.certificateNumber && (
                  <div className="detail-row">
                    <span className="detail-label">{t('certificateNumber') || 'رقم الشهادة'}</span>
                    <span className="detail-value">{cert.certificateNumber}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">{t('certificateValue') || 'قيمة الشهادة'}</span>
                  <span className="detail-value large">{cert.amount?.toLocaleString()} {t('currency') || 'EGP'}</span>
                </div>
                {cert.maxWithdrawalLimit && cert.maxWithdrawalLimit < cert.amount && (
                  <div className="detail-row">
                    <span className="detail-label">{t('maxWithdrawalLimit') || 'الحد الأقصى للسحب'}</span>
                    <span className="detail-value warning">
                      {cert.maxWithdrawalLimit?.toLocaleString()} {t('currency') || 'EGP'}
                    </span>
                  </div>
                )}
                {cert.monthlyReturn && cert.monthlyReturn > 0 && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">{t('monthlyReturn') || 'العائد الشهري'}</span>
                      <span className="detail-value success">
                        <TrendingUp size={16} />
                        {cert.monthlyReturn?.toLocaleString()} {t('currency') || 'EGP'}
                      </span>
                    </div>
                    {cert.returnDayOfMonth && (
                      <div className="detail-row">
                        <span className="detail-label">{t('returnDayOfMonth') || 'يوم نزول العائد'}</span>
                        <span className="detail-value">
                          {t('day') || 'يوم'} {cert.returnDayOfMonth} {t('ofEachMonth') || 'من كل شهر'}
                        </span>
                      </div>
                    )}
                    {cert.lastReturnDate && (
                      <div className="detail-row">
                        <span className="detail-label">{t('lastReturnDate') || 'آخر عائد'}</span>
                        <span className="detail-value">
                          {format(new Date(cert.lastReturnDate), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="detail-row">
                  <span className="detail-label">{t('depositDate') || 'تاريخ الإيداع'}</span>
                  <span className="detail-value">{format(new Date(cert.depositDate), 'dd/MM/yyyy')}</span>
                </div>
                {cert.maturityDate && (
                  <div className="detail-row">
                    <span className="detail-label">{t('maturityDate') || 'تاريخ الاستحقاق'}</span>
                    <span className="detail-value">{format(new Date(cert.maturityDate), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>

              <div className="certificate-summary">
                <div className="summary-item">
                  <span>{t('remainingAmount') || 'المتبقي'}</span>
                  <span className="amount success">{cert.remainingAmount?.toLocaleString()} {t('currency') || 'EGP'}</span>
                </div>
                <div className="summary-item">
                  <span>{t('totalWithdrawn') || 'إجمالي المسحوب'}</span>
                  <span className="amount">{cert.totalWithdrawn?.toLocaleString()} {t('currency') || 'EGP'}</span>
                </div>
                <div className="summary-item">
                  <span>{t('totalRepaid') || 'إجمالي المدفوع'}</span>
                  <span className="amount success">{cert.totalRepaid?.toLocaleString()} {t('currency') || 'EGP'}</span>
                </div>
                <div className="summary-item">
                  <span>{t('pendingRepayment') || 'المتبقي للسداد'}</span>
                  <span className={`amount ${cert.pendingRepayment > 0 ? 'danger' : 'success'}`}>
                    {cert.pendingRepayment?.toLocaleString()} {t('currency') || 'EGP'}
                  </span>
                </div>
              </div>

              {cert.withdrawals && cert.withdrawals.length > 0 && (
                <div className="withdrawals-list">
                  <div className="withdrawals-header">
                    {t('withdrawals') || 'السحوبات'}
                    {cert.dangerousWithdrawals && cert.dangerousWithdrawals.length > 0 && (
                      <span className="danger-count">
                        <AlertTriangle size={14} />
                        {cert.dangerousWithdrawals.length} {t('dangerous') || 'خطرة'}
                      </span>
                    )}
                  </div>
                  {cert.withdrawals.map((withdrawal) => {
                    const isInstallment = withdrawal.isInstallment;
                    const isFullyPaid = withdrawal.isRepaid ||
                      (isInstallment && (withdrawal.paidInstallments || 0) >= (withdrawal.installmentCount || 1));
                    const repaymentDate = withdrawal.repaymentDate ? new Date(withdrawal.repaymentDate) : null;
                    const daysLeft = repaymentDate ? differenceInDays(repaymentDate, new Date()) : null;
                    const isDangerous = !isFullyPaid && daysLeft !== null && daysLeft <= 10 && daysLeft >= 0;

                    return (
                      <div
                        key={withdrawal.id}
                        className={`withdrawal-item ${isFullyPaid ? 'repaid' : ''} ${isDangerous ? 'dangerous' : ''} ${isInstallment ? 'installment' : ''}`}
                      >
                        <div className="withdrawal-info">
                          <span className="withdrawal-amount">{withdrawal.amount?.toLocaleString()} {t('currency') || 'EGP'}</span>
                          <span className="withdrawal-date">{format(new Date(withdrawal.date), 'dd/MM/yyyy')}</span>
                          {isInstallment && (
                            <span className="installment-badge">
                              {withdrawal.paidInstallments || 0}/{withdrawal.installmentCount || 1} {t('installments') || 'أقساط'}
                            </span>
                          )}
                        </div>
                        {!isFullyPaid && (
                          <div className="withdrawal-repayment">
                            {isInstallment ? (
                              <>
                                <span className="installment-info">
                                  {t('installmentPlan') || 'جدول أقساط'} ({withdrawal.paidInstallments || 0}/{withdrawal.installmentCount || 1})
                                </span>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => payInstallment(withdrawal.id, withdrawal)}
                                  disabled={withdrawal.paidInstallments >= withdrawal.installmentCount}
                                >
                                  <DollarSign size={14} />
                                  {t('payInstallment') || 'دفع قسط'}
                                </button>
                              </>
                            ) : (
                              <>
                                {repaymentDate && (
                                  <>
                                    <Calendar size={14} />
                                    <span>{format(repaymentDate, 'dd/MM/yyyy')}</span>
                                    {daysLeft !== null && daysLeft >= 0 && (
                                      <span className={`days-left ${isDangerous ? 'danger' : ''}`}>
                                        {daysLeft} {t('daysLeft') || 'أيام'}
                                      </span>
                                    )}
                                  </>
                                )}
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => markAsRepaid(withdrawal.id)}
                                >
                                  {t('markRepaid') || 'تسديد'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {isFullyPaid && (
                          <div className="badge badge-success">
                            {t('repaid') || 'مدفوع'}
                            {isInstallment && <span className="repaid-note"> - {t('amountReturned') || 'المبلغ عاد للمتاح'}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="certificate-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setSelectedCertificate(cert);
                    setShowWithdrawalModal(true);
                  }}
                  disabled={(cert.remainingAmount || 0) <= 0}
                >
                  <Banknote size={16} />
                  {t('addWithdrawal') || 'إضافة سحب'}
                </button>
                <button className="btn-icon" onClick={() => {
                  setEditing(cert);
                  setFormData({
                    ...cert,
                    depositDate: format(new Date(cert.depositDate), 'yyyy-MM-dd'),
                    maturityDate: cert.maturityDate ? format(new Date(cert.maturityDate), 'yyyy-MM-dd') : '',
                    monthlyReturn: cert.monthlyReturn || '',
                    returnDayOfMonth: cert.returnDayOfMonth ? cert.returnDayOfMonth.toString() : '',
                    maxWithdrawalLimit: cert.maxWithdrawalLimit ? cert.maxWithdrawalLimit.toString() : ''
                  });
                  setShowModal(true);
                }}>
                  <Edit size={18} />
                </button>
                <button className="btn-icon" onClick={() => handleDelete(cert.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditing(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? t('edit') : t('addCertificate')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('bankName') || 'اسم البنك'}</label>
                <input
                  className="form-input"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('certificateName') || 'اسم الشهادة'}</label>
                <input
                  className="form-input"
                  value={formData.certificateName}
                  onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
                  placeholder={t('certificateNamePlaceholder') || 'مثال: شهادة ادخار 3 سنوات'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('certificateNumber') || 'رقم الشهادة'}</label>
                <input
                  className="form-input"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('certificateValue') || 'قيمة الشهادة'}</label>
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
                <label className="form-label">{t('maxWithdrawalLimit') || 'الحد الأقصى للسحب'}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.maxWithdrawalLimit}
                  onChange={(e) => setFormData({ ...formData, maxWithdrawalLimit: e.target.value })}
                  placeholder={t('maxWithdrawalLimitPlaceholder') || 'اتركه فارغاً إذا كان يساوي قيمة الشهادة'}
                  max={formData.amount || undefined}
                />
                <small className="form-help">
                  {t('maxWithdrawalLimitHelp') || 'الحد الائتماني المسموح به من البنك للسحب (اختياري - إذا كان أقل من قيمة الشهادة)'}
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">{t('monthlyReturn') || 'العائد الشهري'}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.monthlyReturn}
                  onChange={(e) => setFormData({ ...formData, monthlyReturn: e.target.value })}
                  placeholder={t('monthlyReturnPlaceholder') || 'الربح الشهري من الشهادة'}
                />
              </div>
              {formData.monthlyReturn && parseFloat(formData.monthlyReturn) > 0 && (
                <div className="form-group">
                  <label className="form-label">{t('returnDayOfMonth') || 'يوم نزول العائد'}</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="form-input"
                    value={formData.returnDayOfMonth}
                    onChange={(e) => setFormData({ ...formData, returnDayOfMonth: e.target.value })}
                    placeholder={t('dayOfMonthPlaceholder') || 'مثال: 5'}
                    required={formData.monthlyReturn && parseFloat(formData.monthlyReturn) > 0}
                  />
                  <small className="form-help">{t('returnDayOfMonthHelp') || 'سيتم إضافة العائد تلقائياً في نفس اليوم من كل شهر'}</small>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{t('depositDate') || 'تاريخ الإيداع'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.depositDate}
                  onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('maturityDate') || 'تاريخ الاستحقاق'}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
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

      {showWithdrawalModal && selectedCertificate && (
        <div className="modal-overlay" onClick={() => {
          setShowWithdrawalModal(false);
          setSelectedCertificate(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addWithdrawal') || 'إضافة سحب'}</h3>
            <form onSubmit={handleWithdrawal}>
              <div className="form-group">
                <label className="form-label">{t('amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={withdrawalData.amount}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                  max={selectedCertificate.remainingAmount || 0}
                  min="0"
                  required
                />
                <small className="form-help">
                  {t('availableAmount') || 'المبلغ المتاح'}: <strong>{selectedCertificate.remainingAmount?.toLocaleString() || '0'} {t('currency') || 'EGP'}</strong>
                </small>
                {parseFloat(withdrawalData.amount || 0) > (selectedCertificate.remainingAmount || 0) && (
                  <small className="form-help error">
                    {t('insufficientCertificateFunds') || 'المبلغ المتاح غير كافي'}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('date')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={withdrawalData.date}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={withdrawalData.isInstallment}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, isInstallment: e.target.checked })}
                  />
                  {' '}{t('scheduleAsInstallments') || 'جدولة كأقساط'}
                </label>
                <small className="form-help">{t('installmentsExempt55Days') || 'الأقساط معفاة من شرط ال 55 يوم'}</small>
              </div>
              {withdrawalData.isInstallment && (
                <div className="form-group">
                  <label className="form-label">{t('installmentCount') || 'عدد الأقساط'}</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="form-input"
                    value={withdrawalData.installmentCount}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, installmentCount: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>
              )}
              {!withdrawalData.isInstallment && (
                <div className="alert-info">
                  <AlertTriangle size={16} />
                  <span>{t('repaymentNotice') || 'يجب سداد السحب قبل 55 يوم من تاريخه'}</span>
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{t('save')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowWithdrawalModal(false);
                  setSelectedCertificate(null);
                  setWithdrawalData({
                    amount: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    isInstallment: false,
                    installmentCount: 1
                  });
                }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
