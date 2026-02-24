import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateModelResults } from '../data/dataGenerator';
import { Zap, CheckCircle, XCircle, Loader, Play, RotateCcw, ArrowRight } from 'lucide-react';

const TRAINING_PHASES = [
  { name: 'Initializing model specification...', duration: 800 },
  { name: 'Loading and scaling data tensors...', duration: 600 },
  { name: 'Building Bayesian graph (TensorFlow Probability)...', duration: 1000 },
  { name: 'Compiling MCMC sampler (4 chains)...', duration: 700 },
  { name: 'Warmup phase (500 steps)...', duration: 2500 },
  { name: 'Sampling posterior (500 steps)...', duration: 3000 },
  { name: 'Computing posterior summaries...', duration: 800 },
  { name: 'Calculating ROI and response curves...', duration: 600 },
  { name: 'Running model diagnostics...', duration: 500 },
  { name: 'Generating visualizations...', duration: 400 },
];

export default function TrainingPage() {
  const { state, dispatch } = useApp();
  const [phase, setPhase] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const logRef = useRef(null);

  const startTraining = () => {
    setIsRunning(true);
    setPhase(0);
    setProgress(0);
    setLog([{ time: new Date().toLocaleTimeString(), msg: 'Training started', type: 'info' }]);
    dispatch({ type: 'SET_TRAINING_STATUS', payload: 'running' });
  };

  useEffect(() => {
    if (phase < 0 || phase >= TRAINING_PHASES.length) return;

    const phaseInfo = TRAINING_PHASES[phase];
    setLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg: phaseInfo.name, type: 'step' }]);

    const progressPerPhase = 100 / TRAINING_PHASES.length;
    const startProgress = phase * progressPerPhase;
    const endProgress = (phase + 1) * progressPerPhase;

    const steps = 20;
    const stepDuration = phaseInfo.duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setProgress(startProgress + (step / steps) * (endProgress - startProgress));
      if (step >= steps) {
        clearInterval(interval);
        if (phase < TRAINING_PHASES.length - 1) {
          setPhase(phase + 1);
        } else {
          // Training complete
          const results = generateModelResults(state.pipelineData, state.config);
          setDiagnostics(results.diagnostics);
          dispatch({ type: 'SET_DASHBOARD_DATA', payload: results });
          dispatch({ type: 'SET_MODEL_DIAGNOSTICS', payload: results.diagnostics });
          dispatch({ type: 'SET_TRAINING_STATUS', payload: 'complete' });
          dispatch({ type: 'SET_TRAINING_PROGRESS', payload: 100 });
          setIsRunning(false);
          setLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg: 'Training completed successfully!', type: 'success' }]);
        }
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const isComplete = state.trainingStatus === 'complete';

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="slds-text-heading_large">Model Data Feed</h1>
          <p style={{ fontSize: 13, color: '#706e6b', marginTop: 4 }}>
            Run Bayesian MCMC inference via Google Meridian to estimate media effects
          </p>
        </div>
        {!isRunning && !isComplete && (
          <button className="slds-button slds-button_brand" onClick={startTraining}>
            <Play size={16} /> Start Training
          </button>
        )}
        {isComplete && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="slds-button slds-button_neutral" onClick={() => { setPhase(-1); setProgress(0); setLog([]); setDiagnostics(null); dispatch({ type: 'SET_TRAINING_STATUS', payload: 'idle' }); }}>
              <RotateCcw size={14} /> Re-train
            </button>
            <button className="slds-button slds-button_brand" onClick={() => dispatch({ type: 'SET_STEP', payload: 'dashboards' })}>
              View Dashboards <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Progress & Log */}
        <div className="slds-card">
          <h2 className="slds-text-heading_medium" style={{ marginBottom: 16 }}>Training Progress</h2>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>{phase >= 0 && phase < TRAINING_PHASES.length ? TRAINING_PHASES[phase].name : isComplete ? 'Complete' : 'Ready to start'}</span>
              <span style={{ fontWeight: 600 }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: '#e5e5e5', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 0.3s ease',
                width: progress + '%',
                background: isComplete ? '#2e844a' : 'linear-gradient(90deg, #0176d3, #1b96ff)',
              }} />
            </div>
          </div>

          {/* Training configuration summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Chains', value: '4' },
              { label: 'Warmup', value: '500 steps' },
              { label: 'Samples', value: '500 steps' },
              { label: 'Adstock', value: state.config.adstockDecay },
            ].map((s, i) => (
              <div key={i} style={{ background: '#f3f3f3', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Log */}
          <div ref={logRef} style={{
            background: '#1a1a2e', borderRadius: 8, padding: 16, maxHeight: 300, overflowY: 'auto',
            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8,
          }}>
            {log.length === 0 && (
              <div style={{ color: '#666' }}>Click &quot;Start Training&quot; to begin MCMC inference...</div>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{
                color: entry.type === 'success' ? '#2e844a' : entry.type === 'error' ? '#ea001e' : entry.type === 'step' ? '#1b96ff' : '#999',
              }}>
                <span style={{ color: '#555' }}>[{entry.time}]</span> {entry.msg}
              </div>
            ))}
            {isRunning && <span className="animate-pulse" style={{ color: '#1b96ff' }}>|</span>}
          </div>
        </div>

        {/* Diagnostics */}
        <div className="slds-card">
          <h2 className="slds-text-heading_medium" style={{ marginBottom: 16 }}>Model Diagnostics</h2>
          {!diagnostics && !isRunning && (
            <div style={{ textAlign: 'center', padding: 40, color: '#706e6b' }}>
              <Zap size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Diagnostics will appear after training completes.</p>
            </div>
          )}
          {isRunning && !diagnostics && (
            <div style={{ textAlign: 'center', padding: 40, color: '#706e6b' }}>
              <Loader size={32} className="animate-pulse" style={{ marginBottom: 12 }} />
              <p>Training in progress...</p>
            </div>
          )}
          {diagnostics && (
            <div className="animate-fade-in">
              {[
                { label: 'R-hat (convergence)', value: diagnostics.rHat, pass: diagnostics.rHat < 1.1, detail: '< 1.1 required' },
                { label: 'Effective Sample Size', value: diagnostics.effectiveSampleSize, pass: diagnostics.effectiveSampleSize > 400, detail: '> 400 recommended' },
                { label: 'Posterior Predictive P-value', value: diagnostics.ppp, pass: diagnostics.ppp > 0.05 && diagnostics.ppp < 0.95, detail: 'Between 0.05-0.95' },
                { label: 'ROI Plausibility', value: diagnostics.roiPlausibility, pass: true },
                { label: 'Prior→Posterior Shift', value: diagnostics.priorPosteriorShift, pass: true },
                { label: 'Overall Status', value: diagnostics.overallStatus, pass: diagnostics.overallStatus === 'PASS' },
              ].map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #e5e5e5',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</div>
                    {d.detail && <div style={{ fontSize: 11, color: '#706e6b' }}>{d.detail}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{typeof d.value === 'number' ? d.value.toFixed ? d.value.toFixed(3) : d.value : d.value}</span>
                    {d.pass ? <CheckCircle size={16} color="#2e844a" /> : <XCircle size={16} color="#ea001e" />}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 12, color: '#706e6b' }}>
                Training time: {diagnostics.totalTime} | {diagnostics.chains} chains x {diagnostics.samplingSteps} samples
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
