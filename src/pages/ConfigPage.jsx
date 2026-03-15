import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Database, Info, ArrowRight, ArrowLeft, BarChart3, CloudLightning, CheckCircle, AlertTriangle, Mail, MessageSquare, Smartphone, ChevronDown, ChevronUp, Filter, Globe, Link2, X, Sliders } from 'lucide-react';

// ── Sample pipeline data ──
const API_SOURCES = [
  { key: 'meta_ads', label: 'Meta Ads', color: '#1877F2' },
  { key: 'google_ads', label: 'Google Ads', color: '#4285F4' },
  { key: 'tiktok_ads', label: 'TikTok Ads', color: '#000000' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', color: '#0A66C2' },
  { key: 'pinterest_ads', label: 'Pinterest Ads', color: '#E60023' },
  { key: 'snapchat_ads', label: 'Snapchat Ads', color: '#FFFC00' },
];

const API_PIPELINES = {
  meta_ads: [
    { id: 'meta_brand_us', name: 'Meta - Brand Awareness US', source: 'meta_ads' },
    { id: 'meta_perf_us', name: 'Meta - Performance US', source: 'meta_ads' },
    { id: 'meta_retarget_eu', name: 'Meta - Retargeting EU', source: 'meta_ads' },
    { id: 'meta_video_us', name: 'Meta - Video Views US', source: 'meta_ads' },
  ],
  google_ads: [
    { id: 'gads_search_brand', name: 'Google - Search Brand', source: 'google_ads' },
    { id: 'gads_search_nb', name: 'Google - Search Non-Brand', source: 'google_ads' },
    { id: 'gads_display', name: 'Google - Display Prospecting', source: 'google_ads' },
    { id: 'gads_youtube', name: 'Google - YouTube Brand', source: 'google_ads' },
    { id: 'gads_pmax', name: 'Google - Performance Max', source: 'google_ads' },
  ],
  tiktok_ads: [
    { id: 'tt_awareness', name: 'TikTok - Awareness US', source: 'tiktok_ads' },
    { id: 'tt_conversions', name: 'TikTok - Conversions US', source: 'tiktok_ads' },
  ],
  linkedin_ads: [
    { id: 'li_b2b', name: 'LinkedIn - B2B Lead Gen', source: 'linkedin_ads' },
    { id: 'li_awareness', name: 'LinkedIn - Brand Awareness', source: 'linkedin_ads' },
  ],
  pinterest_ads: [
    { id: 'pin_shop', name: 'Pinterest - Shopping US', source: 'pinterest_ads' },
  ],
  snapchat_ads: [
    { id: 'snap_reach', name: 'Snapchat - Reach Campaign', source: 'snapchat_ads' },
  ],
};

const TC_PIPELINES = [
  { id: 'tv_linear', name: 'TV - Linear National' },
  { id: 'tv_ctv', name: 'TV - Connected TV' },
  { id: 'radio_spotify', name: 'Radio - Spotify Audio' },
  { id: 'radio_iheart', name: 'Radio - iHeart Media' },
  { id: 'ooh_digital', name: 'OOH - Digital Billboards' },
  { id: 'ooh_transit', name: 'OOH - Transit Ads' },
  { id: 'print_magazine', name: 'Print - Magazine Q1' },
  { id: 'print_newspaper', name: 'Print - Newspaper Inserts' },
];

const RULE_TYPES = [
  { value: '', label: 'No rule' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'contains', label: 'Contains' },
];

// ── Meridian Measurement Mapping ──
const TC_SOURCE_MEASUREMENTS = {
  tv_linear: [
    'TV Gross Rating Points (GRPs)', 'TV Target Rating Points (TRPs)', 'TV Impressions',
    'TV Reach', 'TV Frequency', 'TV Spot Count', 'TV Net Spend', 'TV Gross Spend',
    'TV CPP (Cost Per Point)', 'TV CPM (Cost Per Mille)',
  ],
  tv_ctv: [
    'CTV Impressions', 'CTV Completed Views', 'CTV Video Completion Rate',
    'CTV Reach', 'CTV Frequency', 'CTV Clicks', 'CTV Net Spend', 'CTV Gross Spend',
    'CTV CPM', 'CTV CPCV (Cost Per Completed View)',
  ],
  radio_spotify: [
    'Audio Impressions', 'Audio Listens (30s+)', 'Audio Completion Rate',
    'Audio Reach', 'Audio Frequency', 'Audio Clicks', 'Audio Net Spend', 'Audio Gross Spend',
    'Audio CPM', 'Audio CTR',
  ],
  radio_iheart: [
    'Radio Gross Impressions', 'Radio Spots Aired', 'Radio GRPs',
    'Radio Reach', 'Radio Frequency', 'Radio Net Spend', 'Radio Gross Spend',
    'Radio CPP', 'Radio CPM',
  ],
  ooh_digital: [
    'DOOH Impressions', 'DOOH Plays', 'DOOH Share of Voice',
    'DOOH Reach', 'DOOH Frequency', 'DOOH Net Spend', 'DOOH Gross Spend',
    'DOOH CPM', 'DOOH Dwell Time (avg sec)',
  ],
  ooh_transit: [
    'Transit Impressions', 'Transit Panels', 'Transit Reach',
    'Transit Frequency', 'Transit Net Spend', 'Transit Gross Spend',
    'Transit CPM',
  ],
  print_magazine: [
    'Print Circulation', 'Print Readership', 'Print Page Views',
    'Print Ad Insertions', 'Print Gross Spend', 'Print Net Spend',
    'Print CPM', 'Print Response Rate',
  ],
  print_newspaper: [
    'Newspaper Circulation', 'Newspaper Readership', 'Newspaper Insertions',
    'Newspaper Net Spend', 'Newspaper Gross Spend', 'Newspaper CPM',
    'Newspaper Column Inches',
  ],
};

// ── UI helpers ──
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
      width: 32, height: 32, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={14} color="#FFFFFF" />
    </div>
  );
}

function Section({ id, icon, color, title, badge, children }) {
  return (
    <div id={id} className="sf-section">
      <div className="sf-section-header">
        <div className="sf-section-header-left">
          <SectionIcon icon={icon} color={color} />
          <h2 className="sf-section-title">{title}</h2>
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="sf-section-body">
        {children}
      </div>
    </div>
  );
}

function getLookbackDateRange(years) {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - years);
  return {
    from: start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    to: today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  };
}

function applyRule(name, rule) {
  if (!rule.type || !rule.value) return false;
  const v = rule.value.toLowerCase();
  const n = name.toLowerCase();
  if (rule.type === 'starts_with') return n.startsWith(v);
  if (rule.type === 'ends_with') return n.endsWith(v);
  if (rule.type === 'contains') return n.includes(v);
  return false;
}

// ── Main Component ──
export default function ConfigPage() {
  const { state, dispatch } = useApp();
  const { config } = state;
  const df = config.dataFeed;

  // Meridian measurement mapping state
  const [apiActivityMeasurement, setApiActivityMeasurement] = useState('impressions');
  const [tcMeasurementMap, setTcMeasurementMap] = useState({});

  const updateTcMeasurement = (pipelineId, field, value) => {
    setTcMeasurementMap(prev => ({
      ...prev,
      [pipelineId]: { ...prev[pipelineId], [field]: value },
    }));
  };

  const updateConfig = (updates) => dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  const updateDataFeed = (updates) => dispatch({ type: 'UPDATE_DATA_FEED', payload: updates });
  const updateFactors = (updates) => dispatch({ type: 'UPDATE_EXTERNAL_FACTORS', payload: updates });
  const updateBudget = (updates) => dispatch({ type: 'UPDATE_BUDGET_CONFIG', payload: updates });
  const updateFirstPartyChannels = (updates) => dispatch({ type: 'UPDATE_FIRST_PARTY_CHANNELS', payload: updates });

  const enabledFactors = Object.values(config.externalFactors).filter(Boolean).length;
  const totalFactors = Object.keys(config.externalFactors).length;

  // ── 3rd party pipeline selection helpers ──
  const allApiPipelines = Object.values(API_PIPELINES).flat();
  const selectedApiPipelines = allApiPipelines.filter(p => {
    if (df.apiExcludes[p.id]) return false;
    if (df.apiPipelines[p.id]) return true;
    if (df.apiSources[p.source]) return true;
    if (applyRule(p.name, df.apiRule)) return true;
    return false;
  });

  const selectedTcPipelines = TC_PIPELINES.filter(p => {
    if (df.tcPipelines[p.id]) return true;
    if (applyRule(p.name, df.tcRule)) return true;
    return false;
  });

  const has3rdPartySelection = df.thirdPartyType === 'api'
    ? selectedApiPipelines.length > 0
    : selectedTcPipelines.length > 0;

  // Derive lookback from selected data (simulated: always 3 years for demo)
  const dataLookbackYears = has3rdPartySelection ? 3 : 0;
  const dataLookbackRange = getLookbackDateRange(dataLookbackYears);

  // 1st party
  const fpChannels = config.firstPartyChannels || { email: false, whatsapp: false, sms: false };
  const anyFirstPartySelected = fpChannels.email || fpChannels.whatsapp || fpChannels.sms;

  return (
    <div className="animate-slide-in">
      {/* Page header */}
      <div className="sf-page-header">
        <div className="sf-page-header-left">
          <div className="sf-page-icon" style={{ background: '#032D60' }}>
            <Settings size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="sf-page-title">MI Configuration</h1>
          </div>
        </div>
        <div className="sf-page-actions">
          <button className="slds-button slds-button_outline-brand" onClick={() => dispatch({ type: 'SET_STEP', payload: 'pipeline' })}>
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
      <div className="sf-detail-row">
        {[
          { label: 'Name', value: state.pipelineName || 'MI Configuration' },
          { label: '3rd Party Feeds', value: has3rdPartySelection ? `${df.thirdPartyType === 'api' ? selectedApiPipelines.length : selectedTcPipelines.length} pipelines` : 'None' },
          { label: '1st Party Data', value: config.connectFirstParty && anyFirstPartySelected ? 'Connected' : 'Disconnected' },
          { label: 'Data History', value: dataLookbackYears > 0 ? `${dataLookbackYears} Years` : 'N/A' },
          { label: 'KPI Type', value: config.kpiType === 'revenue' ? 'Revenue' : 'Conversions' },
          { label: 'External Factors', value: `${enabledFactors}/${totalFactors} enabled` },
          { label: 'Budget', value: '$' + config.budgetOptimization.totalBudget.toLocaleString() },
          { label: 'Status', value: state.validationResults?.canProceed ? 'Ready' : 'Pending' },
        ].map((item, i) => (
          <div key={i} className="sf-detail-item">
            <span className="sf-detail-label">{item.label}</span>
            <span className="sf-detail-value" style={{
              ...(item.label === 'Status' && item.value === 'Ready' ? { color: '#2e844a' } : {}),
              ...(item.label === '1st Party Data' && item.value === 'Connected' ? { color: '#2e844a' } : {}),
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 1. DATA FEED SECTION                       */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="data-sources" icon={Database} color="#032D60" title="Data Feed"
        badge={
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: has3rdPartySelection ? '#2e844a' : '#706e6b',
            background: has3rdPartySelection ? '#e6f7ec' : '#f3f3f3',
            padding: '4px 12px', borderRadius: 12,
          }}>
            {has3rdPartySelection
              ? `${(df.thirdPartyType === 'api' ? selectedApiPipelines.length : selectedTcPipelines.length)} pipelines selected`
              : 'No pipelines selected'}
          </span>
        }
      >
        {/* ── 3rd Party Data Feed ── */}
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>3rd Party Data Feed</h3>

        {/* Feed type tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
          {[
            { key: 'api', label: 'API Based', icon: Globe },
            { key: 'totalconnect', label: 'Total Connect', icon: Link2 },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => updateDataFeed({ thirdPartyType: t.key })}
              style={{
                padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid #e5e5e5',
                borderBottom: df.thirdPartyType === t.key ? '2px solid #0176d3' : '1px solid #e5e5e5',
                background: df.thirdPartyType === t.key ? '#e5f5fe' : 'white',
                color: df.thirdPartyType === t.key ? '#0176d3' : '#706e6b',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── API Based ── */}
        {df.thirdPartyType === 'api' && (
          <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 20, marginBottom: 16 }}>
            {/* Select by Source */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Select by Source</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {API_SOURCES.map(src => (
                <div
                  key={src.key}
                  onClick={() => updateDataFeed({ apiSources: { ...df.apiSources, [src.key]: !df.apiSources[src.key] } })}
                  style={{
                    border: `2px solid ${df.apiSources[src.key] ? src.color : '#e5e5e5'}`,
                    borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
                    background: df.apiSources[src.key] ? src.color + '10' : 'white',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: df.apiSources[src.key] ? src.color : '#c9c9c9',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: df.apiSources[src.key] ? '#181818' : '#706e6b' }}>
                    {src.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Individual Pipeline Selection */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Individual Pipeline Selection</h4>
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 6,
              maxHeight: 200, overflowY: 'auto', marginBottom: 20,
            }}>
              {allApiPipelines.map(p => {
                const srcLabel = API_SOURCES.find(s => s.key === p.source)?.label || '';
                const isSelected = df.apiPipelines[p.id] || df.apiSources[p.source] || applyRule(p.name, df.apiRule);
                const isExcluded = df.apiExcludes[p.id];
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '8px 14px',
                      borderBottom: '1px solid #f3f3f3',
                      background: isExcluded ? '#fef0ef' : isSelected ? '#e5f5fe' : 'white',
                    }}
                  >
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={!!df.apiPipelines[p.id]}
                        onChange={(e) => updateDataFeed({ apiPipelines: { ...df.apiPipelines, [p.id]: e.target.checked } })}
                      />
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: '#706e6b' }}>({srcLabel})</span>
                    </label>
                    {(isSelected || df.apiSources[p.source]) && !isExcluded && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#2e844a', background: '#e6f7ec', padding: '2px 8px', borderRadius: 8 }}>
                        Selected
                      </span>
                    )}
                    {isExcluded && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#ea001e', background: '#fef0ef', padding: '2px 8px', borderRadius: 8 }}>
                        Excluded
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Global Rule */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Global Rule</h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select
                className="slds-select"
                style={{ width: 180 }}
                value={df.apiRule.type}
                onChange={(e) => updateDataFeed({ apiRule: { ...df.apiRule, type: e.target.value } })}
              >
                {RULE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <input
                className="slds-input"
                placeholder="e.g. Brand"
                value={df.apiRule.value}
                onChange={(e) => updateDataFeed({ apiRule: { ...df.apiRule, value: e.target.value } })}
                disabled={!df.apiRule.type}
              />
            </div>

            {/* Exclude */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Exclude Pipelines</h4>
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 6,
              maxHeight: 160, overflowY: 'auto',
            }}>
              {allApiPipelines.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '6px 14px',
                    borderBottom: '1px solid #f3f3f3',
                    background: df.apiExcludes[p.id] ? '#fef0ef' : 'white',
                  }}
                >
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#706e6b' }}>
                    <input
                      type="checkbox"
                      checked={!!df.apiExcludes[p.id]}
                      onChange={(e) => updateDataFeed({ apiExcludes: { ...df.apiExcludes, [p.id]: e.target.checked } })}
                    />
                    {p.name}
                  </label>
                </div>
              ))}
            </div>

            {/* ── Meridian Media Activity Measurement (API) ── */}
            {selectedApiPipelines.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Meridian Media Activity Measurement</h4>
                <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 12 }}>
                  Select the measurement type to use as the media activity input for all API-based sources in the Meridian model.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { key: 'impressions', label: 'Impressions', desc: 'Use impression volume as media activity signal' },
                    { key: 'clicks', label: 'Clicks', desc: 'Use click volume as media activity signal' },
                  ].map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => setApiActivityMeasurement(opt.key)}
                      style={{
                        flex: 1,
                        border: `2px solid ${apiActivityMeasurement === opt.key ? '#0070D2' : '#DDDBDA'}`,
                        borderRadius: 4, padding: 14, cursor: 'pointer',
                        background: apiActivityMeasurement === opt.key ? '#EAF5FE' : 'white',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: `2px solid ${apiActivityMeasurement === opt.key ? '#0070D2' : '#C9C7C5'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {apiActivityMeasurement === opt.key && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0070D2' }} />
                          )}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: apiActivityMeasurement === opt.key ? '#3E3E3C' : '#706E6B' }}>
                          {opt.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#706E6B', marginTop: 6, paddingLeft: 24 }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: '#EAF5FE', border: '1px solid #0070D2', borderRadius: 4, padding: 10, marginTop: 12,
                  fontSize: 12, color: '#3E3E3C', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Info size={14} color="#0070D2" />
                  <span>
                    <strong>{apiActivityMeasurement === 'impressions' ? 'Impressions' : 'Clicks'}</strong> will be used as the Meridian Media Activity
                    measurement for all {selectedApiPipelines.length} selected API pipeline{selectedApiPipelines.length > 1 ? 's' : ''}.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Total Connect ── */}
        {df.thirdPartyType === 'totalconnect' && (
          <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 20, marginBottom: 16 }}>
            {/* Individual Pipeline Selection */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Individual Pipeline Selection</h4>
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 6,
              maxHeight: 240, overflowY: 'auto', marginBottom: 20,
            }}>
              {TC_PIPELINES.map(p => {
                const isSelected = df.tcPipelines[p.id] || applyRule(p.name, df.tcRule);
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '8px 14px',
                      borderBottom: '1px solid #f3f3f3',
                      background: isSelected ? '#e5f5fe' : 'white',
                    }}
                  >
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={!!df.tcPipelines[p.id]}
                        onChange={(e) => updateDataFeed({ tcPipelines: { ...df.tcPipelines, [p.id]: e.target.checked } })}
                      />
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </label>
                    {isSelected && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#2e844a', background: '#e6f7ec', padding: '2px 8px', borderRadius: 8 }}>
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Global Rule */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Global Rule</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                className="slds-select"
                style={{ width: 180 }}
                value={df.tcRule.type}
                onChange={(e) => updateDataFeed({ tcRule: { ...df.tcRule, type: e.target.value } })}
              >
                {RULE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <input
                className="slds-input"
                placeholder="e.g. TV"
                value={df.tcRule.value}
                onChange={(e) => updateDataFeed({ tcRule: { ...df.tcRule, value: e.target.value } })}
                disabled={!df.tcRule.type}
              />
            </div>

            {/* ── Meridian Measurement Mapping (Total Connect) ── */}
            {selectedTcPipelines.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Meridian Measurement Mapping</h4>
                <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 12 }}>
                  For each selected Total Connect source, choose which measurement represents the
                  <strong> Meridian Media Activity</strong> and which represents the <strong>Meridian Media Cost</strong>.
                </p>
                <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 6, overflow: 'hidden' }}>
                  <table className="slds-table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '24%' }}>Source</th>
                        <th style={{ width: '38%' }}>Media Activity Measurement</th>
                        <th style={{ width: '38%' }}>Media Cost Measurement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTcPipelines.map(p => {
                        const measurements = TC_SOURCE_MEASUREMENTS[p.id] || [];
                        const mapping = tcMeasurementMap[p.id] || {};
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</td>
                            <td>
                              <select
                                className="slds-select"
                                value={mapping.activity || ''}
                                onChange={(e) => updateTcMeasurement(p.id, 'activity', e.target.value)}
                                style={{ fontSize: 12 }}
                              >
                                <option value="">-- Select Activity --</option>
                                {measurements.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="slds-select"
                                value={mapping.cost || ''}
                                onChange={(e) => updateTcMeasurement(p.id, 'cost', e.target.value)}
                                style={{ fontSize: 12 }}
                              >
                                <option value="">-- Select Cost --</option>
                                {measurements.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {selectedTcPipelines.some(p => {
                  const m = tcMeasurementMap[p.id];
                  return m && m.activity && m.cost;
                }) && (
                  <div style={{
                    background: '#E6F7EC', border: '1px solid #2E844A', borderRadius: 4, padding: 10, marginTop: 12,
                    fontSize: 12, color: '#3E3E3C', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle size={14} color="#2E844A" />
                    <span>
                      {selectedTcPipelines.filter(p => {
                        const m = tcMeasurementMap[p.id];
                        return m && m.activity && m.cost;
                      }).length} of {selectedTcPipelines.length} source{selectedTcPipelines.length > 1 ? 's' : ''} fully mapped.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Data History (Lookback Window) ── */}
        {has3rdPartySelection && (
          <div style={{
            background: '#e6f7ec', border: '1px solid #2e844a', borderRadius: 8, padding: 16, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <CheckCircle size={20} color="#2e844a" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2e844a' }}>Historic Data Available</div>
              <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                Data range: <strong>{dataLookbackRange.from}</strong> &ndash; <strong>{dataLookbackRange.to}</strong>
                &nbsp;&middot;&nbsp; {dataLookbackYears * 52} weeks of 3rd party data available.
              </div>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#2e844a',
              background: 'white', padding: '4px 12px', borderRadius: 12,
            }}>
              {dataLookbackYears} Year{dataLookbackYears > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* ── 1st Party Data (Organic) ── */}
        <div id="first-party" style={{ borderTop: '1px solid #e5e5e5', paddingTop: 20, marginTop: 4 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>1st Party Data (Organic)</h3>
          <div className="slds-notify slds-notify_info" style={{ marginBottom: 12 }}>
            <Info size={16} />
            <div style={{ fontSize: 12 }}>
              Marketing Cloud data sources. All 1st party data is consolidated as &apos;Organic&apos; in the model.
            </div>
          </div>
          <label className="slds-checkbox-toggle" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={config.connectFirstParty} onChange={(e) => updateConfig({ connectFirstParty: e.target.checked })} />
            <div className="slds-checkbox-toggle__track" />
            <span className="slds-checkbox-toggle__label">Connect 1st Party Data</span>
          </label>

          {config.connectFirstParty && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { key: 'email', label: 'Email', icon: Mail, color: '#0176d3' },
                  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#25D366' },
                  { key: 'sms', label: 'SMS', icon: Smartphone, color: '#fe9339' },
                ].map((ch) => (
                  <div
                    key={ch.key}
                    onClick={() => updateFirstPartyChannels({ [ch.key]: !fpChannels[ch.key] })}
                    style={{
                      border: `2px solid ${fpChannels[ch.key] ? ch.color : '#e5e5e5'}`,
                      borderRadius: 8, padding: 16, cursor: 'pointer',
                      background: fpChannels[ch.key] ? ch.color + '10' : 'white',
                      textAlign: 'center',
                    }}
                  >
                    <ch.icon size={24} color={fpChannels[ch.key] ? ch.color : '#706e6b'} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: fpChannels[ch.key] ? '#181818' : '#706e6b' }}>{ch.label}</div>
                    <div style={{ fontSize: 11, color: '#706e6b', marginTop: 4 }}>
                      {fpChannels[ch.key] ? 'Selected' : 'Click to select'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show matching history for 1st party */}
              {anyFirstPartySelected && has3rdPartySelection && (
                <div style={{
                  background: '#e6f7ec', border: '1px solid #2e844a', borderRadius: 8, padding: 12,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <CheckCircle size={16} color="#2e844a" />
                  <div style={{ fontSize: 12, color: '#2e844a', fontWeight: 600 }}>
                    1st party data history matches 3rd party data range ({dataLookbackRange.from} &ndash; {dataLookbackRange.to})
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. KPI CONFIGURATION                       */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="kpi-config" icon={BarChart3} color="#1B5F6A" title="KPI Configuration">
        <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 16 }}>
          Select the KPI metric to model. Then configure the Data Cloud data source for this metric.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { value: 'revenue', label: 'Revenue', desc: 'Model revenue as the target KPI. Enables direct ROI calculation.' },
            { value: 'non_revenue', label: 'Conversions', desc: 'Model non-revenue conversions (leads, sign-ups, etc.) as the target KPI.' },
          ].map((kpi) => (
            <div
              key={kpi.value}
              onClick={() => updateConfig({ kpiType: kpi.value })}
              style={{
                border: `2px solid ${config.kpiType === kpi.value ? '#0176d3' : '#e5e5e5'}`,
                borderRadius: 8, padding: 20, cursor: 'pointer',
                background: config.kpiType === kpi.value ? '#e5f5fe' : 'white',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: config.kpiType === kpi.value ? '#0176d3' : '#181818', marginBottom: 4 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 12, color: '#706e6b' }}>{kpi.desc}</div>
            </div>
          ))}
        </div>

        {/* DMO Configuration */}
        <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Data Cloud Source for {config.kpiType === 'revenue' ? 'Revenue' : 'Conversions'}
          </h3>
          <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 16 }}>
            Configure the Data Model Object (DMO), field, and optional filters.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label" style={{ fontWeight: 600 }}>Data Model Object (DMO)</label>
              <select
                className="slds-select"
                value={config.kpiDMO?.objectName || ''}
                onChange={(e) => updateConfig({ kpiDMO: { ...config.kpiDMO, objectName: e.target.value } })}
              >
                <option value="">-- Select a DMO --</option>
                {config.kpiType === 'revenue' ? (
                  <>
                    <option value="Sales_Order__dlm">Sales Order</option>
                    <option value="Revenue_Event__dlm">Revenue Event</option>
                    <option value="Transaction__dlm">Transaction</option>
                    <option value="Opportunity__dlm">Opportunity</option>
                    <option value="Invoice__dlm">Invoice</option>
                  </>
                ) : (
                  <>
                    <option value="Lead__dlm">Lead</option>
                    <option value="Contact_Point_Email__dlm">Contact Point Email</option>
                    <option value="Campaign_Member__dlm">Campaign Member</option>
                    <option value="Engagement_Event__dlm">Engagement Event</option>
                    <option value="Web_Event__dlm">Web Event</option>
                  </>
                )}
              </select>
            </div>
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label" style={{ fontWeight: 600 }}>
                {config.kpiType === 'revenue' ? 'Revenue' : 'Conversion'} Field
              </label>
              <select
                className="slds-select"
                value={config.kpiDMO?.fieldName || ''}
                onChange={(e) => updateConfig({ kpiDMO: { ...config.kpiDMO, fieldName: e.target.value } })}
              >
                <option value="">-- Select a field --</option>
                {config.kpiType === 'revenue' ? (
                  <>
                    <option value="TotalAmount__c">Total Amount</option>
                    <option value="NetRevenue__c">Net Revenue</option>
                    <option value="GrossRevenue__c">Gross Revenue</option>
                    <option value="RecurringRevenue__c">Recurring Revenue</option>
                  </>
                ) : (
                  <>
                    <option value="ConversionCount__c">Conversion Count</option>
                    <option value="LeadCount__c">Lead Count</option>
                    <option value="SignUpCount__c">Sign-up Count</option>
                    <option value="EventCount__c">Event Count</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Filtering */}
          <div style={{ marginBottom: 16 }}>
            <label className="slds-form-element__label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> Filters (Optional)
            </label>
            <div style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 6, padding: 12,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
            }}>
              <div className="slds-form-element" style={{ marginBottom: 0 }}>
                <label className="slds-form-element__label" style={{ fontSize: 11 }}>Filter Field</label>
                <select
                  className="slds-select"
                  value={config.kpiDMO?.filterField || ''}
                  onChange={(e) => updateConfig({ kpiDMO: { ...config.kpiDMO, filterField: e.target.value } })}
                >
                  <option value="">None</option>
                  <option value="Status__c">Status</option>
                  <option value="Region__c">Region</option>
                  <option value="Channel__c">Channel</option>
                  <option value="Product_Category__c">Product Category</option>
                </select>
              </div>
              <div className="slds-form-element" style={{ marginBottom: 0 }}>
                <label className="slds-form-element__label" style={{ fontSize: 11 }}>Operator</label>
                <select
                  className="slds-select"
                  value={config.kpiDMO?.filterOperator || 'equals'}
                  onChange={(e) => updateConfig({ kpiDMO: { ...config.kpiDMO, filterOperator: e.target.value } })}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="in">In</option>
                </select>
              </div>
              <div className="slds-form-element" style={{ marginBottom: 0 }}>
                <label className="slds-form-element__label" style={{ fontSize: 11 }}>Value</label>
                <input
                  className="slds-input"
                  type="text"
                  placeholder="e.g. Closed Won"
                  value={config.kpiDMO?.filterValue || ''}
                  onChange={(e) => updateConfig({ kpiDMO: { ...config.kpiDMO, filterValue: e.target.value } })}
                />
              </div>
            </div>
          </div>

          {/* Data availability — matching lookback window */}
          {config.kpiDMO?.objectName && config.kpiDMO?.fieldName && has3rdPartySelection && (
            <div style={{
              background: '#e6f7ec', border: '1px solid #2e844a', borderRadius: 8, padding: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <CheckCircle size={20} color="#2e844a" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2e844a' }}>KPI Data Matches Data Feed History</div>
                <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                  KPI data range: <strong>{dataLookbackRange.from}</strong> &ndash; <strong>{dataLookbackRange.to}</strong>
                  &nbsp;&middot;&nbsp; {dataLookbackYears * 52} weeks of {config.kpiType === 'revenue' ? 'revenue' : 'conversion'} data matches the data feed look-back window.
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#2e844a',
                background: 'white', padding: '4px 12px', borderRadius: 12,
              }}>
                {dataLookbackYears * 52} weeks
              </span>
            </div>
          )}
          {config.kpiDMO?.objectName && !config.kpiDMO?.fieldName && (
            <div style={{
              background: '#fef0ef', border: '1px solid #ea001e', borderRadius: 8, padding: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <AlertTriangle size={20} color="#ea001e" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ea001e' }}>Select a Field</div>
                <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                  Please select a field to check data availability against the data feed look-back window.
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. EXTERNAL FACTORS & CONTROLS             */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="external-factors" icon={CloudLightning} color="#5C4F9A" title="External Factors, Seasonality & Controls"
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
              { key: 'seasonality', label: 'Seasonality', desc: 'Auto-captured by time-varying intercept (knots). Configure knots in Advanced Settings.' },
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

      {/* ═══════════════════════════════════════════ */}
      {/* 4. ADVANCED SETTINGS (bottom)              */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="advanced" icon={Sliders} color="#444444" title="Advanced Settings"
        badge={
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#706e6b',
            background: '#f3f3f3', padding: '4px 12px', borderRadius: 12,
          }}>
            Expert Configuration
          </span>
        }
      >
        <div className="slds-notify slds-notify_info" style={{ marginBottom: 16 }}>
          <Info size={16} />
          <div style={{ fontSize: 12 }}>
            These settings use standard defaults that work well for most use cases. Only modify if you have specific modeling requirements.
          </div>
        </div>

        {/* Summary of current settings */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16,
        }}>
          {[
            { label: 'Adstock Decay', value: config.adstockDecay === 'geometric' ? 'Geometric' : 'Binomial' },
            { label: 'Max Lag', value: config.maxLag + ' weeks' },
            { label: 'Knots', value: config.knots === 'auto' ? 'Automatic' : config.knots === 'aks' ? 'AKS' : config.knots === '10pct' ? '10%' : 'Single' },
            { label: 'ROI Prior Mean', value: config.priorROI.mean.toFixed(1) },
            { label: 'ROI Prior Std', value: config.priorROI.std.toFixed(1) },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#f8f8f8', borderRadius: 6, padding: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#706e6b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#181818' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => updateConfig({ showAdvanced: !config.showAdvanced })}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8f8f8', border: '1px solid #e5e5e5', borderRadius: 6,
            padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0176d3',
          }}
        >
          <span>{config.showAdvanced ? 'Hide Details' : 'Show Details'}</span>
          {config.showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {config.showAdvanced && (
          <div style={{
            border: '1px solid #e5e5e5', borderTop: 'none', borderRadius: '0 0 6px 6px',
            padding: 20,
          }}>
            {/* Adstock & Saturation */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Adstock & Saturation</h4>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20,
            }}>
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

            {/* Knot Configuration */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Knot Configuration</h4>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20,
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

            {/* Prior Distributions */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Prior Distributions</h4>
            <div className="slds-notify slds-notify_info" style={{ marginBottom: 12 }}>
              <Info size={16} />
              <div style={{ fontSize: 12 }}>Meridian uses Bayesian priors on ROI. Default: LogNormal(0.0, 0.5) giving median ROI of 1.0.</div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16,
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
            <div className="slds-form-element__help" style={{ marginBottom: 20 }}>
              Median ROI = e^{config.priorROI.mean} = {Math.exp(config.priorROI.mean).toFixed(2)}.
              Higher std = less informative prior (more data-driven).
            </div>

            {/* Spend Constraints */}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Spend Constraints</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
        )}
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* Bottom Proceed Button                      */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 0',
      }}>
        <button className="slds-button slds-button_neutral" onClick={() => dispatch({ type: 'SET_STEP', payload: 'pipeline' })}>
          <ArrowLeft size={14} /> Back to Data Ingestion
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
