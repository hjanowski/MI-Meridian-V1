import { useApp } from '../context/AppContext';
import { Settings, Database, Info, ArrowRight, Clock, Sliders, BarChart3, CloudLightning, CheckCircle, Edit3 } from 'lucide-react';

function StatusDot({ active }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#2e844a' : '#c9c9c9', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: active ? '#2e844a' : '#706e6b' }}>
        {active ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

function SectionIcon({ icon: Icon, color }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: color + '14',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={18} color={color} />
    </div>
  );
}

function Section({ icon, color, title, badge, children }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e5e5', borderRadius: 8,
      marginBottom: 16, overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #e5e5e5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SectionIcon icon={icon} color={color} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#181818' }}>{title}</h2>
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const { state, dispatch } = useApp();
  const { config } = state;

  const updateConfig = (updates) => dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  const updateFactors = (updates) => dispatch({ type: 'UPDATE_EXTERNAL_FACTORS', payload: updates });
  const updateBudget = (updates) => dispatch({ type: 'UPDATE_BUDGET_CONFIG', payload: updates });

  const enabledFactors = Object.values(config.externalFactors).filter(Boolean).length;
  const totalFactors = Object.keys(config.externalFactors).length;

  return (
    <div className="animate-slide-in">
      {/* Page header with actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181818' }}>MI Configuration</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 2 }}>
            Configure Meridian MMM parameters, connect data sources, and set external factors
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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

      {/* Summary metadata bar */}
      <div style={{
        background: 'white', border: '1px solid #e5e5e5', borderRadius: 8,
        padding: '14px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Name', value: state.pipelineName || 'MI Configuration' },
          { label: '1st Party Data', value: config.connectFirstParty ? 'Connected' : 'Disconnected' },
          { label: 'KPI Type', value: config.kpiType === 'revenue' ? 'Revenue' : 'Conversions' },
          { label: 'Adstock', value: config.adstockDecay === 'geometric' ? 'Geometric' : 'Binomial' },
          { label: 'External Factors', value: `${enabledFactors}/${totalFactors} enabled` },
          { label: 'Budget', value: '$' + config.budgetOptimization.totalBudget.toLocaleString() },
          { label: 'Status', value: state.validationResults?.canProceed ? 'Ready' : 'Pending' },
        ].map((item, i, arr) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', padding: '0 20px',
            borderRight: i < arr.length - 1 ? '1px solid #e5e5e5' : 'none',
          }}>
            <span style={{ fontSize: 11, color: '#706e6b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {item.label}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600, color: '#181818', marginTop: 2,
              ...(item.label === 'Status' && item.value === 'Ready' ? { color: '#2e844a' } : {}),
              ...(item.label === '1st Party Data' && item.value === 'Connected' ? { color: '#2e844a' } : {}),
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Salesforce 1st Party Data */}
      <Section icon={Database} color="#0176d3" title="Salesforce 1st Party Data"
        badge={<StatusDot active={config.connectFirstParty} />}
      >
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
          <div style={{ marginTop: 16 }}>
            <table className="slds-table">
              <thead>
                <tr><th>CRM Segment</th><th>Contacts</th><th>Avg LTV</th></tr>
              </thead>
              <tbody>
                {state.pipelineData.firstPartyData.crmSegments.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.size.toLocaleString()}</td>
                    <td>${s.avgLTV.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <div style={{ background: '#f8f8f8', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>Engagement Score</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0176d3', marginTop: 4 }}>{state.pipelineData.firstPartyData.engagementScores.avgScore}</div>
                <div style={{ fontSize: 11, color: '#706e6b' }}>Avg. across all contacts</div>
              </div>
              <div style={{ background: '#f8f8f8', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase', marginBottom: 4 }}>Top Conversion Paths</div>
                {state.pipelineData.firstPartyData.conversionPaths.topPaths.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>{p.path}</span>
                    <span style={{ fontWeight: 600 }}>{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Meridian Model Specification */}
      <Section icon={Settings} color="#0176d3" title="Meridian Model Specification">
        <table className="slds-table" style={{ marginBottom: 20 }}>
          <thead>
            <tr><th>Parameter</th><th>Current Value</th><th></th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>KPI Type</td>
              <td>{config.kpiType === 'revenue' ? 'Revenue' : 'Non-Revenue (Conversions)'}</td>
              <td style={{ width: 32 }}><Edit3 size={14} color="#706e6b" /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Adstock Decay</td>
              <td>{config.adstockDecay === 'geometric' ? 'Geometric (exponential)' : 'Binomial (delayed peak)'}</td>
              <td><Edit3 size={14} color="#706e6b" /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Max Lag</td>
              <td>{config.maxLag} weeks</td>
              <td><Edit3 size={14} color="#706e6b" /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Hill Before Adstock</td>
              <td><StatusDot active={config.hillBeforeAdstock} /></td>
              <td><Edit3 size={14} color="#706e6b" /></td>
            </tr>
          </tbody>
        </table>
        <div style={{
          background: '#f8f8f8', borderRadius: 6, padding: 20,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">KPI Type</label>
            <select className="slds-select" value={config.kpiType} onChange={(e) => updateConfig({ kpiType: e.target.value })}>
              <option value="revenue">Revenue</option>
              <option value="non_revenue">Non-Revenue (Conversions)</option>
            </select>
            <div className="slds-form-element__help">Determines how ROI is calculated. Revenue KPIs allow direct ROI computation.</div>
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Adstock Decay Function</label>
            <select className="slds-select" value={config.adstockDecay} onChange={(e) => updateConfig({ adstockDecay: e.target.value })}>
              <option value="geometric">Geometric (exponential decay)</option>
              <option value="binomial">Binomial (delayed peak)</option>
            </select>
            <div className="slds-form-element__help">Geometric is simpler; Binomial captures delayed media effects better.</div>
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Maximum Lag (weeks)</label>
            <input className="slds-input" type="number" min={1} max={26} value={config.maxLag} onChange={(e) => updateConfig({ maxLag: parseInt(e.target.value) || 8 })} />
            <div className="slds-form-element__help">Weeks of carryover effect to model for media channels.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label className="slds-checkbox-toggle">
              <input type="checkbox" checked={config.hillBeforeAdstock} onChange={(e) => updateConfig({ hillBeforeAdstock: e.target.checked })} />
              <div className="slds-checkbox-toggle__track" />
              <span className="slds-checkbox-toggle__label">Apply Hill saturation before adstock</span>
            </label>
          </div>
        </div>
      </Section>

      {/* Seasonality & Time Controls */}
      <Section icon={Clock} color="#2e844a" title="Seasonality & Time Controls"
        badge={<StatusDot active={config.enableAKS} />}
      >
        <div style={{
          background: '#f8f8f8', borderRadius: 6, padding: 20,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">Knots (time-varying intercept)</label>
            <select className="slds-select" value={config.knots} onChange={(e) => updateConfig({ knots: e.target.value })}>
              <option value="auto">Automatic (1 per time period)</option>
              <option value="aks">Automatic Knot Selection (AKS)</option>
              <option value="10pct">10% of time periods</option>
              <option value="1">Single knot (constant intercept)</option>
            </select>
            <div className="slds-form-element__help">Controls how seasonality and trend are captured. &quot;Auto&quot; gives maximum flexibility.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label className="slds-checkbox-toggle">
              <input type="checkbox" checked={config.enableAKS} onChange={(e) => updateConfig({ enableAKS: e.target.checked })} />
              <div className="slds-checkbox-toggle__track" />
              <span className="slds-checkbox-toggle__label">Enable Automatic Knot Selection (AKS)</span>
            </label>
            <div className="slds-form-element__help" style={{ marginTop: 4 }}>Uses backward elimination + AIC to find optimal knot placement.</div>
          </div>
        </div>
      </Section>

      {/* Prior Distributions */}
      <Section icon={Sliders} color="#2e844a" title="Prior Distributions"
        badge={
          <span style={{
            fontSize: 12, color: '#706e6b', fontWeight: 500,
            background: '#f3f3f3', padding: '4px 12px', borderRadius: 12,
          }}>
            Median ROI = {Math.exp(config.priorROI.mean).toFixed(2)}
          </span>
        }
      >
        <div className="slds-notify slds-notify_info" style={{ marginBottom: 16 }}>
          <Info size={16} />
          <div style={{ fontSize: 12 }}>Meridian uses Bayesian priors on ROI. Default: LogNormal(0.0, 0.5) giving median ROI of 1.0.</div>
        </div>
        <div style={{
          background: '#f8f8f8', borderRadius: 6, padding: 20,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">ROI Prior Mean (log scale)</label>
            <input className="slds-input" type="number" step={0.1} value={config.priorROI.mean} onChange={(e) => updateConfig({ priorROI: { ...config.priorROI, mean: parseFloat(e.target.value) || 0 } })} />
          </div>
          <div className="slds-form-element" style={{ marginBottom: 0 }}>
            <label className="slds-form-element__label">ROI Prior Std (log scale)</label>
            <input className="slds-input" type="number" step={0.1} min={0.1} value={config.priorROI.std} onChange={(e) => updateConfig({ priorROI: { ...config.priorROI, std: parseFloat(e.target.value) || 0.5 } })} />
          </div>
        </div>
        <div className="slds-form-element__help" style={{ marginTop: 8 }}>
          Median ROI = e^{config.priorROI.mean} = {Math.exp(config.priorROI.mean).toFixed(2)}.
          Higher std = less informative prior (more data-driven).
        </div>
      </Section>

      {/* External Factors & Controls */}
      <Section icon={CloudLightning} color="#fe9339" title="External Factors & Controls"
        badge={
          <span style={{
            fontSize: 12, fontWeight: 600, color: enabledFactors > 0 ? '#2e844a' : '#706e6b',
            background: enabledFactors > 0 ? '#e6f7ec' : '#f3f3f3',
            padding: '4px 12px', borderRadius: 12,
          }}>
            {enabledFactors}/{totalFactors} enabled
          </span>
        }
      >
        <table className="slds-table" style={{ marginBottom: 0 }}>
          <thead>
            <tr><th>Factor</th><th>Description</th><th style={{ width: 80, textAlign: 'center' }}>Status</th></tr>
          </thead>
          <tbody>
            {[
              { key: 'seasonality', label: 'Seasonality', desc: 'Auto-captured by time-varying intercept (knots)' },
              { key: 'holidays', label: 'Holiday Effects', desc: 'Black Friday, Christmas, etc. as dummy variables' },
              { key: 'gqv', label: 'Google Query Volume (GQV)', desc: 'Organic search demand via MMM Data Platform' },
              { key: 'competitorActivity', label: 'Competitor Activity', desc: 'Competitor spend/promotions as control variables' },
              { key: 'macroEconomic', label: 'Macroeconomic Indicators', desc: 'CPI, unemployment rate, consumer confidence' },
              { key: 'weather', label: 'Weather Data', desc: 'Temperature, precipitation by geo region' },
            ].map((f) => (
              <tr key={f.key}>
                <td style={{ fontWeight: 600 }}>{f.label}</td>
                <td style={{ color: '#706e6b', fontSize: 12 }}>{f.desc}</td>
                <td style={{ textAlign: 'center' }}>
                  <label className="slds-checkbox-toggle" style={{ marginBottom: 0, justifyContent: 'center' }}>
                    <input type="checkbox" checked={config.externalFactors[f.key]} onChange={(e) => updateFactors({ [f.key]: e.target.checked })} />
                    <div className="slds-checkbox-toggle__track" />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Budget Optimization Settings */}
      <Section icon={BarChart3} color="#fe9339" title="Budget Optimization Settings"
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label">Min Spend Shift</label>
              <input className="slds-input" type="number" step={0.1} min={0} max={1} value={config.budgetOptimization.spendConstraintLower} onChange={(e) => updateBudget({ spendConstraintLower: parseFloat(e.target.value) })} />
              <div className="slds-form-element__help">e.g., 0.5 = min 50% of current</div>
            </div>
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label">Max Spend Shift</label>
              <input className="slds-input" type="number" step={0.1} min={1} value={config.budgetOptimization.spendConstraintUpper} onChange={(e) => updateBudget({ spendConstraintUpper: parseFloat(e.target.value) })} />
              <div className="slds-form-element__help">e.g., 2.0 = max 200% of current</div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
