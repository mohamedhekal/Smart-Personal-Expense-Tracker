import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, DollarSign, Briefcase, Target, TrendingUp, Settings, FileText, BarChart, Wallet, MessageSquare, Gem, History } from 'lucide-react';
import { t } from '../services/languageService';
import './BottomNav.css';

const BottomNav = ({ currentPath }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/expenses', icon: DollarSign, label: t('expenses') },
        { path: '/salaries', icon: Briefcase, label: t('salaries') },
        { path: '/whatsapp', icon: MessageSquare, label: t('whatsapp') || 'الواتساب' },
        { path: '/certificates', icon: Wallet, label: t('certificates') || 'الشهادات' },
        { path: '/gold', icon: Gem, label: t('gold') || 'الذهب' },
        { path: '/goals', icon: Target, label: t('goals') },
        { path: '/freelance', icon: TrendingUp, label: t('freelance') },
        { path: '/reports', icon: BarChart, label: t('reports') },
        { path: '/activity-log', icon: History, label: t('activityLog') || 'سجل العمليات' },
        { path: '/settings', icon: Settings, label: t('settings') }
    ];

    const isDashboardActive = location.pathname === '/';

    return (
        <nav className="bottom-nav">
            <button
                className={`nav-item fixed-item ${isDashboardActive ? 'active' : ''}`}
                onClick={() => navigate('/')}
            >
                <Home size={22} />
                <span className="nav-label">{t('dashboard')}</span>
            </button>
            <div className="nav-scroll-container">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <Icon size={22} />
                            <span className="nav-label">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
