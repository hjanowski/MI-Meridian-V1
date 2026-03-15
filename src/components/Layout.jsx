import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, Bell, Settings as SettingsIcon, HelpCircle, Plus, Bookmark,
  ChevronDown, ChevronRight, ExternalLink, Bot,
} from 'lucide-react';

const MERIDIAN_ITEMS = [
  { key: 'pipeline', label: 'Data Ingestion - Admin' },
  { key: 'config', label: 'Configuration' },
  { key: 'training', label: 'Model Data Feed' },
  { key: 'budget', label: 'Budget Optimization' },
  { key: 'dashboards', label: 'Meridian Dashboards' },
];

const NAV_TABS = ['Home', 'Goals', 'Data Management', 'Marketing Analytics', 'Segment Intelligence'];

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F3F3F3' }}>

      {/* ═══ TOP NAVIGATION BAR (white, 48px) ═══ */}
      <header className="slds-global-header">
        {/* SF Cloud Logo */}
        <div className="slds-global-header__logo">
          <svg width="44" height="30" viewBox="0 0 23 15" style={{ flexShrink: 0 }}>
            <path d="M9.5 1.3C10.3.5 11.4 0 12.6 0c1.6 0 3 .8 3.7 2.1.7-.3 1.4-.4 2.2-.4 2.6 0 4.7 2.2 4.7 4.8s-2.1 4.8-4.7 4.8c-.3 0-.6 0-.9-.1-.6 1.3-2 2.2-3.5 2.2-.6 0-1.1-.1-1.6-.4-.6 1.2-1.9 2-3.4 2-1.4 0-2.5-.7-3.2-1.7-.3.1-.6.1-.9.1C2.1 13.4 0 11.2 0 8.6 0 6.8 1 5.2 2.5 4.4 2.3 4 2.2 3.5 2.2 2.9 2.2 1.3 3.6 0 5.3 0c1 0 1.9.5 2.5 1.2l1.7.1z" fill="#009CDB"/>
          </svg>
        </div>

        {/* Centered search bar (pill-shaped) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="slds-global-header__search">
            <Search size={14} color="#706E6B" />
            <input type="text" placeholder="Search..." />
          </div>
        </div>

        {/* Right icon cluster */}
        <div className="slds-global-header__icons">
          <Bot size={18} />
          <Bookmark size={18} />
          <Plus size={18} />
          <Bell size={18} />
          <HelpCircle size={18} />
          <SettingsIcon size={18} />
          <div className="slds-global-header__avatar">MI</div>
        </div>
      </header>

      {/* ═══ NAV TABS BAR (white, 40px) ═══ */}
      <nav className="slds-global-tabs">
        {/* Waffle + App Name */}
        <div className="slds-global-tabs__app-name">
          <svg width="20" height="20" viewBox="0 0 16 16" style={{ cursor: 'pointer', flexShrink: 0 }}>
            <circle cx="3" cy="3" r="1.8" fill="#706E6B"/>
            <circle cx="8" cy="3" r="1.8" fill="#706E6B"/>
            <circle cx="13" cy="3" r="1.8" fill="#706E6B"/>
            <circle cx="3" cy="8" r="1.8" fill="#706E6B"/>
            <circle cx="8" cy="8" r="1.8" fill="#706E6B"/>
            <circle cx="13" cy="8" r="1.8" fill="#706E6B"/>
            <circle cx="3" cy="13" r="1.8" fill="#706E6B"/>
            <circle cx="8" cy="13" r="1.8" fill="#706E6B"/>
            <circle cx="13" cy="13" r="1.8" fill="#706E6B"/>
          </svg>
          <span>Marketing Intelligence</span>
        </div>

        {/* Tab items */}
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            className={`slds-global-tabs__item ${tab === 'Data Management' ? 'slds-global-tabs__item--active' : ''}`}
          >
            {tab}
          </button>
        ))}

        {/* Reports with dropdown */}
        <button className="slds-global-tabs__item">
          Reports <ChevronDown size={11} />
        </button>

        {/* Recently Viewed (right-aligned) */}
        <button className="slds-global-tabs__recently-viewed">
          <span className="slds-global-tabs__pill">
            * Recently Viewed | Data Streams
          </span>
          <ChevronDown size={11} />
        </button>
      </nav>

      {/* ═══ BODY: SIDEBAR + CONTENT ═══ */}
      <div style={{ flex: 1, display: 'flex' }}>

        {/* ── LEFT SIDEBAR (190px, white) ── */}
        <aside className="slds-sidebar">
          <div className="slds-sidebar__section-label">Data Management</div>

          {/* Static items */}
          <button className="slds-sidebar__item" onClick={(e) => e.preventDefault()}>
            Data Pipelines
          </button>

          {/* Harmonization (expandable) */}
          <button
            className="slds-sidebar__expandable"
            onClick={() => setHarmonizationExpanded(!harmonizationExpanded)}
          >
            {harmonizationExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>Harmonization</span>
          </button>
          {harmonizationExpanded && (
            <div>
              <button className="slds-sidebar__item slds-sidebar__item--child" onClick={(e) => e.preventDefault()}>
                Data Enrichment
              </button>
              <button className="slds-sidebar__item slds-sidebar__item--child" onClick={(e) => e.preventDefault()}>
                Patterns
              </button>
            </div>
          )}

          <button className="slds-sidebar__item" onClick={(e) => e.preventDefault()}>
            Anchor Campaigns
          </button>
          <button className="slds-sidebar__item" onClick={(e) => e.preventDefault()}>
            Funnel-Based Attribution
          </button>
          <button className="slds-sidebar__item" onClick={(e) => e.preventDefault()}>
            Touch-Based Attribution
          </button>

          {/* ── MERIDIAN (expandable) ── */}
          <button
            className={`slds-sidebar__expandable ${isMeridianPage ? 'slds-sidebar__expandable--active' : ''}`}
            onClick={() => setMeridianExpanded(!meridianExpanded)}
          >
            {meridianExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>Meridian</span>
          </button>
          {meridianExpanded && (
            <div>
              {MERIDIAN_ITEMS.map((item) => {
                const isActive = state.currentStep === item.key;
                const enabled = canNavigate(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => enabled && dispatch({ type: 'SET_STEP', payload: item.key })}
                    className={[
                      'slds-sidebar__item',
                      'slds-sidebar__item--child',
                      isActive ? 'slds-sidebar__item--active' : '',
                      !enabled ? 'slds-sidebar__item--disabled' : '',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider + Semantic Data Model */}
          <div className="slds-sidebar__divider" />
          <div className="slds-sidebar__external">
            <span>Semantic Data Model</span>
            <ExternalLink size={12} color="#706E6B" style={{ cursor: 'pointer' }} />
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
