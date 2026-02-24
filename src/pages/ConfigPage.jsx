import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Database, Info, ArrowRight, CheckCircle, XCircle, RefreshCw, Signal, Target } from 'lucide-react';

const ENGAGEMENT_SIGNALS = [
  { dataSource: 'Social Media', channel: 'Facebook, Instagram, TikTok', metric: 'Impressions, Clicks, Engagements', status: 'active', lastSync: '2026-02-24 08:15' },
  { dataSource: 'Paid Search', channel: 'Google Ads, Bing Ads', metric: 'Clicks, Impressions, Cost', status: 'active', lastSync: '2026-02-24 08:15' },
  { dataSource: 'Display Ads', channel: 'Google Display Network', metric: 'Impressions, Viewability, Clicks', status: 'active', lastSync: '2026-02-24 07:30' },
  { dataSource: 'Email Marketing', channel: 'Salesforce Marketing Cloud', metric: 'Opens, Clicks, Sends', status: 'active', lastSync: '2026-02-24 06:00' },
  { dataSource: 'Video (YouTube)', channel: 'YouTube, Connected TV', metric: 'Views, Completions, Cost', status: 'active', lastSync: '2026-02-23 22:00' },
  { dataSource: 'TV Broadcast', channel: 'Linear TV', metric: 'GRPs, Reach, Spend', status: 'warning', lastSync: '2026-02-20 12:00' },
  { dataSource: 'Radio', channel: 'Terrestrial, Streaming', metric: 'Spots, Reach, Spend', status: 'inactive', lastSync: '—' },
  { dataSource: 'Print', channel: 'Newspapers, Magazines', metric: 'Insertions, Circulation, Spend', status: 'inactive', lastSync: '—' },
  { dataSource: 'Affiliate', channel: 'Commission Junction, Rakuten', metric: 'Clicks, Conversions, Payout', status: 'active', lastSync: '2026-02-24 07:45' },
  { dataSource: 'Direct Mail', channel: 'USPS, Postcard Campaigns', metric: 'Sends, Response Rate, Cost', status: 'inactive', lastSync: '—' },
];

const CONVERSION_METRICS = [
  { conversionType: 'Website Purchases', source: 'Google Analytics 4', metric: 'Transactions', status: 'active', lastSync: '2026-02-24 08:15' },
  { conversionType: 'Lead Submissions', source: 'Salesforce CRM', metric: 'MQLs, SQLs', status: 'active', lastSync: '2026-02-24 08:00' },
  { conversionType: 'App Installs', source: 'AppsFlyer', metric: 'Installs, First Opens', status: 'active', lastSync: '2026-02-24 07:30' },
  { conversionType: 'In-Store Purchases', source: 'POS System', metric: 'Transactions, Revenue', status: 'warning', lastSync: '2026-02-21 18:00' },
  { conversionType: 'Phone Calls', source: 'CallRail', metric: 'Qualified Calls', status: 'inactive', lastSync: '—' },
  { conversionType: 'Subscription Sign-ups', source: 'Stripe / Recurly', metric: 'New Subscriptions', status: 'active', lastSync: '2026-02-24 06:00' },
];

function StatusDot({ status }) {
  const colors = { active: '#2e844a', warning: '#fe9339', inactive: '#c9c9c9' };
  const labels = { active: 'Active', warning: 'Stale', inactive: 'Inactive' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || '#c9c9c9', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: status === 'active' ? '#2e844a' : status === 'warning' ? '#8c4b02' : '#706e6b' }}>
        {labels[status] || 'Unknown'}
      </span>
    </div>
  );
}

export default function ConfigPage() {
  const { state, dispatch } = useApp();
  const { config } = state;
  const [activeTab, setActiveTab] = useState('signals');

  const updateConfig = (updates) => dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  const updateFactors = (updates) => dispatch({ type: 'UPDATE_EXTERNAL_FACTORS', payload: updates });
  const updateBudget = (updates) => dispatch({ type: 'UPDATE_BUDGET_CONFIG', payload: updates });

  const activeSignals = ENGAGEMENT_SIGNALS.filter((s) => s.status === 'active').length;
  const activeConversions = CONVERSION_METRICS.filter((s) => s.status === 'active').length;

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="slds-text-heading_large">MI Configuration</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 4 }}>Configure data feeds, engagement signals, conversion metrics, and Meridian model parameters</p>
        </div>
      </div>

      {/* Summary metrics bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Engagement Signals', value: `${activeSignals}/${ENGAGEMENT_SIGNALS.length}`, sub: 'Active feeds', color: '#0176d3' },
          { label: 'Conversion Metrics', value: `${activeConversions}/${CONVERSION_METRICS.length}`, sub: 'Active feeds', color: '#2e844a' },
          { label: 'Data Freshness', value: 'Today', sub: 'Last sync: 08:15 AM', color: '#0176d3' },
          { label: '1st Party Data', value: config.connectFirstParty ? 'Connected' : 'Disconnected', sub: 'Salesforce Data Cloud', color: config.connectFirstParty ? '#2e844a' : '#706e6b' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 4, padding: 16, borderTop: `3px solid ${m.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: '#706e6b', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="slds-tabs">
        {[
          { key: 'signals', label: 'Engagement Signals', icon: Signal },
          { key: 'conversions', label: 'Conversion Metrics', icon: Target },
          { key: 'model', label: 'Model Parameters', icon: Settings },
          { key: 'data', label: '1st Party Data', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`slds-tabs__item${activeTab === tab.key ? ' slds-is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={14} style={{ marginRight: 6 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Engagement Signals Tab */}
      {activeTab === 'signals' && (
        <div className="animate-fade-in">
          <div className="slds-card">
            <div className="slds-card__header">
              <h2 className="slds-card__header-title">
                <Signal size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Engagement Signals
              </h2>
              <button className="slds-button slds-button_neutral" style={{ fontSize: 12 }}>
                <RefreshCw size={14} /> Sync All
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 16 }}>
              Configure which engagement data sources feed into the Meridian marketing mix model. Each signal contributes media spend, impressions, and interaction metrics.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="slds-table">
                <thead>
                  <tr>
                    <th>Data Source</th>
                    <th>Channel</th>
                    <th>Metric</th>
                    <th>Data Feed Status</th>
                    <th>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {ENGAGEMENT_SIGNALS.map((signal, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{signal.dataSource}</td>
                      <td style={{ color: '#706e6b', fontSize: 12 }}>{signal.channel}</td>
                      <td style={{ color: '#706e6b', fontSize: 12 }}>{signal.metric}</td>
                      <td><StatusDot status={signal.status} /></td>
                      <td style={{ fontSize: 12, color: '#706e6b' }}>{signal.lastSync}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Metrics Tab */}
      {activeTab === 'conversions' && (
        <div className="animate-fade-in">
          <div className="slds-card">
            <div className="slds-card__header">
              <h2 className="slds-card__header-title">
                <Target size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Conversion Metrics
              </h2>
              <button className="slds-button slds-button_neutral" style={{ fontSize: 12 }}>
                <RefreshCw size={14} /> Sync All
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 16 }}>
              Define the KPI and conversion events that Meridian will model as the target variable. Multiple conversion types can be combined or used individually.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="slds-table">
                <thead>
                  <tr>
                    <th>Conversion Type</th>
                    <th>Source</th>
                    <th>Metric</th>
                    <th>Status</th>
                    <th>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {CONVERSION_METRICS.map((conv, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{conv.conversionType}</td>
                      <td style={{ color: '#706e6b', fontSize: 12 }}>{conv.source}</td>
                      <td style={{ color: '#706e6b', fontSize: 12 }}>{conv.metric}</td>
                      <td><StatusDot status={conv.status} /></td>
                      <td style={{ fontSize: 12, color: '#706e6b' }}>{conv.lastSync}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Model Parameters Tab */}
      {activeTab === 'model' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Model Specification */}
            <div className="slds-card">
              <div className="slds-card__header">
                <h2 className="slds-card__header-title"><Settings size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Meridian Model Specification</h2>
              </div>
              <div className="slds-form-element">
                <label className="slds-form-element__label">KPI Type</label>
                <select className="slds-select" value={config.kpiType} onChange={(e) => updateConfig({ kpiType: e.target.value })}>
                  <option value="revenue">Revenue</option>
                  <option value="non_revenue">Non-Revenue (Conversions)</option>
                </select>
                <div className="slds-form-element__help">Determines how ROI is calculated. Revenue KPIs allow direct ROI computation.</div>
              </div>
              <div className="slds-form-element">
                <label className="slds-form-element__label">Adstock Decay Function</label>
                <select className="slds-select" value={config.adstockDecay} onChange={(e) => updateConfig({ adstockDecay: e.target.value })}>
                  <option value="geometric">Geometric (exponential decay)</option>
                  <option value="binomial">Binomial (delayed peak)</option>
                </select>
                <div className="slds-form-element__help">Geometric is simpler; Binomial captures delayed media effects better (e.g., video/TV).</div>
              </div>
              <div className="slds-form-element">
                <label className="slds-form-element__label">Maximum Lag (weeks)</label>
                <input className="slds-input" type="number" min={1} max={26} value={config.maxLag} onChange={(e) => updateConfig({ maxLag: parseInt(e.target.value) || 8 })} />
                <div className="slds-form-element__help">How many weeks of carryover effect to model for media channels.</div>
              </div>
              <label className="slds-checkbox-toggle" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={config.hillBeforeAdstock} onChange={(e) => updateConfig({ hillBeforeAdstock: e.target.checked })} />
                <div className="slds-checkbox-toggle__track" />
                <span className="slds-checkbox-toggle__label">Apply Hill saturation before adstock</span>
              </label>
            </div>

            {/* Seasonality & Time Controls */}
            <div className="slds-card">
              <div className="slds-card__header">
                <h2 className="slds-card__header-title">Seasonality & Time Controls</h2>
              </div>
              <div className="slds-form-element">
                <label className="slds-form-element__label">Knots (time-varying intercept)</label>
                <select className="slds-select" value={config.knots} onChange={(e) => updateConfig({ knots: e.target.value })}>
                  <option value="auto">Automatic (1 per time period)</option>
                  <option value="aks">Automatic Knot Selection (AKS)</option>
                  <option value="10pct">10% of time periods</option>
                  <option value="1">Single knot (constant intercept)</option>
                </select>
                <div className="slds-form-element__help">Controls how seasonality and trend are captured. &quot;Auto&quot; gives maximum flexibility.</div>
              </div>
              <label className="slds-checkbox-toggle">
                <input type="checkbox" checked={config.enableAKS} onChange={(e) => updateConfig({ enableAKS: e.target.checked })} />
                <div className="slds-checkbox-toggle__track" />
                <span className="slds-checkbox-toggle__label">Enable Automatic Knot Selection (AKS)</span>
              </label>
              <div className="slds-form-element__help" style={{ marginTop: 4 }}>Uses backward elimination + AIC to find optimal knot placement.</div>
            </div>

            {/* Prior Distributions */}
            <div className="slds-card">
              <div className="slds-card__header">
                <h2 className="slds-card__header-title">Prior Distributions</h2>
              </div>
              <div className="slds-notify slds-notify_info" style={{ marginBottom: 12 }}>
                <Info size={16} />
                <div style={{ fontSize: 12 }}>Meridian uses Bayesian priors on ROI. Default: LogNormal(0.0, 0.5) giving median ROI of 1.0.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="slds-form-element">
                  <label className="slds-form-element__label">ROI Prior Mean (log scale)</label>
                  <input className="slds-input" type="number" step={0.1} value={config.priorROI.mean} onChange={(e) => updateConfig({ priorROI: { ...config.priorROI, mean: parseFloat(e.target.value) || 0 } })} />
                </div>
                <div className="slds-form-element">
                  <label className="slds-form-element__label">ROI Prior Std (log scale)</label>
                  <input className="slds-input" type="number" step={0.1} min={0.1} value={config.priorROI.std} onChange={(e) => updateConfig({ priorROI: { ...config.priorROI, std: parseFloat(e.target.value) || 0.5 } })} />
                </div>
              </div>
              <div className="slds-form-element__help">
                Median ROI = e^{config.priorROI.mean} = {Math.exp(config.priorROI.mean).toFixed(2)}.
                Higher std = less informative prior (more data-driven).
              </div>
            </div>

            {/* External Factors */}
            <div className="slds-card">
              <div className="slds-card__header">
                <h2 className="slds-card__header-title">External Factors & Controls</h2>
              </div>
              <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 16 }}>
                Select external factors to include as control variables in the model.
              </p>
              {[
                { key: 'seasonality', label: 'Seasonality', desc: 'Auto-captured by time-varying intercept (knots)' },
                { key: 'holidays', label: 'Holiday Effects', desc: 'Black Friday, Christmas, etc. as dummy variables' },
                { key: 'gqv', label: 'Google Query Volume (GQV)', desc: 'Organic search demand via MMM Data Platform' },
                { key: 'competitorActivity', label: 'Competitor Activity', desc: 'Competitor spend/promotions as control variables' },
                { key: 'macroEconomic', label: 'Macroeconomic Indicators', desc: 'CPI, unemployment rate, consumer confidence' },
                { key: 'weather', label: 'Weather Data', desc: 'Temperature, precipitation by geo region' },
              ].map((f) => (
                <label key={f.key} className="slds-checkbox-toggle" style={{ marginBottom: 12 }}>
                  <input type="checkbox" checked={config.externalFactors[f.key]} onChange={(e) => updateFactors({ [f.key]: e.target.checked })} />
                  <div className="slds-checkbox-toggle__track" />
                  <div>
                    <span className="slds-checkbox-toggle__label">{f.label}</span>
                    <div style={{ fontSize: 11, color: '#706e6b' }}>{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Budget Optimization Config */}
            <div className="slds-card" style={{ gridColumn: '1 / -1' }}>
              <div className="slds-card__header">
                <h2 className="slds-card__header-title">Budget Optimization Settings</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="slds-form-element">
                  <label className="slds-form-element__label">Optimization Scenario</label>
                  <select className="slds-select" value={config.budgetOptimization.scenario} onChange={(e) => updateBudget({ scenario: e.target.value })}>
                    <option value="fixed">Fixed Budget — Maximize ROI</option>
                    <option value="flexible_roi">Flexible Budget — Target ROI</option>
                    <option value="flexible_mroi">Flexible Budget — Target Marginal ROI</option>
                  </select>
                </div>
                <div className="slds-form-element">
                  <label className="slds-form-element__label">Total Budget ($)</label>
                  <input className="slds-input" type="number" value={config.budgetOptimization.totalBudget} onChange={(e) => updateBudget({ totalBudget: parseInt(e.target.value) || 0 })} />
                </div>
                {config.budgetOptimization.scenario !== 'fixed' && (
                  <div className="slds-form-element">
                    <label className="slds-form-element__label">Target ROI</label>
                    <input className="slds-input" type="number" step={0.1} value={config.budgetOptimization.targetROI} onChange={(e) => updateBudget({ targetROI: parseFloat(e.target.value) || 1.0 })} />
                  </div>
                )}
                <div className="slds-form-element">
                  <label className="slds-form-element__label">Min Spend Shift</label>
                  <input className="slds-input" type="number" step={0.1} min={0} max={1} value={config.budgetOptimization.spendConstraintLower} onChange={(e) => updateBudget({ spendConstraintLower: parseFloat(e.target.value) })} />
                  <div className="slds-form-element__help">e.g., 0.5 = min 50% of current</div>
                </div>
                <div className="slds-form-element">
                  <label className="slds-form-element__label">Max Spend Shift</label>
                  <input className="slds-input" type="number" step={0.1} min={1} value={config.budgetOptimization.spendConstraintUpper} onChange={(e) => updateBudget({ spendConstraintUpper: parseFloat(e.target.value) })} />
                  <div className="slds-form-element__help">e.g., 2.0 = max 200% of current</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1st Party Data Tab */}
      {activeTab === 'data' && (
        <div className="animate-fade-in">
          <div className="slds-card">
            <div className="slds-card__header">
              <h2 className="slds-card__header-title"><Database size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Salesforce 1st Party Data</h2>
            </div>
            <div className="slds-notify slds-notify_info" style={{ marginBottom: 16 }}>
              <Info size={16} />
              <div style={{ fontSize: 12 }}>
                Connect to Salesforce Data Cloud to enrich your MMM analysis with CRM segments, engagement scores, and conversion paths. No additional ingestion needed — data is already available.
              </div>
            </div>
            <label className="slds-checkbox-toggle">
              <input type="checkbox" checked={config.connectFirstParty} onChange={(e) => updateConfig({ connectFirstParty: e.target.checked })} />
              <div className="slds-checkbox-toggle__track" />
              <span className="slds-checkbox-toggle__label">Connect to Data Cloud</span>
            </label>
            {config.connectFirstParty && state.pipelineData?.firstPartyData && (
              <div style={{ marginTop: 16, background: '#f3f3f3', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Available 1st Party Data</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>CRM Segments</div>
                    {state.pipelineData.firstPartyData.crmSegments.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>
                        {s.name} <span style={{ color: '#706e6b' }}>({s.size.toLocaleString()} contacts)</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>Engagement Score</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#0176d3' }}>{state.pipelineData.firstPartyData.engagementScores.avgScore}</div>
                    <div style={{ fontSize: 11, color: '#706e6b' }}>Avg. across all contacts</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase', marginBottom: 4 }}>Top Conversion Paths</div>
                  {state.pipelineData.firstPartyData.conversionPaths.topPaths.slice(0, 3).map((p, i) => (
                    <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>{p.path}</span>
                      <span style={{ fontWeight: 600 }}>{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
        <button className="slds-button slds-button_neutral" onClick={() => dispatch({ type: 'SET_STEP', payload: 'pipeline' })}>
          Back to Data Ingestion
        </button>
        <button
          className="slds-button slds-button_brand"
          disabled={!state.validationResults?.canProceed}
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'training' })}
        >
          Proceed to Model Data Feed <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
