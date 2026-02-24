import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Database, Settings, LayoutDashboard, Home, ChevronRight, Menu, X, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home', label: 'Admin Console', icon: Home },
  { key: 'pipeline', label: 'Data Ingestion', icon: Database },
  { key: 'config', label: 'MI Configuration', icon: Settings },
  { key: 'training', label: 'Model Data Feed', icon: Zap },
  { key: 'dashboards', label: 'Dashboards', icon: LayoutDashboard },
];

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const canNavigate = (key) => {
    if (key === 'home') return true;
    if (key === 'pipeline') return true;
    if (key === 'config') return !!state.pipelineData;
    if (key === 'training') return !!state.pipelineData && !!state.validationResults?.canProceed;
    if (key === 'dashboards') return state.trainingStatus === 'complete';
    return false;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 56, background: '#16325c', color: 'white',
        transition: 'width 0.2s ease', display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {/* Logo area */}
        <div style={{
          padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 12, minHeight: 56,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer',
            padding: 4, display: 'flex',
          }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>Marketing Intelligence</div>
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>Meridian Integration</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = state.currentStep === item.key;
            const enabled = canNavigate(item.key);
            return (
              <button
                key={item.key}
                onClick={() => enabled && dispatch({ type: 'SET_STEP', payload: item.key })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: sidebarOpen ? '10px 16px' : '10px 18px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: 'none', color: enabled ? 'white' : 'rgba(255,255,255,0.35)',
                  cursor: enabled ? 'pointer' : 'default', fontSize: 13, fontWeight: 500,
                  textAlign: 'left', transition: 'background 0.15s',
                  borderLeft: isActive ? '3px solid #1b96ff' : '3px solid transparent',
                }}
                onMouseEnter={(e) => { if (enabled && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, opacity: 0.5 }}>
            Powered by Google Meridian v1.5
          </div>
        )}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header bar */}
        <header style={{
          height: 48, background: 'white', borderBottom: '1px solid #e5e5e5',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 8,
        }}>
          <span style={{ fontSize: 12, color: '#706e6b' }}>Marketing Intelligence</span>
          <ChevronRight size={12} color="#706e6b" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#181818' }}>
            {NAV_ITEMS.find((n) => n.key === state.currentStep)?.label || 'Admin Console'}
          </span>
          <div style={{ flex: 1 }} />
          {state.pipelineName && (
            <span className="slds-badge slds-badge_info">{state.pipelineName}</span>
          )}
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
