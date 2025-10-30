import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { setLanguage, getLanguage } from './services/languageService';
import { requestNotificationPermission } from './services/notificationService';
import { initSalaryService } from './services/salaryService';
import { initExpenseService } from './services/expenseService';
import { initCertificateService } from './services/certificateService';
import Dashboard from './components/Dashboard';
import ExpensesPage from './components/ExpensesPage';
import SalariesPage from './components/SalariesPage';
import FreelancePage from './components/FreelancePage';
import WhatsAppPage from './components/WhatsAppPage';
import GoalsPage from './components/GoalsPage';
import GoldPage from './components/GoldPage';
import CertificatesPage from './components/CertificatesPage';
import ReportsPage from './components/ReportsPage';
import ActivityLogPage from './components/ActivityLogPage';
import LoginPage from './components/LoginPage';
import OptimizationPage from './components/OptimizationPage';
import SettingsPage from './components/SettingsPage';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import './App.css';

// IndexedDB removed; app uses remote API only

const USE_REMOTE_API = true; // flip to false to re-enable offline mode

function AppContent() {
    const location = useLocation();
    const [language, setLang] = useState(getLanguage());

    useEffect(() => {
        setLanguage(language);
        requestNotificationPermission();
        if (!USE_REMOTE_API) {
            initSalaryService();
            initExpenseService();
            initCertificateService();
        }
    }, [language]);

    const isAuthed = !!localStorage.getItem('access_token');
    const Protected = ({ children }) => (isAuthed ? children : <Navigate to="/login" replace />);

    return (
        <div className="app">
            <Header onLanguageChange={setLang} currentLanguage={language} />
            <main className="main-content">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<Protected><Dashboard /></Protected>} />
                    <Route path="/expenses" element={<Protected><ExpensesPage /></Protected>} />
                    <Route path="/salaries" element={<Protected><SalariesPage /></Protected>} />
                    <Route path="/freelance" element={<Protected><FreelancePage /></Protected>} />
                    <Route path="/whatsapp" element={<Protected><WhatsAppPage /></Protected>} />
                    <Route path="/goals" element={<Protected><GoalsPage /></Protected>} />
                    <Route path="/certificates" element={<Protected><CertificatesPage /></Protected>} />
                    <Route path="/gold" element={<Protected><GoldPage /></Protected>} />
                    <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
                    <Route path="/activity-log" element={<Protected><ActivityLogPage /></Protected>} />
                    <Route path="/optimization" element={<Protected><OptimizationPage /></Protected>} />
                    <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
                </Routes>
            </main>
            <BottomNav currentPath={location.pathname} />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
