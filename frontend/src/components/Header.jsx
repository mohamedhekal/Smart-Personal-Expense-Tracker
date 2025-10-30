import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t, setLanguage, getLanguage } from '../services/languageService';
import { Globe } from 'lucide-react';
import './Header.css';

const Header = ({ onLanguageChange, currentLanguage }) => {
  const navigate = useNavigate();
  
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    onLanguageChange(newLang);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo" onClick={() => navigate('/')}>
          <h1>{t('appName')}</h1>
        </div>
        <button className="header-language-btn" onClick={toggleLanguage}>
          <Globe size={20} />
          <span>{currentLanguage === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
