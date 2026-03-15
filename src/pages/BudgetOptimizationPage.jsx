import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateOptimizationResults } from '../data/dataGenerator';
import { Info, Target, FileSpreadsheet, BarChart3, Calendar, TrendingUp, DollarSign } from 'lucide-react';

const SEASONALITY_INDEX = {
  Jan: 0.78, Feb: 0.82, Mar: 0.95, Apr: 0.98, May: 1.05, Jun: 1.10,
  Jul: 0.92, Aug: 0.88, Sep: 1.08, Oct: 1.31, Nov: 1.42, Dec: 1.47,
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLORS = ['#0176d3', '#2e844a', '#fe9339', '#ba0517', '#9050e9', '#04844b', '#3296ed', '#fcc003', '#7b8b8e'];

function formatCurrency(val) {
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
  return '$' + val.toFixed(0);
}

function Section({ id, icon: Icon, color, title, badge, children }) {
  return (
    <div id={id} className="sf-section">
      <div className="sf-section-header">
        <div className="sf-section-header-left">
          <div className="sf-section-icon" style={{ background: color }}>
            <Icon size={14} color="#FFFFFF" />
          </div>
          <h3 className="sf-section-title">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="sf-section-body">
        {children}
      </div>
    </div>
  );
}

export default function BudgetOptimizationPage() {
  const { state, dispatch } = useApp();
  const config = state.config;
  const [optResults, setOptResults] = useState(null);

  const updateBudget = (updates) => dispatch({ type: 'UPDATE_BUDGET_CONFIG', payload: updates });

  const data = state.dashboardData;

  // Budget seasonality computation
  const budgetDistribution = useMemo(() => {
    if (!config.budgetOptimization.useSeasonalityIndex) return null;
    const { budgetPeriod, totalBudget, beginDate } = config.budgetOptimization;
    const startMonth = new Date(beginDate).getMonth();
    const monthCount = budgetPeriod === 'quarterly' ? 3 : 12;
    const months = [];
    for (let i = 0; i < monthCount; i++) {
      const idx = (startMonth + i) % 12;
      months.push({ name: MONTH_NAMES[idx], index: SEASONALITY_INDEX[MONTH_NAMES[idx]] });
    }
    const sumIndices = months.reduce((s, m) => s + m.index, 0);
    return months.map(m => ({
      ...m,
      budget: (totalBudget / sumIndices) * m.index,
      pct: (m.index / sumIndices) * 100,
    }));
  }, [config.budgetOptimization]);

  const runOptimization = () => {
    if (!data) return;
    const budget = config.budgetOptimization.totalBudget;
    const scenario = config.budgetOptimization.scenario;
    const results = generateOptimizationResults(data, budget, scenario);
    setOptResults(results);
    dispatch({ type: 'SET_OPTIMIZATION_RESULTS', payload: results });
  };

  const exportToSheets = () => {
    if (!activeOptResults) return;

    // Build channel-level rows
    const headers = ['Channel', 'Current Spend', 'Optimized Spend', 'Change %', 'Current Revenue', 'Optimized Revenue', 'ROI', 'mROI'];
    const rows = activeOptResults.channels.map((c) => [
      c.channel, c.currentSpend, c.optimizedSpend, c.change + '%',
      c.currentContribution, c.optimizedContribution, c.roi.toFixed(2), c.mROI.toFixed(2),
    ]);
    const summary = [
      [], ['SUMMARY'],
      ['Total Budget', formatCurrency(activeOptResults.budget)],
      ['Current ROI', activeOptResults.currentROI],
      ['Optimized ROI', activeOptResults.optimizedROI],
      ['Revenue Uplift', activeOptResults.uplift + '%'],
    ];

    // Add seasonality timeline distribution if enabled
    let seasonalitySection = [];
    if (config.budgetOptimization.useSeasonalityIndex && budgetDistribution) {
      seasonalitySection = [
        [], ['SEASONALITY INDEX BUDGET DISTRIBUTION'],
        ['Month', 'Seasonality Index', 'Allocation %', 'Monthly Budget'],
        ...budgetDistribution.map(m => [
          m.name, m.index.toFixed(2), m.pct.toFixed(1) + '%', '$' + Math.round(m.budget).toLocaleString(),
        ]),
        [],
        ['CHANNEL BUDGET BY MONTH (Optimized Spend x Seasonality)'],
        ['Channel', ...budgetDistribution.map(m => m.name)],
        ...activeOptResults.channels.map((c) => [
          c.channel,
          ...budgetDistribution.map(m => {
            const channelMonthly = (c.optimizedSpend / budgetDistribution.reduce((s, x) => s + x.index, 0)) * m.index;
            return '$' + Math.round(channelMonthly).toLocaleString();
          }),
        ]),
      ];
    }

    const csv = [headers, ...rows, ...summary, ...seasonalitySection].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meridian_budget_plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Use optimization results from state if available and local is empty
  const activeOptResults = optResults || state.optimizationResults;

  return (
    <div className="animate-slide-in">
      <div className="sf-page-header">
        <div className="sf-page-header-left">
          <div className="sf-page-icon" style={{ background: '#032D60' }}>
            <DollarSign size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="sf-page-title">Budget Optimization</h1>
          </div>
        </div>
        <div className="sf-page-actions">
          {data && (
            <button className="slds-button slds-button_outline-brand" onClick={runOptimization}>
              <Target size={14} /> Run Optimization
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 1. BUDGET SETTINGS                          */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="budget-settings" icon={BarChart3} color="#032D60" title="Budget Settings"
        badge={
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#0176d3',
            background: '#e5f5fe', padding: '4px 14px', borderRadius: 12,
          }}>
            ${config.budgetOptimization.totalBudget.toLocaleString()}
          </span>
        }
      >
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Optimization Scenario</label>
            <select className="slds-select" value={config.budgetOptimization.scenario} onChange={(e) => updateBudget({ scenario: e.target.value })}>
              <option value="fixed">Fixed Budget — Maximize ROI</option>
              <option value="flexible_roi">Flexible Budget — Target ROI</option>
              <option value="flexible_mroi">Flexible Budget — Target Marginal ROI</option>
            </select>
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Total Budget ($)</label>
            <input className="slds-input" type="number" value={config.budgetOptimization.totalBudget} onChange={(e) => updateBudget({ totalBudget: parseInt(e.target.value) || 0 })} />
          </div>
          {config.budgetOptimization.scenario !== 'fixed' && (
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label">Target ROI</label>
              <input className="slds-input" type="number" step={0.1} value={config.budgetOptimization.targetROI} onChange={(e) => updateBudget({ targetROI: parseFloat(e.target.value) || 1.0 })} />
            </div>
          )}
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Budget Period</label>
            <select className="slds-select" value={config.budgetOptimization.budgetPeriod} onChange={(e) => updateBudget({ budgetPeriod: e.target.value })}>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Begin Date</label>
            <input className="slds-input" type="date" value={config.budgetOptimization.beginDate} onChange={(e) => updateBudget({ beginDate: e.target.value })} />
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Spend Constraint — Lower Bound</label>
            <input className="slds-input" type="number" step={0.1} min={0} max={1} value={config.budgetOptimization.spendConstraintLower} onChange={(e) => updateBudget({ spendConstraintLower: parseFloat(e.target.value) || 0.5 })} />
            <div style={{ fontSize: 11, color: '#706e6b', marginTop: 2 }}>{(config.budgetOptimization.spendConstraintLower * 100).toFixed(0)}% of current spend</div>
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Spend Constraint — Upper Bound</label>
            <input className="slds-input" type="number" step={0.1} min={1} max={5} value={config.budgetOptimization.spendConstraintUpper} onChange={(e) => updateBudget({ spendConstraintUpper: parseFloat(e.target.value) || 2.0 })} />
            <div style={{ fontSize: 11, color: '#706e6b', marginTop: 2 }}>{(config.budgetOptimization.spendConstraintUpper * 100).toFixed(0)}% of current spend</div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. SEASONALITY INDEX                        */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="seasonality" icon={Calendar} color="#1B5F6A" title="Seasonality Index"
        badge={
          <label className="slds-checkbox-toggle" style={{ marginBottom: 0 }}>
            <input type="checkbox" checked={config.budgetOptimization.useSeasonalityIndex} onChange={(e) => updateBudget({ useSeasonalityIndex: e.target.checked })} />
            <div className="slds-checkbox-toggle__track" />
            <span className="slds-checkbox-toggle__label">Use Seasonality Index</span>
          </label>
        }
      >
        <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 16 }}>
          The Seasonality Index captures marketing efficiency variations across months.
          An index above 1.0 indicates higher efficiency (allocate more), below 1.0 indicates lower efficiency (allocate less).
        </p>
        <table className="slds-table">
          <thead>
            <tr>
              {MONTH_NAMES.map(m => <th key={m} style={{ textAlign: 'center', padding: '8px 4px' }}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {MONTH_NAMES.map(m => (
                <td key={m} style={{
                  textAlign: 'center', fontWeight: 700, padding: '8px 4px',
                  color: SEASONALITY_INDEX[m] >= 1.0 ? '#2e844a' : '#706e6b',
                }}>
                  {SEASONALITY_INDEX[m].toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              {MONTH_NAMES.map(m => (
                <td key={m} style={{ padding: '4px' }}>
                  <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{
                      width: 20, borderRadius: '3px 3px 0 0',
                      height: (SEASONALITY_INDEX[m] / 1.5 * 40) + 'px',
                      background: SEASONALITY_INDEX[m] >= 1.0 ? '#2e844a' : '#0176d3',
                    }} />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Seasonality Index Budget Distribution details when enabled */}
        {config.budgetOptimization.useSeasonalityIndex && budgetDistribution && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#706e6b', textAlign: 'right' }}>
            Total: <strong>${config.budgetOptimization.totalBudget.toLocaleString()}</strong> &middot;
            Sum of Indices: <strong>{budgetDistribution.reduce((s, m) => s + m.index, 0).toFixed(2)}</strong>
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. CHANNEL BUDGET BY MONTH                  */}
      {/* ═══════════════════════════════════════════ */}
      {config.budgetOptimization.useSeasonalityIndex && budgetDistribution && activeOptResults && (
        <Section id="monthly-budget" icon={TrendingUp} color="#2E844A" title="Channel Budget by Month (Seasonality-Adjusted)"
          badge={
            <button className="slds-button slds-button_success" onClick={exportToSheets} style={{ fontSize: 13 }}>
              <FileSpreadsheet size={14} /> Export to Google Sheets (CSV)
            </button>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="slds-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  {budgetDistribution.map(m => <th key={m.name} style={{ textAlign: 'right' }}>{m.name}</th>)}
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {activeOptResults.channels.map((c, i) => {
                  const sumIndices = budgetDistribution.reduce((s, x) => s + x.index, 0);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 6 }} />
                        {c.channel}
                      </td>
                      {budgetDistribution.map(m => {
                        const monthly = (c.optimizedSpend / sumIndices) * m.index;
                        return <td key={m.name} style={{ textAlign: 'right' }}>{formatCurrency(monthly)}</td>;
                      })}
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(c.optimizedSpend)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: '#f3f3f3' }}>
                  <td>Total</td>
                  {budgetDistribution.map(m => (
                    <td key={m.name} style={{ textAlign: 'right' }}>{formatCurrency(m.budget)}</td>
                  ))}
                  <td style={{ textAlign: 'right' }}>{formatCurrency(activeOptResults.budget)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>
      )}

      {/* Prompt to run optimization or enable seasonality */}
      {!activeOptResults && data && (
        <div className="slds-card" style={{ textAlign: 'center', padding: 40 }}>
          <Target size={48} color="#0176d3" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ready to Optimize</h3>
          <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 20 }}>
            Click <strong>Run Optimization</strong> above to generate the budget allocation plan.
            {!config.budgetOptimization.useSeasonalityIndex && ' Enable the Seasonality Index toggle to see monthly distribution.'}
          </p>
          <button className="slds-button slds-button_brand" onClick={runOptimization}>
            <Target size={16} /> Run Budget Optimization
          </button>
        </div>
      )}

      {!data && (
        <div className="slds-card" style={{ textAlign: 'center', padding: 40, color: '#706e6b' }}>
          <Target size={48} color="#c9c9c9" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 14 }}>Complete model training on the <strong>Model Data Feed</strong> page to enable optimization.</p>
        </div>
      )}
    </div>
  );
}
