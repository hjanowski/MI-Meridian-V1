import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Database, Info, ArrowRight, ArrowLeft, Clock, Sliders, BarChart3, CloudLightning, CheckCircle, Edit3, AlertTriangle, Mail, MessageSquare, Smartphone, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

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

function getLookbackDateRange(years) {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - years);
  return {
    from: start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    to: today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  };
}

export default function ConfigPage() {
  const { state, dispatch } = useApp();
  const { config } = state;

  const updateConfig = (updates) => dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  const updateFactors = (updates) => dispatch({ type: 'UPDATE_EXTERNAL_FACTORS', payload: updates });
  const updateBudget = (updates) => dispatch({ type: 'UPDATE_BUDGET_CONFIG', payload: updates });
  const updateFirstPartyChannels = (updates) => dispatch({ type: 'UPDATE_FIRST_PARTY_CHANNELS', payload: updates });

  const enabledFactors = Object.values(config.externalFactors).filter(Boolean).length;
  const totalFactors = Object.keys(config.externalFactors).length;

  // Check if model lookback exceeds ingested data
  const ingestedYears = state.lookbackYears || (state.pipelineData ? Math.round(state.pipelineData.numWeeks / 52) : 0);
  const modelLookback = config.modelLookbackYears || 3;
  const insufficientData = modelLookback > ingestedYears;
  const modelDateRange = getLookbackDateRange(modelLookback);

  // 1st party channel helpers
  const fpChannels = config.firstPartyChannels || { email: false, whatsapp: false, sms: false };
  const allFirstPartySelected = fpChannels.email && fpChannels.whatsapp && fpChannels.sms;
  const anyFirstPartySelected = fpChannels.email || fpChannels.whatsapp || fpChannels.sms;
  const toggleAllFirstParty = (checked) => {
    updateFirstPartyChannels({ email: checked, whatsapp: checked, sms: checked });
  };

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
            disabled={!state.validationResults?.canProceed || insufficientData}
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
          { label: 'Model Period', value: modelLookback + ' Year' + (modelLookback > 1 ? 's' : '') },
          { label: 'KPI Type', value: config.kpiType === 'revenue' ? 'Revenue' : 'Conversions' },
          { label: 'DMO Source', value: config.kpiDMO?.objectName ? config.kpiDMO.objectName.replace('__dlm', '') : 'Not Set' },
          { label: 'External Factors', value: `${enabledFactors}/${totalFactors} enabled` },
          { label: 'Budget', value: '$' + config.budgetOptimization.totalBudget.toLocaleString() },
          { label: 'Status', value: insufficientData ? 'Insufficient Data' : state.validationResults?.canProceed ? 'Ready' : 'Pending' },
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
              ...(item.label === 'Status' && item.value === 'Insufficient Data' ? { color: '#ea001e' } : {}),
              ...(item.label === '1st Party Data' && item.value === 'Connected' ? { color: '#2e844a' } : {}),
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Model Look-back Period Selection */}
      <Section icon={Clock} color="#0176d3" title="Model Look-back Period"
        badge={
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: insufficientData ? '#ea001e' : '#2e844a',
            background: insufficientData ? '#fef0ef' : '#e6f7ec',
            padding: '4px 12px', borderRadius: 12,
          }}>
            {insufficientData ? 'Insufficient Data' : modelLookback + ' Year' + (modelLookback > 1 ? 's' : '')}
          </span>
        }
      >
        <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 16 }}>
          Select the look-back period for model analysis. This determines how much historical data the model uses.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((years) => {
            const range = getLookbackDateRange(years);
            const disabled = years > ingestedYears;
            return (
              <div
                key={years}
                onClick={() => !disabled && updateConfig({ modelLookbackYears: years })}
                style={{
                  border: `2px solid ${modelLookback === years ? '#0176d3' : disabled ? '#e5e5e5' : '#c9c9c9'}`,
                  borderRadius: 8, padding: 16, cursor: disabled ? 'not-allowed' : 'pointer',
                  background: modelLookback === years ? '#e5f5fe' : disabled ? '#f8f8f8' : 'white',
                  opacity: disabled ? 0.6 : 1,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: modelLookback === years ? '#0176d3' : disabled ? '#706e6b' : '#181818' }}>
                  {years} Year{years > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#706e6b', marginTop: 4 }}>{years * 52} weeks</div>
                <div style={{ fontSize: 11, color: '#0176d3', marginTop: 4, fontWeight: 500 }}>
                  {range.from} &ndash; {range.to}
                </div>
                {disabled && (
                  <div style={{ fontSize: 10, color: '#ea001e', marginTop: 6, fontWeight: 600 }}>
                    Not enough data ingested
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {insufficientData && (
          <div className="slds-notify slds-notify_error" style={{ marginTop: 8 }}>
            <AlertTriangle size={18} />
            <div>
              <strong>Insufficient data for {modelLookback}-year look-back</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                You have ingested {ingestedYears} year{ingestedYears !== 1 ? 's' : ''} of data, but selected a {modelLookback}-year model period.
                Please go back to Data Ingestion and ingest at least {modelLookback} year{modelLookback !== 1 ? 's' : ''} of data, or select a shorter look-back period.
              </div>
              <button
                className="slds-button slds-button_neutral"
                style={{ marginTop: 8 }}
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'pipeline' })}
              >
                <ArrowLeft size={14} /> Go to Data Ingestion
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* 1st Party Data */}
      <Section icon={Database} color="#0176d3" title="1st Party Data"
        badge={<StatusDot active={config.connectFirstParty} />}
      >
        <div className="slds-notify slds-notify_info" style={{ marginBottom: 16 }}>
          <Info size={16} />
          <div style={{ fontSize: 12 }}>
            Connect to 1st Party Data to enrich your MMM analysis with direct channel engagement data. This data captures the effort and influence of owned channels. All 1st party data is consolidated as &apos;Organic&apos; in the model.
          </div>
        </div>
        <label className="slds-checkbox-toggle">
          <input type="checkbox" checked={config.connectFirstParty} onChange={(e) => updateConfig({ connectFirstParty: e.target.checked })} />
          <div className="slds-checkbox-toggle__track" />
          <span className="slds-checkbox-toggle__label">Connect to 1st Party Data</span>
        </label>
        {config.connectFirstParty && (
          <div style={{ marginTop: 16 }}>
            {/* Channel selection */}
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Select 1st Party Channels</h3>
            <div style={{ marginBottom: 16 }}>
              <label className="slds-checkbox-toggle" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={allFirstPartySelected} onChange={(e) => toggleAllFirstParty(e.target.checked)} />
                <div className="slds-checkbox-toggle__track" />
                <span className="slds-checkbox-toggle__label">Select All Channels</span>
              </label>
            </div>
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

            {/* Channel stats based on look-back window */}
            {anyFirstPartySelected && state.pipelineData?.firstPartyData?.firstPartyChannels && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  Channel Activity ({modelLookback} Year{modelLookback > 1 ? 's' : ''} Look-back)
                </h3>
                <table className="slds-table">
                  <thead>
                    <tr><th>Channel</th><th>Total Sent</th><th>Total Opened</th><th>Open Rate</th></tr>
                  </thead>
                  <tbody>
                    {fpChannels.email && state.pipelineData.firstPartyData.firstPartyChannels.email && (() => {
                      const d = state.pipelineData.firstPartyData.firstPartyChannels.email;
                      const scale = (modelLookback * 52) / state.pipelineData.numWeeks;
                      return (
                        <tr>
                          <td style={{ fontWeight: 600 }}><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Email</td>
                          <td>{Math.round(d.totalSent * scale).toLocaleString()}</td>
                          <td>{Math.round(d.totalOpened * scale).toLocaleString()}</td>
                          <td>{(d.openRate * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })()}
                    {fpChannels.whatsapp && state.pipelineData.firstPartyData.firstPartyChannels.whatsapp && (() => {
                      const d = state.pipelineData.firstPartyData.firstPartyChannels.whatsapp;
                      const scale = (modelLookback * 52) / state.pipelineData.numWeeks;
                      return (
                        <tr>
                          <td style={{ fontWeight: 600 }}><MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />WhatsApp</td>
                          <td>{Math.round(d.totalSent * scale).toLocaleString()}</td>
                          <td>{Math.round(d.totalOpened * scale).toLocaleString()}</td>
                          <td>{(d.openRate * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })()}
                    {fpChannels.sms && state.pipelineData.firstPartyData.firstPartyChannels.sms && (() => {
                      const d = state.pipelineData.firstPartyData.firstPartyChannels.sms;
                      const scale = (modelLookback * 52) / state.pipelineData.numWeeks;
                      return (
                        <tr>
                          <td style={{ fontWeight: 600 }}><Smartphone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />SMS</td>
                          <td>{Math.round(d.totalSent * scale).toLocaleString()}</td>
                          <td>{Math.round(d.totalOpened * scale).toLocaleString()}</td>
                          <td>{(d.openRate * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </Section>

      {/* KPI Configuration */}
      <Section icon={BarChart3} color="#0176d3" title="KPI Configuration">
        {/* KPI Type selection */}
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
        <div style={{
          background: '#f8f8f8', borderRadius: 8, padding: 20, marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Data Cloud Source for {config.kpiType === 'revenue' ? 'Revenue' : 'Conversions'}
          </h3>
          <p style={{ fontSize: 12, color: '#706e6b', marginBottom: 16 }}>
            Configure the Data Model Object (DMO), field, and optional filters from your mapped Data Cloud objects.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label" style={{ fontWeight: 600 }}>Data Model Object (DMO)</label>
              <select
                className="slds-select"
                value={config.kpiDMO?.objectName || ''}
                onChange={(e) => updateConfig({
                  kpiDMO: { ...config.kpiDMO, objectName: e.target.value },
                })}
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
              <div className="slds-form-element__help">The primary object containing your {config.kpiType === 'revenue' ? 'revenue' : 'conversion'} data.</div>
            </div>
            <div className="slds-form-element" style={{ marginBottom: 0 }}>
              <label className="slds-form-element__label" style={{ fontWeight: 600 }}>
                {config.kpiType === 'revenue' ? 'Revenue' : 'Conversion'} Field
              </label>
              <select
                className="slds-select"
                value={config.kpiDMO?.fieldName || ''}
                onChange={(e) => updateConfig({
                  kpiDMO: { ...config.kpiDMO, fieldName: e.target.value },
                })}
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
              <div className="slds-form-element__help">The field to aggregate as the KPI metric.</div>
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
                  onChange={(e) => updateConfig({
                    kpiDMO: { ...config.kpiDMO, filterField: e.target.value },
                  })}
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
                  onChange={(e) => updateConfig({
                    kpiDMO: { ...config.kpiDMO, filterOperator: e.target.value },
                  })}
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
                  onChange={(e) => updateConfig({
                    kpiDMO: { ...config.kpiDMO, filterValue: e.target.value },
                  })}
                />
              </div>
            </div>
          </div>

          {/* Date Range Availability */}
          {config.kpiDMO?.objectName && config.kpiDMO?.fieldName && (
            <div style={{
              background: '#e6f7ec', border: '1px solid #2e844a', borderRadius: 8, padding: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <CheckCircle size={20} color="#2e844a" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2e844a' }}>Sufficient Data Available</div>
                <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                  Data range: <strong>{modelDateRange.from}</strong> &ndash; <strong>{modelDateRange.to}</strong>
                  &nbsp;&middot;&nbsp; {modelLookback * 52} weeks of {config.kpiType === 'revenue' ? 'revenue' : 'conversion'} data matches the paid media date range.
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#2e844a',
                background: 'white', padding: '4px 12px', borderRadius: 12,
              }}>
                {modelLookback * 52} weeks
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ea001e' }}>Insufficient Data Available</div>
                <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                  Please select a field to check data availability.
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Model Settings (simplified) */}
      <Section icon={Settings} color="#0176d3" title="Model Settings"
        badge={
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#706e6b',
            background: '#f3f3f3', padding: '4px 12px', borderRadius: 12,
          }}>
            Standard Configuration
          </span>
        }
      >
        <div className="slds-notify slds-notify_info" style={{ marginBottom: 16 }}>
          <Info size={16} />
          <div style={{ fontSize: 12 }}>
            Meridian uses standard defaults that work well for most use cases. For expert users, expand Advanced Settings below.
          </div>
        </div>

        {/* Summary of current settings */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16,
        }}>
          {[
            { label: 'Adstock Decay', value: config.adstockDecay === 'geometric' ? 'Geometric' : 'Binomial' },
            { label: 'Max Lag', value: config.maxLag + ' weeks' },
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

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { showAdvanced: !config.showAdvanced } })}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8f8f8', border: '1px solid #e5e5e5', borderRadius: 6,
            padding: '12px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0176d3',
          }}
        >
          <span>Advanced Settings</span>
          {config.showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {config.showAdvanced && (
          <div style={{
            border: '1px solid #e5e5e5', borderTop: 'none', borderRadius: '0 0 6px 6px',
            padding: 20,
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16,
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

            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, marginTop: 8 }}>Prior Distributions</h4>
            <div className="slds-notify slds-notify_info" style={{ marginBottom: 12 }}>
              <Info size={16} />
              <div style={{ fontSize: 12 }}>Meridian uses Bayesian priors on ROI. Default: LogNormal(0.0, 0.5) giving median ROI of 1.0.</div>
            </div>
            <div style={{
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
          </div>
        )}
      </Section>

      {/* External Factors, Seasonality & Time Controls (combined) */}
      <Section icon={CloudLightning} color="#fe9339" title="External Factors, Seasonality & Controls"
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
        {/* Seasonality & Time Controls */}
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Seasonality & Time Controls</h3>
        <div style={{
          background: '#f8f8f8', borderRadius: 6, padding: 20, marginBottom: 20,
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

        {/* External Factors */}
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>External Factors & Controls</h3>
        <table className="slds-table" style={{ marginBottom: 0 }}>
          <thead>
            <tr><th>Factor</th><th>Description</th><th style={{ width: 80, textAlign: 'center' }}>Status</th></tr>
          </thead>
          <tbody>
            {[
              { key: 'seasonality', label: 'Seasonality', desc: 'Auto-captured by time-varying intercept (knots configuration above)' },
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
