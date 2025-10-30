import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Bell, Mail, Download, Upload, Moon, Sun, Trash2, AlertTriangle } from 'lucide-react';
import { t, setLanguage, getLanguage } from '../services/languageService';
import { fetchAllSettings, saveSettings as apiSaveSettings } from '../services/settingsApi';
import { exportToGoogleDrive, importFromGoogleDrive, deleteAllData } from '../services/backupService';
import './SettingsPage.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    language: getLanguage(),
    soundNotifications: true,
    emailNotifications: false,
    email: '',
    theme: 'light',
    currency: 'EGP'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const server = await fetchAllSettings();
      if (server && typeof server === 'object') {
        setSettings(prev => ({ ...prev, ...server }));
      }
    } catch { }
    const saved = localStorage.getItem('msarefy_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  };

  const saveSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('msarefy_settings', JSON.stringify(updated));
    try { await apiSaveSettings(updated); } catch { }
    if (newSettings.language) {
      setLanguage(newSettings.language);
      window.location.reload();
    }
  };

  const handleExport = async () => {
    const result = await exportToGoogleDrive();
    if (result.success) {
      alert(t('backupExported') || 'تم تصدير النسخة الاحتياطية بنجاح');
    } else {
      alert(t('backupError') || 'حدث خطأ أثناء التصدير: ' + result.error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const result = await importFromGoogleDrive(file);
        if (result.success) {
          alert(t('backupImported') || 'تم استيراد النسخة الاحتياطية بنجاح');
          window.location.reload();
        } else {
          alert(t('backupError') || 'حدث خطأ أثناء الاستيراد: ' + result.error);
        }
      }
    };
    input.click();
  };

  const handleDeleteAllData = async () => {
    const confirmMessage = t('confirmDeleteAllData') ||
      '⚠️ تحذير: سيتم حذف جميع البيانات!\n\n' +
      'سيتم إنشاء نسخة احتياطية تلقائياً قبل الحذف.\n' +
      'هل أنت متأكد تماماً؟\n\n' +
      'اكتب "حذف" للتأكيد:';

    const userInput = prompt(confirmMessage);

    if (userInput === 'حذف' || userInput === 'delete') {
      const finalConfirm = confirm(
        t('finalConfirmDelete') ||
        '⚠️ تأكيد نهائي!\n\n' +
        'سيتم حذف جميع بياناتك بشكل نهائي.\n' +
        'النسخة الاحتياطية تم إنشاءها بالفعل.\n\n' +
        'هل أنت متأكد 100%؟'
      );

      if (finalConfirm) {
        try {
          const result = await deleteAllData();
          if (result.success) {
            alert(
              t('allDataDeletedSuccess') ||
              '✅ تم حذف جميع البيانات بنجاح!\n\n' +
              'تم إنشاء نسخة احتياطية تلقائياً قبل الحذف.\n' +
              'سيتم إعادة تحميل الصفحة الآن.'
            );
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            alert(t('deleteError') || 'حدث خطأ أثناء الحذف: ' + (result.error || result.message));
          }
        } catch (error) {
          console.error('Error in handleDeleteAllData:', error);
          alert(t('deleteError') || 'حدث خطأ أثناء الحذف: ' + error.message);
        }
      }
    } else if (userInput !== null) {
      alert(t('deleteCancelled') || 'تم إلغاء العملية. لم يتم حذف أي بيانات.');
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>{t('settings')}</h2>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <div className="section-header">
            <SettingsIcon size={20} />
            <h3>{t('general') || 'عام'}</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <label className="setting-label">{t('language') || 'اللغة'}</label>
              <select
                className="setting-input"
                value={settings.language}
                onChange={(e) => saveSettings({ language: e.target.value })}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="setting-item">
              <label className="setting-label">{t('currency') || 'العملة'}</label>
              <select
                className="setting-input"
                value={settings.currency}
                onChange={(e) => saveSettings({ currency: e.target.value })}
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Bell size={20} />
            <h3>{t('notifications')}</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item toggle">
              <div className="setting-info">
                <label className="setting-label">{t('soundNotifications') || 'التنبيهات الصوتية'}</label>
                <span className="setting-description">{t('soundNotificationsDesc') || 'تفعيل الأصوات للتنبيهات'}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundNotifications}
                  onChange={(e) => saveSettings({ soundNotifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item toggle">
              <div className="setting-info">
                <label className="setting-label">{t('emailNotifications') || 'التنبيهات بالإيميل'}</label>
                <span className="setting-description">{t('emailNotificationsDesc') || 'إرسال تنبيهات عبر البريد الإلكتروني'}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => saveSettings({ emailNotifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {settings.emailNotifications && (
              <div className="setting-item">
                <label className="setting-label">{t('email') || 'البريد الإلكتروني'}</label>
                <input
                  type="email"
                  className="setting-input"
                  value={settings.email}
                  onChange={(e) => saveSettings({ email: e.target.value })}
                  placeholder={t('enterEmail') || 'أدخل البريد الإلكتروني'}
                />
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Download size={20} />
            <h3>{t('backup')}</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item action">
              <div className="setting-info">
                <label className="setting-label">{t('exportBackup') || 'تصدير النسخة الاحتياطية'}</label>
                <span className="setting-description">{t('exportBackupDesc') || 'حفظ جميع بياناتك كملف JSON'}</span>
              </div>
              <button className="btn btn-primary" onClick={handleExport}>
                <Download size={18} />
                {t('export') || 'تصدير'}
              </button>
            </div>
            <div className="setting-item action">
              <div className="setting-info">
                <label className="setting-label">{t('importBackup') || 'استيراد النسخة الاحتياطية'}</label>
                <span className="setting-description">{t('importBackupDesc') || 'استعادة البيانات من ملف النسخة الاحتياطية'}</span>
              </div>
              <button className="btn btn-secondary" onClick={handleImport}>
                <Upload size={18} />
                {t('import') || 'استيراد'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section danger-section">
          <div className="section-header">
            <AlertTriangle size={20} />
            <h3>{t('dangerZone') || 'المنطقة الخطيرة'}</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item action danger-action">
              <div className="setting-info">
                <label className="setting-label">{t('deleteAllData') || 'حذف جميع البيانات'}</label>
                <span className="setting-description danger-description">
                  {t('deleteAllDataDesc') || 'سيتم إنشاء نسخة احتياطية تلقائياً قبل الحذف، ثم حذف جميع البيانات بشكل نهائي'}
                </span>
              </div>
              <button className="btn btn-danger" onClick={handleDeleteAllData}>
                <Trash2 size={18} />
                {t('deleteAll') || 'حذف الكل'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Moon size={20} />
            <h3>{t('appearance') || 'المظهر'}</h3>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <label className="setting-label">{t('theme') || 'المظهر'}</label>
              <select
                className="setting-input"
                value={settings.theme}
                onChange={(e) => saveSettings({ theme: e.target.value })}
              >
                <option value="light">{t('light') || 'فاتح'}</option>
                <option value="dark">{t('dark') || 'داكن'}</option>
                <option value="auto">{t('auto') || 'تلقائي'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
