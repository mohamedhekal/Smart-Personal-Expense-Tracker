import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { t } from '../services/languageService';
import { startOfMonth, endOfMonth } from 'date-fns';
import './OptimizationPage.css';
import { fetchRecommendations } from '../services/optimizationApi';
import { fetchExpenses } from '../services/expensesApi';

const OptimizationPage = () => {
  const [tips, setTips] = useState([]);
  const [analysis, setAnalysis] = useState({
    highSpendingCategories: [],
    savingsOpportunities: [],
    recommendations: []
  });

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    // Get expenses from API
    const allExpenses = await fetchExpenses();
    const expenses = allExpenses.filter(e => {
      // Skip recurring expense templates (these are just templates, not actual expenses)
      if (e.isMonthly === 1 && e.autoAdd === true && !e.date) return false;

      // Must have a date to be counted
      if (!e.date) return false;

      const expenseDate = new Date(e.date);
      expenseDate.setHours(0, 0, 0, 0);

      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);

      return expenseDate >= normalizedStartDate && expenseDate <= normalizedEndDate;
    });

    // Calculate spending by category
    const spendingByCategory = {};
    expenses.forEach(exp => {
      const cat = exp.category || t('other');
      spendingByCategory[cat] = (spendingByCategory[cat] || 0) + (exp.amount || 0);
    });

    // Identify high spending categories
    const totalSpending = Object.values(spendingByCategory).reduce((sum, a) => sum + a, 0);
    const highSpending = Object.entries(spendingByCategory)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: (amount / totalSpending) * 100
      }))
      .filter(item => item.percentage > 20)
      .sort((a, b) => b.amount - a.amount);

    // Generate savings opportunities
    const opportunities = highSpending.map(item => ({
      category: item.category,
      currentSpending: item.amount,
      potentialSaving: item.amount * 0.15, // 15% saving opportunity
      tips: getCategoryTips(item.category)
    }));

    // Generate recommendations (client-side) + merge with server recommendations
    const clientRecs = generateRecommendations(expenses, spendingByCategory);
    let serverRecs = [];
    try {
      serverRecs = await fetchRecommendations();
    } catch { }
    const recommendations = [...clientRecs, ...(Array.isArray(serverRecs) ? serverRecs : [])];

    setAnalysis({
      highSpendingCategories: highSpending,
      savingsOpportunities: opportunities,
      recommendations
    });
  };

  const getCategoryTips = (category) => {
    const tipsMap = {
      [t('food')]: [
        t('foodTip1') || 'طبخ وجبات كافية للأسبوع',
        t('foodTip2') || 'استخدم قائمة تسوق و التزم بها',
        t('foodTip3') || 'تجنب الأكل خارج البيت بكثرة'
      ],
      [t('transport')]: [
        t('transportTip1') || 'استخدم المواصلات العامة',
        t('transportTip2') || 'شارك في الرحلات مع الآخرين',
        t('transportTip3') || 'استخدم الدراجة للمسافات القصيرة'
      ],
      [t('bills')]: [
        t('billsTip1') || 'أطفئ الأجهزة غير المستخدمة',
        t('billsTip2') || 'استخدم لمبات LED موفرة للطاقة',
        t('billsTip3') || 'راقب استهلاك الماء والكهرباء'
      ],
      [t('shopping')]: [
        t('shoppingTip1') || 'قارن الأسعار قبل الشراء',
        t('shoppingTip2') || 'استخدم كوبونات الخصم',
        t('shoppingTip3') || 'تجنب التسوق العاطفي'
      ]
    };

    return tipsMap[category] || [
      t('generalTip1') || 'راقب مصاريفك بانتظام',
      t('generalTip2') || 'ضع ميزانية شهرية',
      t('generalTip3') || 'وفر 20% من دخلك كل شهر'
    ];
  };

  const generateRecommendations = (expenses, spendingByCategory) => {
    const recs = [];

    // Check for recurring expenses
    const recurringCount = expenses.filter(e => e.isRecurring).length;
    if (recurringCount > 5) {
      recs.push({
        type: 'warning',
        title: t('tooManyRecurring') || 'مصاريف متكررة كثيرة',
        message: t('recurringRecommendation') || 'راجع المصاريف المتكررة وألغِ ما لا تحتاجه'
      });
    }

    // Check for high category spending
    const highCategory = Object.entries(spendingByCategory)
      .sort((a, b) => b[1] - a[1])[0];

    if (highCategory && highCategory[1] > 5000) {
      recs.push({
        type: 'info',
        title: t('highSpending') || 'إنفاق عالي',
        message: `${t('highSpendingMessage') || 'إنفاقك على'} ${highCategory[0]} ${t('isHigh') || 'عالي. يمكنك الترشيد فيه'}`
      });
    }

    // Savings goal recommendation
    recs.push({
      type: 'success',
      title: t('savingsGoal') || 'هدف التوفير',
      message: t('savingsGoalMessage') || 'حاول توفير 20% من دخلك الشهري'
    });

    return recs;
  };

  return (
    <div className="optimization-page">
      <div className="page-header">
        <h2>{t('optimization')}</h2>
      </div>

      <div className="recommendations-section">
        <h3 className="section-title">
          <Lightbulb size={20} />
          {t('recommendations') || 'التوصيات'}
        </h3>
        <div className="recommendations-list">
          {analysis.recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card card ${rec.type}`}>
              <div className="recommendation-icon">
                {rec.type === 'warning' && <AlertCircle size={20} />}
                {rec.type === 'info' && <Target size={20} />}
                {rec.type === 'success' && <TrendingDown size={20} />}
              </div>
              <div className="recommendation-content">
                <div className="recommendation-title">{rec.title}</div>
                <div className="recommendation-message">{rec.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="savings-section">
        <h3 className="section-title">
          <TrendingDown size={20} />
          {t('savingsOpportunities') || 'فرص التوفير'}
        </h3>
        <div className="opportunities-list">
          {analysis.savingsOpportunities.map((opp, index) => (
            <div key={index} className="opportunity-card card">
              <div className="opportunity-header">
                <div className="opportunity-category">{opp.category}</div>
                <div className="opportunity-amount">
                  {opp.potentialSaving.toLocaleString()} {t('currency') || 'EGP'}
                </div>
              </div>
              <div className="opportunity-details">
                <div className="detail-item">
                  <span>{t('currentSpending') || 'الإنفاق الحالي'}</span>
                  <span>{opp.currentSpending.toLocaleString()} {t('currency') || 'EGP'}</span>
                </div>
                <div className="detail-item">
                  <span>{t('potentialSaving') || 'التوفير المحتمل'}</span>
                  <span className="saving-amount">{opp.potentialSaving.toLocaleString()} {t('currency') || 'EGP'}</span>
                </div>
              </div>
              <div className="opportunity-tips">
                <div className="tips-title">{t('tips') || 'نصائح'}</div>
                <ul className="tips-list">
                  {opp.tips.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {analysis.savingsOpportunities.length === 0 && (
        <div className="empty-state">
          <Target size={48} className="empty-state-icon" />
          <p>{t('noData') || 'لا توجد بيانات كافية للتحليل'}</p>
        </div>
      )}
    </div>
  );
};

export default OptimizationPage;
