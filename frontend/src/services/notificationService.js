let audioContext = null;
let notificationPermission = null;
import { createNotification } from './notificationsApi';

export const requestNotificationPermission = async () => {
    if ('Notification' in window) {
        notificationPermission = await Notification.requestPermission();
        return notificationPermission === 'granted';
    }
    return false;
};

export const playSound = (type = 'default') => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const frequencies = {
            default: 800,
            alert: 1000,
            success: 600,
            error: 400
        };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequencies[type] || frequencies.default;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.error('Error playing sound:', error);
    }
};

export const showNotification = async (title, options = {}) => {
    const settings = JSON.parse(localStorage.getItem('msarefy_settings') || '{}');

    if (settings.soundNotifications !== false) {
        playSound(options.type || 'default');
    }

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: options.body || '',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: options.tag || 'msarefy-notification',
            requireInteraction: false,
            ...options
        });
    }

    // Store notification via API only
    try {
        await createNotification({
            type: options.type || 'info',
            title,
            message: options.body || '',
            date: new Date().toISOString(),
            isRead: false,
            emailSent: false
        });
    } catch (e) {
        console.warn('Failed to persist notification via API:', e?.message || e);
    }

    // Send email notification if enabled
    if (settings.emailNotifications && options.sendEmail) {
        await sendEmailNotification(title, options.body || '');
    }
};

export const sendEmailNotification = async (subject, body) => {
    // This would typically call a backend API to send emails
    // For now, we'll store it for later processing
    const emailData = {
        to: JSON.parse(localStorage.getItem('msarefy_settings') || '{}').email || '',
        subject,
        body,
        timestamp: new Date()
    };

    localStorage.setItem('msarefy_email_queue', JSON.stringify([
        ...JSON.parse(localStorage.getItem('msarefy_email_queue') || '[]'),
        emailData
    ]));
};

// Initialize on load
if (typeof window !== 'undefined') {
    requestNotificationPermission();
}
