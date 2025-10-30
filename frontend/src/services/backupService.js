import { t } from './languageService';
import { api } from './apiService';

export const exportToGoogleDrive = async () => {
  try {
    // Delegate to backend export
    await api.post('/backups/export');
    return { success: true, message: 'Backup exported successfully' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};

export const importFromGoogleDrive = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    // Note: apiService uses JSON headers; we need a special call for multipart
    const res = await fetch(`${localStorage.getItem('api_base_url') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/backups/import`, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete all data after creating automatic backup
 */
export const deleteAllData = async () => {
  try {
    // Step 1: Create automatic backup first
    const backupResult = await exportToGoogleDrive();

    if (!backupResult.success) {
      return {
        success: false,
        error: backupResult.error || 'Failed to create backup',
        message: t('backupFailedBeforeDelete') || 'فشل إنشاء النسخة الاحتياطية قبل الحذف'
      };
    }

    // Step 2: Request backend to clear data for current user
    await api.post('/backups/clear-all');

    // Step 3: Clear localStorage settings
    localStorage.removeItem('msarefy_settings');
    localStorage.removeItem('msarefy_language');

    return {
      success: true,
      message: t('allDataDeleted') || 'تم حذف جميع البيانات بنجاح. تم إنشاء نسخة احتياطية تلقائياً.'
    };
  } catch (error) {
    console.error('Error deleting all data:', error);
    return {
      success: false,
      error: error.message,
      message: t('deleteError') || 'حدث خطأ أثناء حذف البيانات'
    };
  }
};
