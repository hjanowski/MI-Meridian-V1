import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateOptimizationResults } from '../data/dataGenerator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter,
  ComposedChart, ReferenceLine,
} from 'recharts';
import { Download, FileSpreadsheet, TrendingUp, DollarSign, Target, BarChart3, Layers, Activity, Users } from 'lucide-react';

const COLORS = ['#0176d3', '#2e844a', '#fe9339', '#ba0517', '#9050e9', '#04844b', '#3296ed', '#fcc003'];

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'roi', label: 'ROI Analysis', icon: DollarSign },
  { key: 'response', label: 'Response Curves', icon: TrendingUp },
  { key: 'media', label: 'Media Effects', icon: Activity },
  { key: 'optimization', label: 'Budget Optimization', icon: Target },
  { key: 'firstparty', label: '1st Party Data', icon: Users },
];

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

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [optResults, setOptResults] = useState(null);

  const data = state.dashboardData;
  if (!data) return <div>No dashboard data. Please run model training first.</div>;

  const runOptimization = () => {
    const budget = state.config.budgetOptimization.totalBudget;
    const scenario = state.config.budgetOptimization.scenario;
    const results = generateOptimizationResults(data, budget, scenario);
    setOptResults(results);
    dispatch({ type: 'SET_OPTIMIZATION_RESULTS', payload: results });
  };

  const exportToSheets = () => {
    if (!optResults) return;
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
    const csv = [headers, ...rows, ...summary].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meridian_budget_plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare data for spend vs contribution chart
  const spendVsContrib = data.channelROI.map((c, i) => ({
    channel: c.channel.replace(/\s*\(.*\)/, '').substring(0, 12),
    spendShare: parseFloat((c.spendShare * 100).toFixed(1)),
    contribShare: parseFloat((c.contributionShare * 100).toFixed(1)),
    roi: parseFloat(c.roi.toFixed(2)),
  }));

  // Subsample kpiBreakdown for area chart (show every Nth week)
  const step = Math.max(1, Math.floor(data.kpiBreakdown.length / 52));
  const kpiSampled = data.kpiBreakdown.filter((_, i) => i % step === 0);

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="slds-text-heading_large">Meridian Dashboards</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 4 }}>Model results, media analysis, and budget optimization</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="slds-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          if (tab.key === 'firstparty' && !data.firstPartyEnrichment) return null;
          return (
            <button key={tab.key} className={`slds-tabs__item ${activeTab === tab.key ? 'slds-is-active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              <Icon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {/* KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <MetricCard label="Total Revenue" value={formatCurrency(data.totalKPI)} sub="Modeled KPI" />
            <MetricCard label="Total Media Spend" value={formatCurrency(data.totalSpend)} sub="Across all channels" />
            <MetricCard label="Baseline Share" value={(data.baselineRatio * 100).toFixed(0) + '%'} sub="Non-media driven revenue" color="#706e6b" />
            <MetricCard label="Media Contribution" value={formatCurrency(data.totalContribution)} sub="Incremental from media" color="#0176d3" />
          </div>

          {/* KPI Breakdown stacked area */}
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>KPI Breakdown: Baseline vs. Channel Contributions</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={kpiSampled}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} interval={Math.floor(kpiSampled.length / 8)} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} labelStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="baseline" stackId="1" fill="#c9c9c9" stroke="#c9c9c9" name="Baseline" />
                {data.channelROI.map((ch, i) => (
                  <Area key={ch.key} type="monotone" dataKey={ch.key} stackId="1" fill={COLORS[i % COLORS.length]} stroke={COLORS[i % COLORS.length]} name={ch.channel} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Spend vs Contribution */}
          <div className="slds-card">
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Spend Share vs. Contribution Share by Channel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendVsContrib} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v + '%'} />
                <Tooltip formatter={(v) => v + '%'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="spendShare" fill="#c9c9c9" name="Spend Share %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contribShare" fill="#0176d3" name="Contribution Share %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== ROI ANALYSIS TAB ===== */}
      {activeTab === 'roi' && (
        <div className="animate-fade-in">
          {/* ROI by Channel with CI */}
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>ROI by Channel (with 90% Credible Intervals)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={data.channelROI.map((c) => ({
                channel: c.channel.replace(/\s*\(.*\)/, '').substring(0, 12),
                roi: parseFloat(c.roi.toFixed(2)),
                roi_lower: parseFloat(c.roi_lower.toFixed(2)),
                roi_upper: parseFloat(c.roi_upper.toFixed(2)),
                range: [parseFloat(c.roi_lower.toFixed(2)), parseFloat(c.roi_upper.toFixed(2))],
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine y={1} stroke="#ea001e" strokeDasharray="3 3" label={{ value: 'Break-even', position: 'right', fontSize: 10 }} />
                <Bar dataKey="roi" fill="#0176d3" name="ROI (mean)" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: '#706e6b', marginTop: 8 }}>
              Red dashed line = break-even (ROI = 1.0). Channels above the line generate positive return.
            </div>
          </div>

          {/* ROI vs mROI scatter */}
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>ROI vs. Marginal ROI (Saturation Indicator)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="roi" name="ROI" tick={{ fontSize: 10 }} label={{ value: 'ROI', position: 'bottom', fontSize: 11 }} />
                <YAxis dataKey="mROI" name="mROI" tick={{ fontSize: 10 }} label={{ value: 'mROI', angle: -90, position: 'left', fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toFixed(2)} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={data.channelROI.map((c, i) => ({
                  roi: parseFloat(c.roi.toFixed(2)), mROI: parseFloat(c.mROI.toFixed(2)),
                  channel: c.channel, fill: COLORS[i % COLORS.length], r: 8,
                }))} fill="#0176d3">
                  {data.channelROI.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: '#706e6b', marginTop: 8 }}>
              When mROI {'<'} ROI, the channel is saturating at current spend. Channels in bottom-right are over-invested.
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              {data.channelROI.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  {c.channel}
                </div>
              ))}
            </div>
          </div>

          {/* ROI Table */}
          <div className="slds-card">
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Channel Performance Summary</h3>
            <table className="slds-table">
              <thead>
                <tr>
                  <th>Channel</th><th>Total Spend</th><th>Contribution</th>
                  <th>ROI</th><th>90% CI</th><th>mROI</th><th>Spend %</th><th>Contribution %</th>
                </tr>
              </thead>
              <tbody>
                {data.channelROI.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 6 }} />
                      {c.channel}
                    </td>
                    <td>{formatCurrency(c.totalSpend)}</td>
                    <td>{formatCurrency(c.contribution)}</td>
                    <td style={{ fontWeight: 700, color: c.roi >= 1 ? '#2e844a' : '#ea001e' }}>{c.roi.toFixed(2)}</td>
                    <td style={{ fontSize: 11, color: '#706e6b' }}>[{c.roi_lower.toFixed(2)}, {c.roi_upper.toFixed(2)}]</td>
                    <td>{c.mROI.toFixed(2)}</td>
                    <td>{(c.spendShare * 100).toFixed(1)}%</td>
                    <td>{(c.contributionShare * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== RESPONSE CURVES TAB ===== */}
      {activeTab === 'response' && (
        <div className="animate-fade-in">
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="slds-text-heading_small">Response Curves by Channel</h3>
              <select className="slds-select" style={{ width: 200 }} value={selectedChannel} onChange={(e) => setSelectedChannel(parseInt(e.target.value))}>
                {data.responseCurves.map((c, i) => <option key={i} value={i}>{c.channel}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data.responseCurves[selectedChannel].points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="spend" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} label={{ value: 'Weekly Spend', position: 'bottom', fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} label={{ value: 'Incremental Revenue', angle: -90, position: 'left', fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="upper" fill="#e5f5fe" stroke="none" name="Upper CI" />
                <Area type="monotone" dataKey="lower" fill="#ffffff" stroke="none" name="Lower CI" />
                <Line type="monotone" dataKey="response" stroke="#0176d3" strokeWidth={2} dot={false} name="Expected Response" />
                <ReferenceLine x={data.responseCurves[selectedChannel].currentSpend} stroke="#fe9339" strokeDasharray="5 5" label={{ value: 'Current', position: 'top', fontSize: 10, fill: '#fe9339' }} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: '#706e6b', marginTop: 8 }}>
              Orange dashed line shows current average weekly spend. The curve flattens as spending increases, indicating diminishing returns (Hill saturation).
            </div>
          </div>

          {/* All response curves in grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {data.responseCurves.map((curve, i) => (
              <div key={i} className="slds-card" style={{ padding: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{curve.channel}</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={curve.points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="spend" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="response" stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                    <ReferenceLine x={curve.currentSpend} stroke="#fe9339" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== MEDIA EFFECTS TAB ===== */}
      {activeTab === 'media' && (
        <div className="animate-fade-in">
          {/* Adstock Decay */}
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Adstock Decay Curves</h3>
            <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 12 }}>Shows how media effects decay over weeks. Higher alpha = longer carryover effect.</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="lag" type="number" tick={{ fontSize: 10 }} label={{ value: 'Lag (weeks)', position: 'bottom', fontSize: 11 }} allowDuplicatedCategory={false} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} label={{ value: 'Effect Strength', angle: -90, position: 'left', fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.adstockCurves.map((curve, i) => (
                  <Line key={i} data={curve.points} type="monotone" dataKey="effect" stroke={COLORS[i % COLORS.length]} name={curve.channel + ' (α=' + curve.alpha.toFixed(2) + ')'} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hill Saturation */}
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Hill Saturation Curves</h3>
            <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 12 }}>Shows how media effectiveness saturates as spend increases. ec = half-saturation point.</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} label={{ value: 'Normalized Media (x/median)', position: 'bottom', fontSize: 11 }} allowDuplicatedCategory={false} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} label={{ value: 'Saturation', angle: -90, position: 'left', fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.saturationCurves.map((curve, i) => (
                  <Line key={i} data={curve.points} type="monotone" dataKey="y" stroke={COLORS[i % COLORS.length]} name={curve.channel + ' (ec=' + curve.ec.toFixed(2) + ')'} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Adstock & Saturation Parameters Table */}
          <div className="slds-card">
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Media Effect Parameters</h3>
            <table className="slds-table">
              <thead>
                <tr><th>Channel</th><th>Adstock Alpha (α)</th><th>Half-Life (weeks)</th><th>Hill EC</th><th>Hill Slope</th></tr>
              </thead>
              <tbody>
                {data.adstockCurves.map((ad, i) => {
                  const sat = data.saturationCurves[i];
                  const halfLife = Math.log(0.5) / Math.log(ad.alpha);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 6 }} />
                        {ad.channel}
                      </td>
                      <td>{ad.alpha.toFixed(3)}</td>
                      <td>{halfLife.toFixed(1)} weeks</td>
                      <td>{sat.ec.toFixed(3)}</td>
                      <td>{sat.slope.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== BUDGET OPTIMIZATION TAB ===== */}
      {activeTab === 'optimization' && (
        <div className="animate-fade-in">
          {!optResults ? (
            <div className="slds-card" style={{ textAlign: 'center', padding: 40 }}>
              <Target size={48} color="#0176d3" style={{ marginBottom: 16 }} />
              <h3 className="slds-text-heading_medium" style={{ marginBottom: 8 }}>Budget Optimization</h3>
              <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 8 }}>
                Scenario: <strong>{state.config.budgetOptimization.scenario === 'fixed' ? 'Fixed Budget' : state.config.budgetOptimization.scenario === 'flexible_roi' ? 'Flexible Budget (Target ROI)' : 'Flexible Budget (Target mROI)'}</strong>
              </p>
              <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 4 }}>
                Budget: <strong>{formatCurrency(state.config.budgetOptimization.totalBudget)}</strong>
              </p>
              <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 20 }}>
                Constraints: {(state.config.budgetOptimization.spendConstraintLower * 100).toFixed(0)}% - {(state.config.budgetOptimization.spendConstraintUpper * 100).toFixed(0)}% of current spend per channel
              </p>
              <button className="slds-button slds-button_brand" onClick={runOptimization}>
                <Target size={16} /> Run Budget Optimization
              </button>
            </div>
          ) : (
            <>
              {/* Summary metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                <MetricCard label="Total Budget" value={formatCurrency(optResults.budget)} />
                <MetricCard label="Current ROI" value={optResults.currentROI + 'x'} />
                <MetricCard label="Optimized ROI" value={optResults.optimizedROI + 'x'} color="#2e844a" />
                <MetricCard label="Revenue Uplift" value={'+' + optResults.uplift + '%'} sub={formatCurrency(optResults.totalOptimizedContribution - optResults.totalCurrentContribution) + ' additional'} color="#2e844a" />
              </div>

              {/* Current vs Optimized bar chart */}
              <div className="slds-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 className="slds-text-heading_small">Current vs. Optimized Budget Allocation</h3>
                  <button className="slds-button slds-button_success" onClick={exportToSheets}>
                    <FileSpreadsheet size={14} /> Export to Google Sheets (CSV)
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={optResults.channels.map((c) => ({
                    channel: c.channel.replace(/\s*\(.*\)/, '').substring(0, 12),
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

              {/* Optimization table */}
              <div className="slds-card" style={{ marginBottom: 16 }}>
                <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Budget Allocation Plan</h3>
                <table className="slds-table">
                  <thead>
                    <tr>
                      <th>Channel</th><th>Current Spend</th><th>Optimized Spend</th>
                      <th>Change</th><th>Current Revenue</th><th>Optimized Revenue</th><th>ROI</th><th>mROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optResults.channels.map((c, i) => {
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
                      <td>{formatCurrency(optResults.totalCurrentSpend)}</td>
                      <td>{formatCurrency(optResults.totalOptimizedSpend)}</td>
                      <td style={{ color: '#2e844a' }}>+{optResults.uplift}%</td>
                      <td>{formatCurrency(optResults.totalCurrentContribution)}</td>
                      <td>{formatCurrency(optResults.totalOptimizedContribution)}</td>
                      <td>{optResults.currentROI}</td>
                      <td>{optResults.optimizedROI}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Response curves with optimal spend markers */}
              <div className="slds-card">
                <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Response Curves: Current vs. Optimal Spend</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {data.responseCurves.slice(0, 6).map((curve, i) => {
                    const opt = optResults.channels[i];
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
            </>
          )}
        </div>
      )}

      {/* ===== 1ST PARTY DATA TAB ===== */}
      {activeTab === 'firstparty' && data.firstPartyEnrichment && (
        <div className="animate-fade-in">
          <div className="slds-notify slds-notify_success" style={{ marginBottom: 16 }}>
            <Users size={18} />
            <div>
              <strong>1st Party Data Connected via Salesforce Data Cloud</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                CRM data enrichment improved model accuracy by an estimated <strong>{(data.firstPartyEnrichment.uplift * 100).toFixed(0)}%</strong>.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Segment Contributions */}
            <div className="slds-card">
              <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Revenue Contribution by CRM Segment</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.firstPartyEnrichment.segmentContributions} dataKey="contribution" nameKey="segment" cx="50%" cy="50%" outerRadius={90} label={({ segment, contribution }) => segment.split(' ')[0] + ' ' + (contribution * 100).toFixed(0) + '%'}>
                    {data.firstPartyEnrichment.segmentContributions.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (v * 100).toFixed(1) + '%'} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Affinities */}
            <div className="slds-card">
              <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Channel Affinity by Segment</h3>
              <table className="slds-table">
                <thead>
                  <tr><th>Channel</th><th>High-Value Affinity</th><th>New Prospect Affinity</th></tr>
                </thead>
                <tbody>
                  {data.firstPartyEnrichment.channelAffinities.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{a.channel}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: '#e5e5e5', borderRadius: 3 }}>
                            <div style={{ width: (parseFloat(a.highValue) * 100) + '%', height: '100%', background: '#0176d3', borderRadius: 3 }} />
                          </div>
                          {a.highValue}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: '#e5e5e5', borderRadius: 3 }}>
                            <div style={{ width: (parseFloat(a.newProspect) * 100) + '%', height: '100%', background: '#2e844a', borderRadius: 3 }} />
                          </div>
                          {a.newProspect}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: '#706e6b', marginTop: 12 }}>
                Affinity scores range from 0 (low) to 1 (high). Higher scores indicate stronger channel preference for that segment.
              </div>
            </div>
          </div>

          {/* Conversion paths */}
          <div className="slds-card" style={{ marginTop: 16 }}>
            <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Top Conversion Paths (from Data Cloud)</h3>
            {state.pipelineData?.firstPartyData?.conversionPaths?.topPaths.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 30, fontSize: 12, fontWeight: 700, color: '#706e6b' }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.path}</div>
                  <div style={{ height: 6, background: '#e5e5e5', borderRadius: 3, marginTop: 4 }}>
                    <div style={{ width: (p.pct / 20 * 100) + '%', height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ width: 50, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{p.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
