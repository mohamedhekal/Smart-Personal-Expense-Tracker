import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../services/languageService';
import { login, register } from '../services/authService';

const LoginPage = () => {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                if (password !== confirmPassword) {
                    throw new Error(t('passwordConfirmMismatch') || 'تأكيد كلمة المرور غير مطابق');
                }
                await register(name.trim(), email.trim(), password, confirmPassword);
            } else {
                await login(email.trim(), password);
            }
            navigate('/');
        } catch (err) {
            setError(err?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page auth-page">
            <div className="card" style={{ maxWidth: 420, margin: '2rem auto', padding: '1.25rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>{isRegister ? (t('register') || 'إنشاء حساب') : (t('login') || 'تسجيل الدخول')}</h2>
                {error && <div className="alert" style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">{t('name') || 'الاسم'}</label>
                            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('password') || 'كلمة المرور'}</label>
                        <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">{t('confirmPassword') || 'تأكيد كلمة المرور'}</label>
                            <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                    )}
                    <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (t('loading') || 'جارٍ...') : (isRegister ? (t('register') || 'إنشاء حساب') : (t('login') || 'تسجيل الدخول'))}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? (t('haveAccount') || 'لديك حساب؟ دخول') : (t('noAccount') || 'ليس لديك حساب؟ سجل')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;


