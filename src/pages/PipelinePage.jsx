import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateSyntheticData, validateData } from '../data/dataGenerator';
import { Database, ChevronRight, CheckCircle, AlertTriangle, XCircle, ArrowRight, ArrowLeft, Loader, CloudLightning, Table2, FileSpreadsheet } from 'lucide-react';

const WIZARD_STEPS = ['Source', 'Data Profile', 'Preview', 'Validation'];

const DATA_PROFILES = [
  {
    key: 'fully_compliant', label: 'Fully Compliant',
    badge: 'success', badgeLabel: 'Recommended',
    desc: '3 years of weekly data across 15 DMAs with 8 media channels. Meets all Meridian requirements.',
    details: ['156 weeks of history (Jan 2022 - Dec 2024)', '15 DMAs (top US markets by population)', '8 media channels with spend + impressions', 'Population data per DMA', 'Revenue KPI with natural seasonality'],
  },
  {
    key: 'partially_compliant', label: 'Partially Compliant',
    badge: 'warning', badgeLabel: 'Has Warnings',
    desc: '1.5 years of data with only 3 DMAs. Below recommended thresholds but can still run.',
    details: ['78 weeks of history (Jul 2024 - Dec 2025)', 'Only 3 DMAs (below recommended 50+)', '8 media channels', 'Will trigger data sufficiency warnings', 'Model will run with wider credible intervals'],
  },
  {
    key: 'non_compliant', label: 'Non-Compliant',
    badge: 'error', badgeLabel: 'Will Fail',
    desc: '6 months of national-level data only. Does not meet minimum Meridian requirements.',
    details: ['26 weeks only (needs 156 for national)', 'National level only (no geo breakdown)', '8 media channels', 'Will trigger blocking errors', 'Model cannot proceed with this data'],
  },
];

export default function PipelinePage() {
  const { state, dispatch } = useApp();
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pipelineName, setPipelineName] = useState('MI_Meridian_Pipeline_01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [validation, setValidation] = useState(null);

  const handleGenerateData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const data = generateSyntheticData(selectedProfile);
      setGeneratedData(data);
      setIsProcessing(false);
      setWizardStep(2);
    }, 1500);
  };

  const handleValidate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const results = validateData(generatedData);
      setValidation(results);
      dispatch({ type: 'SET_PIPELINE_DATA', payload: generatedData });
      dispatch({ type: 'SET_COMPLIANCE_LEVEL', payload: selectedProfile });
      dispatch({ type: 'SET_PIPELINE_NAME', payload: pipelineName });
      dispatch({ type: 'SET_VALIDATION_RESULTS', payload: results });
      setIsProcessing(false);
      setWizardStep(3);
    }, 2000);
  };

  const handleProceed = () => {
    dispatch({ type: 'SET_STEP', payload: 'config' });
  };

  return (
    <div className="animate-slide-in">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="slds-text-heading_large">Data Pipelines</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 4 }}>Create a new pipeline to ingest marketing data for Meridian analysis</p>
        </div>
        <button className="slds-button slds-button_brand" onClick={() => { setWizardStep(0); setGeneratedData(null); setValidation(null); }}>
          <Database size={16} /> New Pipeline
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, padding: '0 20px' }}>
        {WIZARD_STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < WIZARD_STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: i < wizardStep ? '#2e844a' : i === wizardStep ? '#0176d3' : '#e5e5e5',
                color: i <= wizardStep ? 'white' : '#706e6b',
              }}>
                {i < wizardStep ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: i <= wizardStep ? '#181818' : '#706e6b' }}>{step}</span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < wizardStep ? '#2e844a' : '#e5e5e5', margin: '0 12px', marginBottom: 20 }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Source */}
      {wizardStep === 0 && (
        <div className="slds-card animate-fade-in">
          <h2 className="slds-text-heading_medium" style={{ marginBottom: 16 }}>New Pipeline</h2>
          <div className="slds-form-element">
            <label className="slds-form-element__label">Pipeline Name</label>
            <input className="slds-input" value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} placeholder="Enter pipeline name..." />
          </div>
          <div className="slds-form-element">
            <label className="slds-form-element__label">Source Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div style={{
                border: '2px solid #0176d3', borderRadius: 8, padding: 16, cursor: 'pointer', background: '#e5f5fe',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CloudLightning size={20} color="#0176d3" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Synthetic Data Generator</span>
                </div>
                <p style={{ fontSize: 12, color: '#706e6b' }}>Generate realistic marketing mix data for Meridian analysis with configurable compliance levels.</p>
              </div>
              <div style={{
                border: '2px solid #e5e5e5', borderRadius: 8, padding: 16, opacity: 0.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FileSpreadsheet size={20} color="#706e6b" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#706e6b' }}>CSV / File Upload</span>
                </div>
                <p style={{ fontSize: 12, color: '#706e6b' }}>Upload your own marketing data files. (Coming soon)</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="slds-button slds-button_brand" onClick={() => setWizardStep(1)} disabled={!pipelineName}>
              Next: Select Data Profile <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Data Profile Selection */}
      {wizardStep === 1 && (
        <div className="animate-fade-in">
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h2 className="slds-text-heading_medium" style={{ marginBottom: 4 }}>Select Data Profile</h2>
            <p style={{ fontSize: 13, color: '#706e6b' }}>
              Choose a synthetic data profile to demonstrate Meridian&apos;s data validation and compliance requirements.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {DATA_PROFILES.map((p) => (
              <div key={p.key} className="slds-card" onClick={() => setSelectedProfile(p.key)} style={{
                cursor: 'pointer', borderColor: selectedProfile === p.key ? '#0176d3' : undefined,
                borderWidth: selectedProfile === p.key ? 2 : 1,
                boxShadow: selectedProfile === p.key ? '0 0 0 1px #0176d3' : undefined,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</h3>
                  <span className={`slds-badge slds-badge_${p.badge}`}>{p.badgeLabel}</span>
                </div>
                <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 12 }}>{p.desc}</p>
                <ul style={{ fontSize: 12, color: '#706e6b', lineHeight: 1.8, paddingLeft: 16 }}>
                  {p.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="slds-button slds-button_neutral" onClick={() => setWizardStep(0)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button className="slds-button slds-button_brand" onClick={handleGenerateData} disabled={!selectedProfile || isProcessing}>
              {isProcessing ? <><Loader size={14} className="animate-pulse" /> Generating Data...</> : <>Generate Data <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {wizardStep === 2 && generatedData && (
        <div className="animate-fade-in">
          <div className="slds-card">
            <h2 className="slds-text-heading_medium" style={{ marginBottom: 16 }}>Data Preview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Rows', value: generatedData.summary.totalRows.toLocaleString() },
                { label: 'Date Range', value: generatedData.summary.dateRange },
                { label: 'Geos', value: generatedData.numGeos },
                { label: 'Channels', value: generatedData.numChannels },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f3f3f3', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Sample table */}
            <h3 className="slds-text-heading_small" style={{ marginBottom: 8 }}>Sample Records</h3>
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table className="slds-table">
                <thead>
                  <tr>
                    <th>Time</th><th>Geo</th><th>KPI (Revenue)</th><th>Population</th>
                    {generatedData.channels.slice(0, 4).map((ch) => <th key={ch.key}>{ch.name} Spend</th>)}
                  </tr>
                </thead>
                <tbody>
                  {generatedData.rows.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      <td>{row.time}</td>
                      <td>{row.geoName}</td>
                      <td>${row.kpi.toLocaleString()}</td>
                      <td>{row.population.toLocaleString()}</td>
                      {generatedData.channels.slice(0, 4).map((ch) => (
                        <td key={ch.key}>${row[ch.key]?.spend?.toLocaleString() || '0'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Channel summary */}
            <h3 className="slds-text-heading_small" style={{ marginBottom: 8, marginTop: 16 }}>Channel Summary</h3>
            <table className="slds-table">
              <thead>
                <tr><th>Channel</th><th>Total Spend</th><th>Total Impressions</th><th>Avg CPM</th></tr>
              </thead>
              <tbody>
                {generatedData.channels.map((ch) => (
                  <tr key={ch.key}>
                    <td style={{ fontWeight: 600 }}>{ch.name}</td>
                    <td>${Math.round(ch.stats.totalSpend).toLocaleString()}</td>
                    <td>{Math.round(ch.stats.totalImpressions).toLocaleString()}</td>
                    <td>${ch.avgCPM}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="slds-button slds-button_neutral" onClick={() => setWizardStep(1)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button className="slds-button slds-button_brand" onClick={handleValidate} disabled={isProcessing}>
              {isProcessing ? <><Loader size={14} className="animate-pulse" /> Validating...</> : <>Run Meridian Validation <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validation Results */}
      {wizardStep === 3 && validation && (
        <div className="animate-fade-in">
          {/* Overall status */}
          <div className={`slds-notify slds-notify_${validation.overallStatus === 'fully_compliant' ? 'success' : validation.overallStatus === 'partially_compliant' ? 'warning' : 'error'}`}>
            {validation.overallStatus === 'fully_compliant' && <CheckCircle size={20} color="#2e844a" />}
            {validation.overallStatus === 'partially_compliant' && <AlertTriangle size={20} color="#8c4b02" />}
            {validation.overallStatus === 'non_compliant' && <XCircle size={20} color="#ea001e" />}
            <div>
              <strong>
                {validation.overallStatus === 'fully_compliant' && 'Data Validation Passed — Fully Compliant'}
                {validation.overallStatus === 'partially_compliant' && 'Data Validation: Partially Compliant — Warnings Found'}
                {validation.overallStatus === 'non_compliant' && 'Data Validation Failed — Blocking Errors Found'}
              </strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {validation.passedChecks}/{validation.totalChecks} checks passed.
                {validation.errors.length > 0 && ` ${validation.errors.length} error(s) must be resolved before proceeding.`}
                {validation.warnings.length > 0 && ` ${validation.warnings.length} warning(s) — model can proceed but results may be less reliable.`}
              </div>
            </div>
          </div>

          {/* Validation summary */}
          <div className="slds-card">
            <h2 className="slds-text-heading_medium" style={{ marginBottom: 16 }}>Meridian Data Validation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Data Points', value: validation.summary.dataPoints.toLocaleString() },
                { label: 'Model Effects', value: '~' + validation.summary.effects },
                { label: 'Data/Effects Ratio', value: validation.summary.ratio + ':1' },
                { label: 'Time Span', value: validation.summary.timeSpan },
                { label: 'Geo Regions', value: validation.summary.geoCount },
                { label: 'Media Channels', value: validation.summary.channelCount },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f3f3f3', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Issues */}
            {validation.issues.length > 0 && (
              <>
                <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Issues Found</h3>
                {validation.issues.map((issue, i) => (
                  <div key={i} className={`slds-notify slds-notify_${issue.severity === 'error' ? 'error' : 'warning'}`} style={{ marginBottom: 8 }}>
                    {issue.severity === 'error' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
                    <div>
                      <strong>{issue.title}</strong>
                      <span className={`slds-badge slds-badge_${issue.severity === 'error' ? 'error' : 'warning'}`} style={{ marginLeft: 8 }}>
                        {issue.code}
                      </span>
                      <div style={{ fontSize: 12, marginTop: 4 }}>{issue.detail}</div>
                      <div style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic', opacity: 0.8 }}>
                        Recommendation: {issue.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {validation.issues.length === 0 && (
              <div className="slds-notify slds-notify_success">
                <CheckCircle size={18} />
                <div>
                  <strong>All validation checks passed</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Your data meets all Meridian requirements. You can proceed to model configuration.</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="slds-button slds-button_neutral" onClick={() => setWizardStep(2)}>
              <ArrowLeft size={14} /> Back to Preview
            </button>
            {validation.canProceed ? (
              <button className="slds-button slds-button_brand" onClick={handleProceed}>
                Continue to Configuration <ArrowRight size={14} />
              </button>
            ) : (
              <button className="slds-button slds-button_neutral" onClick={() => { setWizardStep(1); setGeneratedData(null); setValidation(null); }}>
                Choose Different Data Profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
