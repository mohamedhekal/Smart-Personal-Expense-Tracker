import { t } from './languageService';
import { fetchCategories as apiFetchCategories, createCategory as apiCreateCategory, deleteCategoryById as apiDeleteCategoryById } from './categoriesApi';

/**
 * Initialize default expense categories
 */
export const initDefaultCategories = async () => {
    // Server manages defaults
    return;
};

/**
 * Get all expense categories
 */
export const getCategories = async () => {
    try {
        const cats = await apiFetchCategories();
        return Array.isArray(cats) ? cats : [];
    } catch (error) {
        console.error('Error getting categories:', error);
        return [];
    }
};

/**
 * Add custom expense category
 */
export const addCategory = async (name, icon = '📦', color = '#64748b') => {
    try {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return { success: false, error: t('pleaseEnterCategoryName') || 'يرجى إدخال اسم التصنيف' };
        }
        const created = await apiCreateCategory({ name: trimmedName, icon, color });
        return { success: true, id: created?.id, category: created };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Delete custom expense category
 */
export const deleteCategory = async (id) => {
    try {
        await apiDeleteCategoryById(id);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Check and add recurring monthly expenses automatically
 */
export const checkAndAddRecurringExpenses = async () => {
    // Server handles recurring; no-op
    return;
};

/**
 * Initialize expense check service
 * Runs check on app load and sets up interval for daily checks
 */
export const initExpenseService = () => {
    // No-op
};
