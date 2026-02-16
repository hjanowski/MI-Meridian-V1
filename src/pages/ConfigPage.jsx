import { useApp } from '../context/AppContext';
import { Settings, Database, CloudLightning, Info, ArrowRight } from 'lucide-react';

export default function ConfigPage() {
  const { state, dispatch } = useApp();
  const { config } = state;

  const updateConfig = (updates) => dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  const updateFactors = (updates) => dispatch({ type: 'UPDATE_EXTERNAL_FACTORS', payload: updates });
  const updateBudget = (updates) => dispatch({ type: 'UPDATE_BUDGET_CONFIG', payload: updates });

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="slds-text-heading_large">Model Configuration</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 4 }}>Configure Meridian MMM parameters, connect data sources, and set external factors</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 1st Party Data Connection */}
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

        {/* Time-varying Intercept */}
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
        <div className="slds-card">
          <div className="slds-card__header">
            <h2 className="slds-card__header-title">Budget Optimization Settings</h2>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
        <button className="slds-button slds-button_neutral" onClick={() => dispatch({ type: 'SET_STEP', payload: 'pipeline' })}>
          Back to Pipeline
        </button>
        <button
          className="slds-button slds-button_brand"
          disabled={!state.validationResults?.canProceed}
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'training' })}
        >
          Proceed to Model Training <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
