import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Bell, Settings as SettingsIcon, HelpCircle, Plus, Star, Cloud, Grid3X3, ChevronDown, ChevronRight, ExternalLink, SquarePlus } from 'lucide-react';

// Meridian sub-items mapping to app pages
const MERIDIAN_ITEMS = [
  { key: 'pipeline', label: 'Data Ingestion - Admin' },
  { key: 'config', label: 'Configuration' },
  { key: 'training', label: 'Model Data Feed' },
  { key: 'budget', label: 'Budget Optimization' },
  { key: 'dashboards', label: 'Meridian Dashboards' },
];

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const [meridianExpanded, setMeridianExpanded] = useState(true);
  const [harmonizationExpanded, setHarmonizationExpanded] = useState(false);

  const canNavigate = (key) => {
    if (key === 'home') return true;
    if (key === 'pipeline') return true;
    if (key === 'config') return !!state.pipelineData;
    if (key === 'training') return !!state.pipelineData && !!state.validationResults?.canProceed;
    if (key === 'budget') return !!state.pipelineData && !!state.validationResults?.canProceed;
    if (key === 'dashboards') return state.trainingStatus === 'complete';
    return false;
  };

  const isMeridianPage = MERIDIAN_ITEMS.some(item => item.key === state.currentStep);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f3f3f3' }}>
      {/* ═══ ROW 1: SALESFORCE GLOBAL HEADER ═══ */}
      <header style={{
        height: 40, background: '#032D60', display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 12, flexShrink: 0,
      }}>
        {/* SF Cloud Logo */}
        <svg width="22" height="15" viewBox="0 0 23 15" style={{ flexShrink: 0 }}>
          <path d="M9.5 1.3C10.3.5 11.4 0 12.6 0c1.6 0 3 .8 3.7 2.1.7-.3 1.4-.4 2.2-.4 2.6 0 4.7 2.2 4.7 4.8s-2.1 4.8-4.7 4.8c-.3 0-.6 0-.9-.1-.6 1.3-2 2.2-3.5 2.2-.6 0-1.1-.1-1.6-.4-.6 1.2-1.9 2-3.4 2-1.4 0-2.5-.7-3.2-1.7-.3.1-.6.1-.9.1C2.1 13.4 0 11.2 0 8.6 0 6.8 1 5.2 2.5 4.4 2.3 4 2.2 3.5 2.2 2.9 2.2 1.3 3.6 0 5.3 0c1 0 1.9.5 2.5 1.2l1.7.1z" fill="#00A1E0"/>
        </svg>

        {/* Search bar (centered) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 4, padding: '3px 12px', width: '100%', maxWidth: 380,
          }}>
            <Search size={13} color="rgba(255,255,255,0.6)" />
            <input type="text" placeholder="Search..." style={{
              background: 'none', border: 'none', outline: 'none', color: 'white',
              fontSize: 12, width: '100%', fontFamily: 'inherit',
            }} />
          </div>
        </div>

        {/* Right utility icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.75)' }}>
          <Star size={16} style={{ cursor: 'pointer' }} />
          <Plus size={16} style={{ cursor: 'pointer' }} />
          <Cloud size={16} style={{ cursor: 'pointer' }} />
          <HelpCircle size={16} style={{ cursor: 'pointer' }} />
          <SettingsIcon size={16} style={{ cursor: 'pointer' }} />
          <Bell size={16} style={{ cursor: 'pointer' }} />
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#1b96ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}>MI</div>
        </div>
      </header>

      {/* ═══ ROW 2: APP NAV BAR (white) ═══ */}
      <nav style={{
        height: 40, background: 'white', borderBottom: '1px solid #d8d8d8',
        display: 'flex', alignItems: 'stretch', padding: '0 12px', flexShrink: 0,
      }}>
        {/* Waffle + App Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
          <Grid3X3 size={16} color="#706e6b" style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#181818', whiteSpace: 'nowrap' }}>Marketing Intelligence</span>
        </div>

        {/* Nav tabs */}
        {['Home', 'Goals', 'Data Management', 'Marketing Analytics', 'Segment Intelligence'].map((tab) => {
          const isActive = tab === 'Data Management';
          return (
            <button key={tab} style={{
              padding: '0 14px', fontSize: 13, fontWeight: isActive ? 700 : 400,
              color: isActive ? '#0176d3' : '#444', cursor: 'pointer',
              border: 'none', background: 'none',
              borderBottom: isActive ? '3px solid #0176d3' : '3px solid transparent',
              marginBottom: -1, fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              {tab}
            </button>
          );
        })}
        <button style={{
          padding: '0 14px', fontSize: 13, fontWeight: 400, color: '#444',
          cursor: 'pointer', border: 'none', background: 'none',
          borderBottom: '3px solid transparent', marginBottom: -1,
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
        }}>
          Reports <ChevronDown size={12} />
        </button>

        {/* Recently Viewed tab */}
        <div style={{ flex: 1 }} />
        <button style={{
          padding: '0 14px', fontSize: 12, fontWeight: 400, color: '#706e6b',
          cursor: 'pointer', border: 'none', background: 'none',
          borderBottom: '3px solid transparent', marginBottom: -1,
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
        }}>
          * Recently Viewed | Data Streams <ChevronDown size={12} />
        </button>
      </nav>

      {/* ═══ MAIN LAYOUT: SIDEBAR + CONTENT ═══ */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* LEFT SIDEBAR */}
        <aside style={{
          width: 220, background: 'white', borderRight: '1px solid #d8d8d8',
          flexShrink: 0, padding: '20px 0', overflowY: 'auto',
        }}>
          {/* Section header */}
          <div style={{ padding: '0 20px 14px', fontSize: 14, fontWeight: 700, color: '#181818' }}>
            Data Management
          </div>

          {/* Static SF nav items */}
          <a href="#" onClick={(e) => e.preventDefault()} className="sf-sidebar-link">Data Pipelines</a>

          {/* Harmonization (expandable) */}
          <button
            onClick={() => setHarmonizationExpanded(!harmonizationExpanded)}
            className="sf-sidebar-expandable"
          >
            {harmonizationExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Harmonization</span>
          </button>
          {harmonizationExpanded && (
            <div style={{ paddingLeft: 20 }}>
              <a href="#" onClick={(e) => e.preventDefault()} className="sf-sidebar-link sf-sidebar-link--child">Data Enrichment</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="sf-sidebar-link sf-sidebar-link--child">Patterns</a>
            </div>
          )}

          <a href="#" onClick={(e) => e.preventDefault()} className="sf-sidebar-link">Anchor Campaigns</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="sf-sidebar-link">Funnel-Based Attribution</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="sf-sidebar-link">Touch-Based Attribution</a>

          {/* ── MERIDIAN (expandable) ── */}
          <button
            onClick={() => setMeridianExpanded(!meridianExpanded)}
            className={`sf-sidebar-expandable ${isMeridianPage ? 'sf-sidebar-expandable--active' : ''}`}
          >
            {meridianExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Meridian</span>
          </button>
          {meridianExpanded && (
            <div style={{ paddingLeft: 20 }}>
              {MERIDIAN_ITEMS.map((item) => {
                const isActive = state.currentStep === item.key;
                const enabled = canNavigate(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => enabled && dispatch({ type: 'SET_STEP', payload: item.key })}
                    className={`sf-sidebar-link sf-sidebar-link--child ${isActive ? 'sf-sidebar-link--active' : ''} ${!enabled ? 'sf-sidebar-link--disabled' : ''}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom separator + Semantic Data Model */}
          <div style={{ borderTop: '1px solid #e5e5e5', margin: '16px 0' }} />
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#181818' }}>Semantic Data Model</span>
            <SquarePlus size={14} color="#0176d3" style={{ cursor: 'pointer' }} />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
