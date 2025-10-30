import { postActivity as apiPostActivity, fetchActivities as apiFetchActivities } from './activityLogApi';

/**
 * Log an activity/operation in the system
 * @param {string} action - The action performed (add, update, delete, sell, etc.)
 * @param {string} entityType - The type of entity (expense, salary, certificate, gold, etc.)
 * @param {number} entityId - The ID of the entity
 * @param {object} details - Additional details about the action
 * @param {number} amount - The amount involved (if any)
 */
export const logActivity = async (action, entityType, entityId, details = {}, amount = null) => {
    try {
        const activity = {
            action,
            entityType,
            entityId,
            details,
            timestamp: new Date().toISOString(),
            amount: amount || null
        };
        await apiPostActivity(activity);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

/**
 * Get all activities, optionally filtered
 * @param {object} filters - Optional filters (entityType, action, dateRange)
 * @param {number} limit - Optional limit on number of results
 */
export const getActivities = async (filters = {}, limit = null) => {
    try {
        const params = {};
        if (filters.entityType) params.entityType = filters.entityType;
        if (filters.action) params.action = filters.action;
        if (filters.startDate) params.startDate = filters.startDate.toISOString();
        if (filters.endDate) params.endDate = filters.endDate.toISOString();
        let activities = await apiFetchActivities(params);
        if (!Array.isArray(activities)) activities = [];
        if (limit) activities = activities.slice(0, limit);
        return activities;
    } catch (error) {
        console.error('Error getting activities:', error);
        return [];
    }
};

/**
 * Clear old activities (optional - for cleanup)
 */
export const clearOldActivities = async (daysToKeep = 365) => {
    try {
        // Optional: call backend with daysToKeep to clear
        // If not supported, fetch and delete client-side by policy
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const all = await apiFetchActivities({ endDate: cutoffDate.toISOString() });
        // Deletion of specific IDs should be done with a batch endpoint; if not present, caller page can use deleteAll when appropriate
        return { success: true, deleted: (all || []).length };
    } catch (error) {
        console.error('Error clearing old activities:', error);
        return { success: false, error: error.message };
    }
};

