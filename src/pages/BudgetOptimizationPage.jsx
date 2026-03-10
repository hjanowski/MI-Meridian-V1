import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateOptimizationResults } from '../data/dataGenerator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell,
} from 'recharts';
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

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#f3f3f3', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#181818' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#706e6b', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ icon: Icon, color, title, badge, children }) {
  return (
    <div className="slds-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: color + '14',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#181818' }}>{title}</h3>
        </div>
        {badge}
      </div>
      {children}
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
    if (!optResults) return;

    // Build channel-level rows
    const headers = ['Channel', 'Current Spend', 'Optimized Spend', 'Change %', 'Current Revenue', 'Optimized Revenue', 'ROI', 'mROI'];
    const rows = optResults.channels.map((c) => [
      c.channel, c.currentSpend, c.optimizedSpend, c.change + '%',
      c.currentContribution, c.optimizedContribution, c.roi.toFixed(2), c.mROI.toFixed(2),
    ]);
    const summary = [
      [], ['SUMMARY'],
      ['Total Budget', formatCurrency(optResults.budget)],
      ['Current ROI', optResults.currentROI],
      ['Optimized ROI', optResults.optimizedROI],
      ['Revenue Uplift', optResults.uplift + '%'],
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
        ...optResults.channels.map((c) => [
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181818' }}>Budget Optimization</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 2 }}>
            Configure budget scenarios, seasonality distribution, and run optimization
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 1. SEASONALITY INDEX                        */}
      {/* ═══════════════════════════════════════════ */}
      <Section icon={Calendar} color="#9050e9" title="Seasonality Index"
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
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. BUDGET SETTINGS                          */}
      {/* ═══════════════════════════════════════════ */}
      <Section icon={BarChart3} color="#fe9339" title="Budget Settings"
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
          background: '#f8f8f8', borderRadius: 6, padding: 20,
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
      {/* 3. SEASONALITY INDEX BUDGET DISTRIBUTION    */}
      {/* ═══════════════════════════════════════════ */}
      {config.budgetOptimization.useSeasonalityIndex && budgetDistribution && (
        <Section icon={TrendingUp} color="#2e844a" title="Seasonality Index Budget Distribution"
          badge={
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#2e844a',
              background: '#e6f9e6', padding: '4px 12px', borderRadius: 12,
            }}>
              {budgetDistribution.length} Months
            </span>
          }
        >
          <div className="slds-notify slds-notify_info" style={{ marginBottom: 12 }}>
            <Info size={16} />
            <div style={{ fontSize: 12 }}>
              Formula: Monthly Budget = (Total Budget) / (Sum of Indices) x (Month&apos;s Index).
              Index above 1.0 means marketing spend is more efficient in that period.
            </div>
          </div>
          <table className="slds-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Seasonality Index</th>
                <th>Allocation %</th>
                <th>Monthly Budget</th>
                <th style={{ width: 200 }}>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {budgetDistribution.map((m, i) => {
                const maxIdx = Math.max(...budgetDistribution.map(x => x.index));
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: m.index >= 1.0 ? '#2e844a' : '#706e6b',
                      }}>
                        {m.index.toFixed(2)}
                      </span>
                    </td>
                    <td>{m.pct.toFixed(1)}%</td>
                    <td style={{ fontWeight: 600 }}>${Math.round(m.budget).toLocaleString()}</td>
                    <td>
                      <div style={{ height: 12, background: '#e5e5e5', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: (m.index / maxIdx * 100) + '%',
                          background: m.index >= 1.0 ? '#2e844a' : '#0176d3',
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 12, color: '#706e6b', textAlign: 'right' }}>
            Total: <strong>${config.budgetOptimization.totalBudget.toLocaleString()}</strong> &middot;
            Sum of Indices: <strong>{budgetDistribution.reduce((s, m) => s + m.index, 0).toFixed(2)}</strong>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* 4. OPTIMIZATION RESULTS                     */}
      {/* ═══════════════════════════════════════════ */}
      <Section icon={Target} color="#0176d3" title="Budget Optimization Results"
        badge={
          data ? (
            <button className="slds-button slds-button_brand" onClick={runOptimization} style={{ fontSize: 13 }}>
              <Target size={14} /> Run Optimization
            </button>
          ) : (
            <span style={{ fontSize: 12, color: '#706e6b' }}>Run model training first</span>
          )
        }
      >
        {!data ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#706e6b' }}>
            <Target size={48} color="#c9c9c9" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14 }}>Complete model training on the <strong>Model Data Feed</strong> page to enable optimization.</p>
          </div>
        ) : !activeOptResults ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Target size={48} color="#0176d3" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ready to Optimize</h3>
            <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 8 }}>
              Scenario: <strong>{config.budgetOptimization.scenario === 'fixed' ? 'Fixed Budget' : config.budgetOptimization.scenario === 'flexible_roi' ? 'Flexible Budget (Target ROI)' : 'Flexible Budget (Target mROI)'}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 4 }}>
              Budget: <strong>{formatCurrency(config.budgetOptimization.totalBudget)}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 20 }}>
              Constraints: {(config.budgetOptimization.spendConstraintLower * 100).toFixed(0)}% - {(config.budgetOptimization.spendConstraintUpper * 100).toFixed(0)}% of current spend per channel
            </p>
            <button className="slds-button slds-button_brand" onClick={runOptimization}>
              <Target size={16} /> Run Budget Optimization
            </button>
          </div>
        ) : (
          <div>
            {/* Summary metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              <MetricCard label="Total Budget" value={formatCurrency(activeOptResults.budget)} />
              <MetricCard label="Current ROI" value={activeOptResults.currentROI + 'x'} />
              <MetricCard label="Optimized ROI" value={activeOptResults.optimizedROI + 'x'} color="#2e844a" />
              <MetricCard label="Revenue Uplift" value={'+' + activeOptResults.uplift + '%'} sub={formatCurrency(activeOptResults.totalOptimizedContribution - activeOptResults.totalCurrentContribution) + ' additional'} color="#2e844a" />
            </div>

            {/* Current vs Optimized bar chart */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>Current vs. Optimized Budget Allocation</h4>
                <button className="slds-button slds-button_success" onClick={exportToSheets}>
                  <FileSpreadsheet size={14} /> Export to Google Sheets (CSV)
                </button>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={activeOptResults.channels.map((c) => ({
                  channel: c.channel.replace(/\s*\(.*\)/, '').substring(0, 14),
                  current: c.currentSpend,
                  optimized: c.optimizedSpend,
                }))} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="current" fill="#c9c9c9" name="Current Allocation" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="optimized" fill="#0176d3" name="Optimized Allocation" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Allocation table */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Budget Allocation Plan</h4>
              <table className="slds-table">
                <thead>
                  <tr>
                    <th>Channel</th><th>Current Spend</th><th>Optimized Spend</th>
                    <th>Change</th><th>Current Revenue</th><th>Optimized Revenue</th><th>ROI</th><th>mROI</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOptResults.channels.map((c, i) => {
                    const changeNum = parseFloat(c.change);
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 6 }} />
                          {c.channel}
                        </td>
                        <td>{formatCurrency(c.currentSpend)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(c.optimizedSpend)}</td>
                        <td style={{ color: changeNum >= 0 ? '#2e844a' : '#ea001e', fontWeight: 600 }}>
                          {changeNum >= 0 ? '+' : ''}{c.change}%
                        </td>
                        <td>{formatCurrency(c.currentContribution)}</td>
                        <td>{formatCurrency(c.optimizedContribution)}</td>
                        <td>{c.roi.toFixed(2)}</td>
                        <td>{c.mROI.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, background: '#f3f3f3' }}>
                    <td>Total</td>
                    <td>{formatCurrency(activeOptResults.totalCurrentSpend)}</td>
                    <td>{formatCurrency(activeOptResults.totalOptimizedSpend)}</td>
                    <td style={{ color: '#2e844a' }}>+{activeOptResults.uplift}%</td>
                    <td>{formatCurrency(activeOptResults.totalCurrentContribution)}</td>
                    <td>{formatCurrency(activeOptResults.totalOptimizedContribution)}</td>
                    <td>{activeOptResults.currentROI}</td>
                    <td>{activeOptResults.optimizedROI}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Monthly timeline distribution when seasonality is enabled */}
            {config.budgetOptimization.useSeasonalityIndex && budgetDistribution && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Channel Budget by Month (Seasonality-Adjusted)</h4>
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
              </div>
            )}

            {/* Response curves with optimal spend markers */}
            {data && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Response Curves: Current vs. Optimal Spend</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {data.responseCurves.slice(0, 6).map((curve, i) => {
                    const opt = activeOptResults.channels[i];
                    const optSpend = opt ? Math.round(opt.optimizedSpend / data.kpiBreakdown.length) : 0;
                    return (
                      <div key={i} style={{ padding: 8 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{curve.channel}</h4>
                        <ResponsiveContainer width="100%" height={160}>
                          <LineChart data={curve.points}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="spend" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 9 }} />
                            <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 9 }} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Line type="monotone" dataKey="response" stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                            <ReferenceLine x={curve.currentSpend} stroke="#fe9339" strokeDasharray="3 3" />
                            <ReferenceLine x={optSpend} stroke="#2e844a" strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ fontSize: 10, color: '#706e6b', display: 'flex', gap: 12 }}>
                          <span><span style={{ color: '#fe9339' }}>---</span> Current</span>
                          <span><span style={{ color: '#2e844a' }}>---</span> Optimal</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
