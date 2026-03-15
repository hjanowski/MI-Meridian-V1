import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateSyntheticData, validateData, CHANNELS } from '../data/dataGenerator';
import Papa from 'papaparse';
import {
  Database, CheckCircle, AlertTriangle, XCircle, ArrowRight, ArrowLeft,
  Loader, CloudLightning, FileSpreadsheet, Upload, FileWarning, Trash2, Download,
} from 'lucide-react';

const WIZARD_STEPS_SYNTHETIC = ['Source', 'Look-back Window', 'Preview', 'Validation'];
const WIZARD_STEPS_CSV = ['Source', 'Upload CSV', 'Preview', 'Validation'];

function getLookbackDateRange(years) {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - years);
  return {
    from: start.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

const LOOKBACK_OPTIONS = [1, 2, 3, 4].map((years) => {
  const range = getLookbackDateRange(years);
  return {
    years,
    label: years + ' Year' + (years > 1 ? 's' : ''),
    weeks: years * 52,
    range,
    desc: years * 52 + ' weeks of weekly data across 15 DMAs with 8 media channels.',
    details: [
      years * 52 + ' weeks of history (' + range.from + ' to ' + range.to + ')',
      '15 DMAs (top US markets by population)',
      '8 media channels with spend + impressions',
      'Population data per DMA',
      'Revenue KPI with natural seasonality',
    ],
    badge: years >= 2 ? 'success' : 'warning',
    badgeLabel: years >= 3 ? 'Recommended' : years >= 2 ? 'Compliant' : 'Minimum',
  };
});

// Known column name aliases for Meridian-compatible CSVs
const DATE_ALIASES = ['date', 'time', 'week', 'period', 'week_start', 'date_week', 'time_period'];
const GEO_ALIASES = ['geo', 'geography', 'region', 'dma', 'market', 'geo_code', 'geo_name', 'location', 'state', 'city'];
const KPI_ALIASES = ['kpi', 'revenue', 'conversions', 'sales', 'target', 'kpi_revenue', 'kpi_conversions', 'response'];
const POPULATION_ALIASES = ['population', 'pop', 'population_scaling', 'geo_population'];
const SPEND_SUFFIXES = ['_spend', '_cost', '_investment', '_media_spend'];
const IMPRESSION_SUFFIXES = ['_impressions', '_imps', '_imp', '_views'];

function findColumn(headers, aliases) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function findSpendColumns(headers) {
  return headers.filter((h) => {
    const l = h.toLowerCase().trim();
    return SPEND_SUFFIXES.some((s) => l.endsWith(s)) || l.includes('spend') || l.includes('cost');
  });
}

function findImpressionColumns(headers) {
  return headers.filter((h) => {
    const l = h.toLowerCase().trim();
    return IMPRESSION_SUFFIXES.some((s) => l.endsWith(s)) || l.includes('impression') || l.includes('imps');
  });
}

function isValidDate(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function isNumeric(val) {
  if (val === null || val === undefined || val === '') return false;
  const cleaned = String(val).replace(/[$,\s]/g, '');
  return !isNaN(Number(cleaned)) && cleaned !== '';
}

function parseNumeric(val) {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[$,\s]/g, '');
  return Number(cleaned) || 0;
}

/**
 * Validates CSV structure and content for Meridian compatibility.
 * Returns { valid, issues, parsedMeta } where issues describes what's wrong and why.
 */
function validateCSVForMeridian(parsed) {
  const issues = [];
  const { data, meta } = parsed;
  const headers = meta.fields || [];

  if (!headers.length || headers.length < 3) {
    issues.push({
      severity: 'error', code: 'NO_HEADERS',
      title: 'Missing or insufficient column headers',
      detail: `Found ${headers.length} column(s). Meridian requires at minimum: a date column, a KPI column, and at least one media spend column.`,
      recommendation: 'Ensure your CSV has a header row with descriptive column names.',
    });
    return { valid: false, issues, parsedMeta: null };
  }

  // Check for empty dataset
  const rows = data.filter((r) => Object.values(r).some((v) => v !== '' && v !== null && v !== undefined));
  if (rows.length === 0) {
    issues.push({
      severity: 'error', code: 'EMPTY_DATA',
      title: 'CSV file contains no data rows',
      detail: 'The uploaded file has headers but zero data rows.',
      recommendation: 'Upload a CSV with actual data below the header row.',
    });
    return { valid: false, issues, parsedMeta: null };
  }

  // Identify columns
  const dateCol = findColumn(headers, DATE_ALIASES);
  const geoCol = findColumn(headers, GEO_ALIASES);
  const kpiCol = findColumn(headers, KPI_ALIASES);
  const popCol = findColumn(headers, POPULATION_ALIASES);
  const spendCols = findSpendColumns(headers);
  const impressionCols = findImpressionColumns(headers);

  if (!dateCol) {
    issues.push({
      severity: 'error', code: 'MISSING_DATE_COLUMN',
      title: 'No date/time column found',
      detail: `Could not identify a date column. Looked for: ${DATE_ALIASES.join(', ')}. Found headers: ${headers.join(', ')}`,
      recommendation: 'Add a column named "date", "time", or "week" containing weekly date values (e.g., 2024-01-01).',
    });
  }

  if (!kpiCol) {
    issues.push({
      severity: 'error', code: 'MISSING_KPI_COLUMN',
      title: 'No KPI/target column found',
      detail: `Could not identify a KPI column. Looked for: ${KPI_ALIASES.join(', ')}. Found headers: ${headers.join(', ')}`,
      recommendation: 'Add a column named "revenue", "kpi", "conversions", or "sales" containing your target variable.',
    });
  }

  if (spendCols.length === 0) {
    issues.push({
      severity: 'error', code: 'NO_MEDIA_SPEND',
      title: 'No media spend columns found',
      detail: `Could not identify any media spend columns. Looked for column names ending in: ${SPEND_SUFFIXES.join(', ')} or containing "spend" or "cost". Found headers: ${headers.join(', ')}`,
      recommendation: 'Add columns for media spend per channel (e.g., "paid_search_spend", "social_media_spend").',
    });
  }

  if (!geoCol) {
    issues.push({
      severity: 'warning', code: 'NO_GEO_COLUMN',
      title: 'No geographic column found',
      detail: `Meridian performs best with geo-level data. Looked for: ${GEO_ALIASES.join(', ')}. Your data will be treated as national-level.`,
      recommendation: 'For better model accuracy, add a "geo" or "dma" column with geographic breakdowns.',
    });
  }

  if (!popCol) {
    issues.push({
      severity: 'warning', code: 'NO_POPULATION_COLUMN',
      title: 'No population column found',
      detail: 'Population data helps Meridian scale media effects across geographies of different sizes.',
      recommendation: 'Add a "population" column with the population for each geographic region.',
    });
  }

  if (impressionCols.length === 0 && spendCols.length > 0) {
    issues.push({
      severity: 'warning', code: 'NO_IMPRESSIONS',
      title: 'No impression columns found',
      detail: 'Impression data improves model accuracy by separating spend efficiency from media effect.',
      recommendation: 'Add impression columns (e.g., "paid_search_impressions") alongside spend columns.',
    });
  }

  // Stop here if we can't even find the basic columns
  if (!dateCol || !kpiCol || spendCols.length === 0) {
    return { valid: false, issues, parsedMeta: null };
  }

  // Validate date values
  let invalidDateCount = 0;
  let dates = [];
  rows.forEach((row, i) => {
    if (!isValidDate(row[dateCol])) {
      invalidDateCount++;
    } else {
      dates.push(new Date(row[dateCol]));
    }
  });
  if (invalidDateCount > 0) {
    const pct = ((invalidDateCount / rows.length) * 100).toFixed(1);
    issues.push({
      severity: invalidDateCount > rows.length * 0.1 ? 'error' : 'warning',
      code: 'INVALID_DATES',
      title: `${invalidDateCount} invalid date value(s) found (${pct}% of rows)`,
      detail: `The "${dateCol}" column contains ${invalidDateCount} value(s) that cannot be parsed as dates. Example: "${rows.find((r) => !isValidDate(r[dateCol]))?.[dateCol] || 'N/A'}"`,
      recommendation: 'Use ISO date format (YYYY-MM-DD) for all date values. Remove or fix invalid entries.',
    });
  }

  // Validate KPI values
  let invalidKPICount = 0;
  let negativeKPICount = 0;
  rows.forEach((row) => {
    if (!isNumeric(row[kpiCol])) {
      invalidKPICount++;
    } else if (parseNumeric(row[kpiCol]) < 0) {
      negativeKPICount++;
    }
  });
  if (invalidKPICount > 0) {
    issues.push({
      severity: invalidKPICount > rows.length * 0.05 ? 'error' : 'warning',
      code: 'INVALID_KPI_VALUES',
      title: `${invalidKPICount} non-numeric KPI value(s) in "${kpiCol}"`,
      detail: `Found ${invalidKPICount} row(s) where the KPI column contains non-numeric values. Example: "${rows.find((r) => !isNumeric(r[kpiCol]))?.[kpiCol] || 'N/A'}"`,
      recommendation: 'Ensure all KPI values are numeric. Remove currency symbols, commas, or text.',
    });
  }
  if (negativeKPICount > 0) {
    issues.push({
      severity: 'warning', code: 'NEGATIVE_KPI',
      title: `${negativeKPICount} negative KPI value(s) found`,
      detail: 'Meridian expects non-negative KPI values (revenue or conversions).',
      recommendation: 'Review and correct negative KPI values in your dataset.',
    });
  }

  // Validate spend columns
  spendCols.forEach((col) => {
    let invalidCount = 0;
    let negativeCount = 0;
    rows.forEach((row) => {
      if (row[col] !== '' && row[col] !== null && row[col] !== undefined) {
        if (!isNumeric(row[col])) invalidCount++;
        else if (parseNumeric(row[col]) < 0) negativeCount++;
      }
    });
    if (invalidCount > rows.length * 0.05) {
      issues.push({
        severity: 'error', code: 'INVALID_SPEND_' + col.toUpperCase(),
        title: `Non-numeric values in spend column "${col}"`,
        detail: `${invalidCount} row(s) have non-numeric values in "${col}".`,
        recommendation: `Ensure all values in "${col}" are numeric (no text, symbols, or blanks).`,
      });
    }
    if (negativeCount > 0) {
      issues.push({
        severity: 'warning', code: 'NEGATIVE_SPEND',
        title: `${negativeCount} negative spend value(s) in "${col}"`,
        detail: 'Media spend should be non-negative.',
        recommendation: `Review negative values in "${col}".`,
      });
    }
  });

  // Check time frequency (should be roughly weekly)
  if (dates.length > 1) {
    dates.sort((a, b) => a - b);
    const diffs = [];
    for (let i = 1; i < dates.length; i++) {
      diffs.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const uniqueDiffs = [...new Set(diffs.map((d) => Math.round(d)))];
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    if (avgDiff < 5) {
      issues.push({
        severity: 'warning', code: 'DAILY_DATA',
        title: 'Data appears to be daily rather than weekly',
        detail: `Average interval between dates is ${avgDiff.toFixed(1)} days. Meridian expects weekly data.`,
        recommendation: 'Aggregate your data to weekly frequency before uploading.',
      });
    } else if (avgDiff > 14) {
      issues.push({
        severity: 'warning', code: 'NON_WEEKLY_DATA',
        title: 'Data does not appear to be weekly',
        detail: `Average interval between dates is ${avgDiff.toFixed(1)} days. Meridian expects weekly data (7-day intervals).`,
        recommendation: 'Resample your data to weekly frequency.',
      });
    }
  }

  // Check for duplicate rows
  const rowKeys = rows.map((r) => `${r[dateCol]}|${geoCol ? r[geoCol] : 'national'}`);
  const duplicateCount = rowKeys.length - new Set(rowKeys).size;
  if (duplicateCount > 0) {
    issues.push({
      severity: 'warning', code: 'DUPLICATE_ROWS',
      title: `${duplicateCount} duplicate date-geo combination(s)`,
      detail: 'Each combination of date and geography should appear exactly once.',
      recommendation: 'Remove or aggregate duplicate rows.',
    });
  }

  // Count unique dates and geos for time span and geo checks
  const uniqueDates = [...new Set(rows.map((r) => r[dateCol]).filter(Boolean))];
  const uniqueGeos = geoCol ? [...new Set(rows.map((r) => r[geoCol]).filter(Boolean))] : ['national'];
  const numWeeks = uniqueDates.length;
  const numGeos = uniqueGeos.length;

  // Build parsed metadata
  const parsedMeta = {
    dateCol, geoCol, kpiCol, popCol, spendCols, impressionCols,
    headers, rows, numWeeks, numGeos, uniqueDates, uniqueGeos,
    totalRows: rows.length,
  };

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    parsedMeta,
  };
}

/**
 * Converts parsed CSV data into the same internal format as the synthetic data generator
 * so it works with the rest of the pipeline (validation, training, dashboards).
 */
function convertCSVToInternalFormat(parsedMeta) {
  const { dateCol, geoCol, kpiCol, popCol, spendCols, impressionCols, rows, uniqueDates, uniqueGeos } = parsedMeta;

  // Derive channel info from spend columns
  const channels = spendCols.map((col) => {
    const cleanName = col.replace(/_spend|_cost|_investment|_media_spend/gi, '').replace(/_/g, ' ');
    const key = col.replace(/_spend|_cost|_investment|_media_spend/gi, '').toLowerCase().replace(/\s+/g, '_');
    const impCol = impressionCols.find((ic) => ic.toLowerCase().includes(key));
    return { name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1), key, spendCol: col, impCol, avgCPM: 20, avgROI: 1.5 };
  });

  // Build geo list
  const geos = uniqueGeos.map((g) => ({ name: g, key: g.toLowerCase().replace(/\s+/g, '_'), pop: 0 }));

  // Build rows in the internal format
  const internalRows = [];
  const channelStats = {};
  channels.forEach((ch) => {
    channelStats[ch.key] = { name: ch.name, totalSpend: 0, totalImpressions: 0, totalContribution: 0, weeklySpend: [], weeklyContribution: [], avgROI: ch.avgROI, alpha: 0.5, ec: 0.7, slope: 1.0 };
  });

  const geoStats = {};
  geos.forEach((g) => { geoStats[g.key] = { name: g.name, population: g.pop, totalKPI: 0, weeks: [] }; });

  // Determine population per geo
  if (popCol) {
    rows.forEach((row) => {
      const geoKey = geoCol ? row[geoCol].toLowerCase().replace(/\s+/g, '_') : 'national';
      const pop = parseNumeric(row[popCol]);
      if (geoStats[geoKey] && pop > geoStats[geoKey].population) {
        geoStats[geoKey].population = pop;
        const geo = geos.find((g) => g.key === geoKey);
        if (geo) geo.pop = pop;
      }
    });
  }

  const sortedDates = [...uniqueDates].sort();

  rows.forEach((row) => {
    const geoKey = geoCol ? row[geoCol].toLowerCase().replace(/\s+/g, '_') : 'national';
    const geoName = geoCol ? row[geoCol] : 'National';
    const kpi = parseNumeric(row[kpiCol]);
    const population = popCol ? parseNumeric(row[popCol]) : 0;

    const channelData = {};
    channels.forEach((ch) => {
      const spend = parseNumeric(row[ch.spendCol]);
      const impressions = ch.impCol ? parseNumeric(row[ch.impCol]) : Math.round((spend / ch.avgCPM) * 1000);
      channelData[ch.key] = { spend: Math.round(spend), impressions: Math.round(impressions), contribution: Math.round(spend * ch.avgROI * 0.01) };
      channelStats[ch.key].totalSpend += spend;
      channelStats[ch.key].totalImpressions += impressions;
      channelStats[ch.key].totalContribution += spend * ch.avgROI * 0.01;
      channelStats[ch.key].weeklySpend.push(spend);
      channelStats[ch.key].weeklyContribution.push(spend * ch.avgROI * 0.01);
    });

    if (geoStats[geoKey]) {
      geoStats[geoKey].totalKPI += kpi;
      geoStats[geoKey].weeks.push({ week: row[dateCol], kpi });
    }

    internalRows.push({ time: row[dateCol], geo: geoKey, geoName, population, kpi, ...channelData });
  });

  // Compute average CPMs
  channels.forEach((ch) => {
    const stats = channelStats[ch.key];
    if (stats.totalImpressions > 0) {
      ch.avgCPM = Math.round((stats.totalSpend / stats.totalImpressions) * 1000);
    }
  });

  // Generate placeholder first-party data
  const weeksCount = uniqueDates.length;
  const firstPartyData = {
    crmSegments: [
      { name: 'High-Value Customers', size: 125000, avgLTV: 2400 },
      { name: 'At-Risk Churners', size: 45000, avgLTV: 800 },
      { name: 'New Prospects', size: 310000, avgLTV: 350 },
      { name: 'Loyal Repeat Buyers', size: 89000, avgLTV: 1800 },
    ],
    engagementScores: { avgScore: 72, distribution: [
      { range: '0-20', pct: 8 }, { range: '21-40', pct: 15 }, { range: '41-60', pct: 25 },
      { range: '61-80', pct: 32 }, { range: '81-100', pct: 20 },
    ]},
    conversionPaths: { avgTouchpoints: 4.2, topPaths: [
      { path: 'Google Ads > Meta Ads > Email > Purchase', pct: 18 },
      { path: 'TikTok Ads > Google Ads > Purchase', pct: 14 },
      { path: 'Meta Ads > YouTube Ads > Google Ads > Purchase', pct: 12 },
      { path: 'Email > Google Ads > Purchase', pct: 11 },
      { path: 'Direct > Purchase', pct: 9 },
    ]},
    firstPartyChannels: {
      email: { totalSent: 90000 * weeksCount, totalOpened: Math.round(90000 * weeksCount * 0.28), openRate: 0.28, weeklySent: 90000 },
      whatsapp: { totalSent: 48000 * weeksCount, totalOpened: Math.round(48000 * weeksCount * 0.90), openRate: 0.90, weeklySent: 48000 },
      sms: { totalSent: 72000 * weeksCount, totalOpened: Math.round(72000 * weeksCount * 0.95), openRate: 0.95, weeklySent: 72000 },
    },
  };

  return {
    profile: 'csv_upload',
    rows: internalRows,
    weeks: sortedDates,
    numWeeks: uniqueDates.length,
    numGeos: uniqueGeos.length,
    numChannels: channels.length,
    channels: channels.map((c) => ({ ...c, stats: channelStats[c.key] })),
    geos: geos.map((g) => ({ ...g, stats: geoStats[g.key] })),
    firstPartyData,
    summary: {
      totalRows: internalRows.length,
      dateRange: sortedDates[0] + ' to ' + sortedDates[sortedDates.length - 1],
      totalSpend: Object.values(channelStats).reduce((s, c) => s + c.totalSpend, 0),
      totalKPI: Object.values(geoStats).reduce((s, g) => s + g.totalKPI, 0),
    },
  };
}


export default function PipelinePage() {
  const { state, dispatch } = useApp();
  const [wizardStep, setWizardStep] = useState(0);
  const [sourceType, setSourceType] = useState('synthetic'); // 'synthetic' or 'csv'
  const [selectedLookback, setSelectedLookback] = useState(null);
  const [pipelineName, setPipelineName] = useState('MI_Meridian_Pipeline_01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [validation, setValidation] = useState(null);

  // CSV-specific state
  const [csvFile, setCsvFile] = useState(null);
  const [csvParseResult, setCsvParseResult] = useState(null);
  const [csvFormatIssues, setCsvFormatIssues] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const WIZARD_STEPS = sourceType === 'csv' ? WIZARD_STEPS_CSV : WIZARD_STEPS_SYNTHETIC;

  const handleGenerateData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const data = generateSyntheticData(null, selectedLookback);
      setGeneratedData(data);
      setIsProcessing(false);
      setWizardStep(2);
    }, 1500);
  };

  const handleDownloadData = () => {
    if (!generatedData) return;
    const headers = ['time', 'geo', 'geoName', 'population', 'kpi'];
    generatedData.channels.forEach((ch) => {
      headers.push(ch.key + '_spend', ch.key + '_impressions');
    });
    const csvRows = [headers.join(',')];
    generatedData.rows.forEach((row) => {
      const values = [row.time, row.geo, row.geoName, row.population, row.kpi];
      generatedData.channels.forEach((ch) => {
        values.push(row[ch.key]?.spend || 0, row[ch.key]?.impressions || 0);
      });
      csvRows.push(values.join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meridian_synthetic_data_' + selectedLookback + 'yr.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      setCsvFormatIssues([{
        severity: 'error', code: 'INVALID_FILE_TYPE',
        title: 'Invalid file type',
        detail: `Expected a .csv file, got "${file?.name || 'unknown'}".`,
        recommendation: 'Please upload a file with a .csv extension.',
      }]);
      return;
    }

    setCsvFile(file);
    setCsvFormatIssues(null);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const { valid, issues, parsedMeta } = validateCSVForMeridian(results);
        setCsvParseResult(parsedMeta);
        setCsvFormatIssues(issues);

        if (valid && parsedMeta) {
          const data = convertCSVToInternalFormat(parsedMeta);
          setGeneratedData(data);
        }
        setIsProcessing(false);
      },
      error: (err) => {
        setCsvFormatIssues([{
          severity: 'error', code: 'PARSE_ERROR',
          title: 'Failed to parse CSV file',
          detail: `Parser error: ${err.message}`,
          recommendation: 'Ensure the file is a valid CSV with comma-separated values and UTF-8 encoding.',
        }]);
        setIsProcessing(false);
      },
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCSVUpload(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };

  const handleValidate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const results = validateData(generatedData);
      setValidation(results);
      dispatch({ type: 'SET_PIPELINE_DATA', payload: generatedData });
      dispatch({ type: 'SET_COMPLIANCE_LEVEL', payload: sourceType === 'csv' ? 'csv_upload' : selectedLookback + '_year' });
      dispatch({ type: 'SET_PIPELINE_NAME', payload: pipelineName });
      dispatch({ type: 'SET_VALIDATION_RESULTS', payload: results });
      dispatch({ type: 'SET_LOOKBACK_YEARS', payload: selectedLookback || Math.round(generatedData.numWeeks / 52) });
      setIsProcessing(false);
      setWizardStep(3);
    }, 2000);
  };

  const handleProceed = () => {
    dispatch({ type: 'SET_STEP', payload: 'config' });
  };

  const resetAll = () => {
    setWizardStep(0);
    setSelectedLookback(null);
    setGeneratedData(null);
    setValidation(null);
    setCsvFile(null);
    setCsvParseResult(null);
    setCsvFormatIssues(null);
  };

  const hasBlockingCSVErrors = csvFormatIssues && csvFormatIssues.some((i) => i.severity === 'error');

  return (
    <div className="animate-slide-in">
      {/* Page header */}
      <div className="sf-page-header">
        <div className="sf-page-header-left">
          <div className="sf-page-icon" style={{ background: '#032D60' }}>
            <Database size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="sf-page-title">Data Ingestion</h1>
            <p className="sf-page-subtitle">Create a new pipeline to ingest marketing data for Meridian analysis</p>
          </div>
        </div>
        <div className="sf-page-actions">
          <button className="slds-button slds-button_outline-brand" onClick={resetAll}>
            <Database size={14} /> New Pipeline
          </button>
        </div>
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
              <div
                onClick={() => setSourceType('synthetic')}
                style={{
                  border: `2px solid ${sourceType === 'synthetic' ? '#0176d3' : '#e5e5e5'}`,
                  borderRadius: 8, padding: 16, cursor: 'pointer',
                  background: sourceType === 'synthetic' ? '#e5f5fe' : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CloudLightning size={20} color={sourceType === 'synthetic' ? '#0176d3' : '#706e6b'} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: sourceType === 'synthetic' ? '#181818' : '#706e6b' }}>Synthetic Data Generator</span>
                </div>
                <p style={{ fontSize: 12, color: '#706e6b' }}>Generate realistic marketing mix data for Meridian analysis with configurable compliance levels.</p>
              </div>
              <div
                onClick={() => setSourceType('csv')}
                style={{
                  border: `2px solid ${sourceType === 'csv' ? '#0176d3' : '#e5e5e5'}`,
                  borderRadius: 8, padding: 16, cursor: 'pointer',
                  background: sourceType === 'csv' ? '#e5f5fe' : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FileSpreadsheet size={20} color={sourceType === 'csv' ? '#0176d3' : '#706e6b'} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: sourceType === 'csv' ? '#181818' : '#706e6b' }}>CSV / File Upload</span>
                </div>
                <p style={{ fontSize: 12, color: '#706e6b' }}>Upload your own marketing data CSV file. Meridian-format validation will be applied.</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="slds-button slds-button_brand" onClick={() => setWizardStep(1)} disabled={!pipelineName}>
              {sourceType === 'csv' ? <>Next: Upload CSV <ArrowRight size={14} /></> : <>Next: Select Look-back Window <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Look-back Window Selection (Synthetic) */}
      {wizardStep === 1 && sourceType === 'synthetic' && (
        <div className="animate-fade-in">
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h2 className="slds-text-heading_medium" style={{ marginBottom: 4 }}>Select Look-back Window</h2>
            <p style={{ fontSize: 13, color: '#706e6b' }}>
              Choose the period of historical data to generate. Longer windows provide more robust Meridian model results.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {LOOKBACK_OPTIONS.map((opt) => (
              <div key={opt.years} className="slds-card" onClick={() => setSelectedLookback(opt.years)} style={{
                cursor: 'pointer', borderColor: selectedLookback === opt.years ? '#0176d3' : undefined,
                borderWidth: selectedLookback === opt.years ? 2 : 1,
                boxShadow: selectedLookback === opt.years ? '0 0 0 1px #0176d3' : undefined,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{opt.label}</h3>
                  <span className={`slds-badge slds-badge_${opt.badge}`}>{opt.badgeLabel}</span>
                </div>
                <p style={{ fontSize: 13, color: '#706e6b', marginBottom: 12 }}>{opt.desc}</p>
                <div style={{ fontSize: 12, color: '#0176d3', fontWeight: 600, marginBottom: 8 }}>
                  {opt.range.from} to {opt.range.to}
                </div>
                <ul style={{ fontSize: 12, color: '#706e6b', lineHeight: 1.8, paddingLeft: 16 }}>
                  {opt.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="slds-button slds-button_neutral" onClick={() => setWizardStep(0)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button className="slds-button slds-button_brand" onClick={handleGenerateData} disabled={!selectedLookback || isProcessing}>
              {isProcessing ? <><Loader size={14} className="animate-pulse" /> Generating Data...</> : <>Generate Data <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: CSV Upload */}
      {wizardStep === 1 && sourceType === 'csv' && (
        <div className="animate-fade-in">
          <div className="slds-card" style={{ marginBottom: 16 }}>
            <h2 className="slds-text-heading_medium" style={{ marginBottom: 4 }}>Upload CSV File</h2>
            <p style={{ fontSize: 13, color: '#706e6b' }}>
              Upload a CSV file containing your marketing mix data. The file will be validated for Meridian compatibility.
            </p>
          </div>

          {/* Expected format info */}
          <div className="slds-notify slds-notify_info" style={{ marginBottom: 16 }}>
            <Database size={18} />
            <div>
              <strong>Expected CSV Format for Meridian</strong>
              <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.8 }}>
                <strong>Required columns:</strong> date/time column (e.g., <code>date</code>, <code>week</code>), KPI column (e.g., <code>revenue</code>, <code>kpi</code>), at least one media spend column (e.g., <code>paid_search_spend</code>)<br />
                <strong>Recommended columns:</strong> geographic breakdown (<code>geo</code>, <code>dma</code>), population (<code>population</code>), impression columns (e.g., <code>paid_search_impressions</code>)<br />
                <strong>Frequency:</strong> Weekly data (one row per week per geo)<br />
                <strong>Minimum:</strong> 2 years (104 weeks) for geo-level, 3 years (156 weeks) for national-level
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="slds-card"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              cursor: 'pointer',
              border: isDragging ? '2px dashed #0176d3' : '2px dashed #c9c9c9',
              background: isDragging ? '#e5f5fe' : csvFile ? '#f3f3f3' : 'white',
              textAlign: 'center',
              padding: '40px 24px',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files[0]) handleCSVUpload(e.target.files[0]); }}
            />
            {isProcessing ? (
              <div>
                <Loader size={40} className="animate-pulse" style={{ color: '#0176d3', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Parsing and validating CSV...</div>
              </div>
            ) : csvFile ? (
              <div>
                <FileSpreadsheet size={40} style={{ color: '#0176d3', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>{csvFile.name}</div>
                <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                  {(csvFile.size / 1024).toFixed(1)} KB
                  {csvParseResult && ` | ${csvParseResult.totalRows} rows | ${csvParseResult.headers.length} columns`}
                </div>
                <button
                  className="slds-button slds-button_neutral"
                  style={{ marginTop: 12 }}
                  onClick={(e) => { e.stopPropagation(); setCsvFile(null); setCsvParseResult(null); setCsvFormatIssues(null); setGeneratedData(null); }}
                >
                  <Trash2 size={14} /> Remove & Upload Different File
                </button>
              </div>
            ) : (
              <div>
                <Upload size={40} style={{ color: '#706e6b', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Drop your CSV file here or click to browse</div>
                <div style={{ fontSize: 12, color: '#706e6b', marginTop: 4 }}>
                  Accepts .csv files. Maximum recommended size: 50MB
                </div>
              </div>
            )}
          </div>

          {/* CSV Format Validation Results */}
          {csvFormatIssues && csvFormatIssues.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>
                <FileWarning size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                CSV Format Validation
              </h3>
              {csvFormatIssues.map((issue, i) => (
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
            </div>
          )}

          {/* Detected columns summary */}
          {csvParseResult && !hasBlockingCSVErrors && (
            <div className="slds-card" style={{ marginTop: 16 }}>
              <h3 className="slds-text-heading_small" style={{ marginBottom: 12 }}>Detected Column Mapping</h3>
              <table className="slds-table">
                <thead>
                  <tr><th>Role</th><th>Column Detected</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Date / Time</td>
                    <td>{csvParseResult.dateCol || '—'}</td>
                    <td>{csvParseResult.dateCol ? <span className="slds-badge slds-badge_success">Found</span> : <span className="slds-badge slds-badge_error">Missing</span>}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Geography</td>
                    <td>{csvParseResult.geoCol || '—'}</td>
                    <td>{csvParseResult.geoCol ? <span className="slds-badge slds-badge_success">Found</span> : <span className="slds-badge slds-badge_warning">National</span>}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>KPI / Target</td>
                    <td>{csvParseResult.kpiCol || '—'}</td>
                    <td>{csvParseResult.kpiCol ? <span className="slds-badge slds-badge_success">Found</span> : <span className="slds-badge slds-badge_error">Missing</span>}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Population</td>
                    <td>{csvParseResult.popCol || '—'}</td>
                    <td>{csvParseResult.popCol ? <span className="slds-badge slds-badge_success">Found</span> : <span className="slds-badge slds-badge_warning">Missing</span>}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Media Spend Columns</td>
                    <td>{csvParseResult.spendCols.length > 0 ? csvParseResult.spendCols.join(', ') : '—'}</td>
                    <td><span className={`slds-badge slds-badge_${csvParseResult.spendCols.length > 0 ? 'success' : 'error'}`}>{csvParseResult.spendCols.length} found</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Impression Columns</td>
                    <td>{csvParseResult.impressionCols.length > 0 ? csvParseResult.impressionCols.join(', ') : '—'}</td>
                    <td><span className={`slds-badge slds-badge_${csvParseResult.impressionCols.length > 0 ? 'success' : 'warning'}`}>{csvParseResult.impressionCols.length} found</span></td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                <div style={{ background: '#f3f3f3', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>Total Rows</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{csvParseResult.totalRows.toLocaleString()}</div>
                </div>
                <div style={{ background: '#f3f3f3', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>Unique Dates</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{csvParseResult.numWeeks}</div>
                </div>
                <div style={{ background: '#f3f3f3', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#706e6b', textTransform: 'uppercase' }}>Unique Geos</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{csvParseResult.numGeos}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="slds-button slds-button_neutral" onClick={() => setWizardStep(0)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button
              className="slds-button slds-button_brand"
              onClick={() => setWizardStep(2)}
              disabled={!generatedData || hasBlockingCSVErrors}
            >
              Preview Data <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {wizardStep === 2 && generatedData && (
        <div className="animate-fade-in">
          <div className="slds-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="slds-text-heading_medium">Data Preview</h2>
              {sourceType === 'synthetic' && (
                <button className="slds-button slds-button_neutral" onClick={handleDownloadData}>
                  <Download size={14} /> Download CSV
                </button>
              )}
            </div>
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
                Continue to MI Configuration <ArrowRight size={14} />
              </button>
            ) : (
              <button className="slds-button slds-button_neutral" onClick={() => { setWizardStep(1); setGeneratedData(null); setValidation(null); }}>
                {sourceType === 'csv' ? 'Upload Different File' : 'Choose Different Look-back Window'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
