import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Bell, Settings as SettingsIcon, HelpCircle, Plus, Star, ChevronDown, Cloud, Menu, Grid3X3 } from 'lucide-react';

// Pages that get the Salesforce-style left sidebar
const SF_PAGES = ['config', 'training', 'budget'];

// Top navigation tabs (Salesforce-style)
const TOP_TABS = [
  { key: 'home', label: 'Home' },
  { key: 'pipeline', label: 'Data Ingestion' },
  { key: 'config', label: 'MI Configuration' },
  { key: 'training', label: 'Model Data Feed' },
  { key: 'budget', label: 'Budget Optimization' },
  { key: 'dashboards', label: 'Dashboards' },
];

// Left sidebar items per page
const SIDEBAR_ITEMS = {
  config: [
    { key: 'data-sources', label: '3rd Party Data Sources' },
    { key: 'first-party', label: '1st Party Data' },
    { key: 'kpi-config', label: 'KPI Configuration' },
    { key: 'external-factors', label: 'External Factors' },
    { key: 'advanced', label: 'Advanced Settings' },
  ],
  training: [
    { key: 'training-progress', label: 'Training Progress' },
    { key: 'diagnostics', label: 'Model Diagnostics' },
  ],
  budget: [
    { key: 'budget-settings', label: 'Budget Settings' },
    { key: 'seasonality', label: 'Seasonality Index' },
    { key: 'monthly-budget', label: 'Channel Budget by Month' },
  ],
};

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const [searchFocused, setSearchFocused] = useState(false);

  const canNavigate = (key) => {
    if (key === 'home') return true;
    if (key === 'pipeline') return true;
    if (key === 'config') return !!state.pipelineData;
    if (key === 'training') return !!state.pipelineData && !!state.validationResults?.canProceed;
    if (key === 'budget') return !!state.pipelineData && !!state.validationResults?.canProceed;
    if (key === 'dashboards') return state.trainingStatus === 'complete';
    return false;
  };

  const hasSidebar = SF_PAGES.includes(state.currentStep);
  const sidebarItems = SIDEBAR_ITEMS[state.currentStep] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ═══ SALESFORCE GLOBAL HEADER ═══ */}
      <header className="sf-global-header">
        <div className="sf-header-left">
          {/* Salesforce Cloud Logo */}
          <svg width="24" height="17" viewBox="0 0 24 17" style={{ flexShrink: 0 }}>
            <path d="M10.1 1.4C11 .5 12.2 0 13.5 0c1.7 0 3.2.9 4 2.3.7-.3 1.5-.5 2.3-.5C22.7 1.8 25 4.2 25 7.1s-2.3 5.3-5.2 5.3c-.3 0-.7 0-1-.1-.7 1.4-2.1 2.4-3.8 2.4-0.6 0-1.2-.1-1.7-.4-.7 1.3-2.1 2.2-3.7 2.2-1.5 0-2.7-.7-3.5-1.9-.3.1-.7.1-1 .1C2.3 14.7 0 12.3 0 9.4 0 7.4 1.1 5.7 2.7 4.8 2.5 4.3 2.4 3.8 2.4 3.2 2.4 1.4 3.9 0 5.7 0 6.8 0 7.8.5 8.5 1.3l1.6.1z" fill="#00A1E0"/>
          </svg>
          <Grid3X3 size={18} color="white" style={{ opacity: 0.7, cursor: 'pointer' }} />
          <span className="sf-app-name">Marketing Intelligence</span>
        </div>

        {/* Search bar */}
        <div className="sf-search-wrapper">
          <div className={`sf-search-bar ${searchFocused ? 'sf-search-bar--focused' : ''}`}>
            <Search size={14} color="#706e6b" />
            <input
              type="text"
              placeholder="Search..."
              className="sf-search-input"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Right icons */}
        <div className="sf-header-right">
          <Star size={18} />
          <Plus size={18} />
          <Cloud size={18} />
          <HelpCircle size={18} />
          <SettingsIcon size={18} />
          <Bell size={18} />
          <div className="sf-avatar">
            <span style={{ fontSize: 11, fontWeight: 700 }}>MI</span>
          </div>
        </div>
      </header>

      {/* ═══ SALESFORCE TOP NAVIGATION TABS ═══ */}
      <nav className="sf-nav-tabs">
        {TOP_TABS.map((tab) => {
          const isActive = state.currentStep === tab.key;
          const enabled = canNavigate(tab.key);
          return (
            <button
              key={tab.key}
              className={`sf-nav-tab ${isActive ? 'sf-nav-tab--active' : ''} ${!enabled ? 'sf-nav-tab--disabled' : ''}`}
              onClick={() => enabled && dispatch({ type: 'SET_STEP', payload: tab.key })}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ═══ CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', background: '#f3f3f3' }}>
        {/* Left sidebar (Salesforce style - only on SF pages) */}
        {hasSidebar && (
          <aside className="sf-sidebar">
            <div className="sf-sidebar-header">
              {state.currentStep === 'config' ? 'MI Configuration' :
               state.currentStep === 'training' ? 'Model Data Feed' :
               'Budget Optimization'}
            </div>
            <nav className="sf-sidebar-nav">
              {sidebarItems.map((item) => (
                <a
                  key={item.key}
                  className="sf-sidebar-link"
                  href={`#${item.key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(item.key);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="sf-main-content" style={{ padding: hasSidebar ? '24px 32px' : '24px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
