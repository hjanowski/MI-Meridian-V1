import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, Cell,
  ComposedChart, ReferenceLine,
} from 'recharts';
import { TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react';

const COLORS = ['#0176d3', '#2e844a', '#fe9339', '#ba0517', '#9050e9', '#04844b', '#3296ed', '#fcc003', '#7b8b8e'];

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'roi', label: 'ROI Analysis', icon: DollarSign },
  { key: 'response', label: 'Response Curves', icon: TrendingUp },
  { key: 'media', label: 'Media Effects', icon: Activity },
];

function formatCurrency(val) {
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
  return '$' + val.toFixed(0);
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #DDDBDA', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#706E6B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#3E3E3C' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#706E6B', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChannel, setSelectedChannel] = useState(0);

  const data = state.dashboardData;
  if (!data) return <div>No dashboard data. Please run model training first.</div>;

  // Prepare data for spend vs contribution chart
  const spendVsContrib = data.channelROI.map((c, i) => ({
    channel: c.channel.replace(/\s*\(.*\)/, '').substring(0, 14),
    spendShare: parseFloat((c.spendShare * 100).toFixed(1)),
    contribShare: parseFloat((c.contributionShare * 100).toFixed(1)),
    roi: parseFloat(c.roi.toFixed(2)),
  }));

  // Subsample kpiBreakdown for area chart (show every Nth week)
  const step = Math.max(1, Math.floor(data.kpiBreakdown.length / 52));
  const kpiSampled = data.kpiBreakdown.filter((_, i) => i % step === 0);

  return (
    <div className="animate-slide-in">
      <div className="sf-page-header">
        <div className="sf-page-header-left">
          <div className="sf-page-icon" style={{ background: '#032D60' }}>
            <BarChart3 size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="sf-page-title">Meridian Dashboards</h1>
            <p className="sf-page-subtitle">Model results, media analysis, and budget optimization</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="slds-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
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
                channel: c.channel.replace(/\s*\(.*\)/, '').substring(0, 14),
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

    </div>
  );
}
