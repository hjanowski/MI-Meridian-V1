import { useApp } from '../context/AppContext';
import { Database, Settings, LayoutDashboard, ArrowRight, Zap, BarChart3, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { state, dispatch } = useApp();

  const steps = [
    {
      icon: Database, title: 'Data Pipelines', desc: 'Ingest and validate marketing data for Meridian MMM analysis',
      action: () => dispatch({ type: 'SET_STEP', payload: 'pipeline' }),
      status: state.pipelineData ? 'complete' : 'ready',
    },
    {
      icon: Settings, title: 'Configuration', desc: 'Configure model parameters, priors, and connect 1st party data',
      action: () => dispatch({ type: 'SET_STEP', payload: 'config' }),
      status: state.pipelineData ? (state.validationResults?.canProceed ? 'ready' : 'blocked') : 'locked',
    },
    {
      icon: Zap, title: 'Model Training', desc: 'Run Bayesian inference with MCMC sampling via Meridian',
      action: () => dispatch({ type: 'SET_STEP', payload: 'training' }),
      status: state.validationResults?.canProceed ? 'ready' : 'locked',
    },
    {
      icon: LayoutDashboard, title: 'Dashboards & Optimization', desc: 'View results: ROI, response curves, budget optimization',
      action: () => dispatch({ type: 'SET_STEP', payload: 'dashboards' }),
      status: state.trainingStatus === 'complete' ? 'ready' : 'locked',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #16325c 0%, #0176d3 100%)',
        borderRadius: 8, padding: '40px 48px', color: 'white', marginBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <BarChart3 size={32} />
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Marketing Intelligence</h1>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 400, opacity: 0.9, marginBottom: 16 }}>
          Meridian MMM Integration
        </h2>
        <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 600, lineHeight: 1.6 }}>
          Leverage Google&apos;s open-source Marketing Mix Model to measure cross-channel media effectiveness,
          optimize budget allocation, and connect insights with Salesforce 1st party data from Data Cloud.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isLocked = step.status === 'locked';
          const isComplete = step.status === 'complete';
          return (
            <div key={i} className="slds-card" style={{
              cursor: isLocked ? 'default' : 'pointer',
              opacity: isLocked ? 0.5 : 1,
              borderLeft: isComplete ? '4px solid #2e844a' : '4px solid transparent',
              transition: 'all 0.2s',
            }}
            onClick={isLocked ? undefined : step.action}
            onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: isComplete ? '#e6f7ec' : '#e5f5fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={isComplete ? '#2e844a' : '#0176d3'} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#706e6b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Step {i + 1}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{step.title}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#706e6b', lineHeight: 1.5, marginBottom: 12 }}>
                {step.desc}
              </p>
              {!isLocked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0176d3', fontSize: 13, fontWeight: 600 }}>
                  {isComplete ? 'Completed' : 'Get Started'} <ArrowRight size={14} />
                </div>
              )}
              {isComplete && <span className="slds-badge slds-badge_success" style={{ marginTop: 4 }}>Done</span>}
            </div>
          );
        })}
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div className="slds-card">
          <h3 className="slds-text-heading_small" style={{ marginBottom: 8 }}>About Google Meridian</h3>
          <ul style={{ fontSize: 13, color: '#706e6b', lineHeight: 1.8, paddingLeft: 16 }}>
            <li>Open-source Bayesian Marketing Mix Model (MMM)</li>
            <li>Hierarchical geo-level modeling for tighter estimates</li>
            <li>Built-in adstock (geometric/binomial) + Hill saturation</li>
            <li>ROI priors calibrated with incrementality experiments</li>
            <li>Budget optimization with fixed and flexible scenarios</li>
          </ul>
        </div>
        <div className="slds-card">
          <h3 className="slds-text-heading_small" style={{ marginBottom: 8 }}>Data Requirements</h3>
          <ul style={{ fontSize: 13, color: '#706e6b', lineHeight: 1.8, paddingLeft: 16 }}>
            <li>Minimum 2 years weekly data (geo) or 3 years (national)</li>
            <li>Geo-level breakdown recommended (50-100 DMAs)</li>
            <li>Media spend + impressions per channel</li>
            <li>KPI data (revenue or conversions)</li>
            <li>Population data per geographic region</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
