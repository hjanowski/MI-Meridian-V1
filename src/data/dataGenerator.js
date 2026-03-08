const CHANNELS = [
  { name: 'Meta Ads', key: 'meta_ads', avgCPM: 28, avgROI: 1.9 },
  { name: 'Google Ads', key: 'google_ads', avgCPM: 45, avgROI: 2.8 },
  { name: 'LinkedIn Ads', key: 'linkedin_ads', avgCPM: 35, avgROI: 1.6 },
  { name: 'TikTok Ads', key: 'tiktok_ads', avgCPM: 12, avgROI: 1.2 },
  { name: 'Amazon Ads', key: 'amazon_ads', avgCPM: 22, avgROI: 2.1 },
  { name: 'YouTube Ads', key: 'youtube_ads', avgCPM: 18, avgROI: 1.8 },
  { name: 'Bing Ads', key: 'bing_ads', avgCPM: 15, avgROI: 1.1 },
  { name: 'X Ads', key: 'x_ads', avgCPM: 10, avgROI: 0.8 },
];

const GEOS = [
  { name: 'New York DMA', key: 'ny', pop: 20200000 },
  { name: 'Los Angeles DMA', key: 'la', pop: 13200000 },
  { name: 'Chicago DMA', key: 'chi', pop: 9500000 },
  { name: 'Houston DMA', key: 'hou', pop: 7100000 },
  { name: 'Phoenix DMA', key: 'phx', pop: 4900000 },
  { name: 'Philadelphia DMA', key: 'phi', pop: 6200000 },
  { name: 'San Antonio DMA', key: 'sat', pop: 2600000 },
  { name: 'San Diego DMA', key: 'sd', pop: 3300000 },
  { name: 'Dallas DMA', key: 'dal', pop: 7600000 },
  { name: 'San Francisco DMA', key: 'sf', pop: 4700000 },
  { name: 'Seattle DMA', key: 'sea', pop: 4000000 },
  { name: 'Denver DMA', key: 'den', pop: 2900000 },
  { name: 'Boston DMA', key: 'bos', pop: 4900000 },
  { name: 'Atlanta DMA', key: 'atl', pop: 6100000 },
  { name: 'Miami DMA', key: 'mia', pop: 6200000 },
];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function normalRandom(rng, mean = 0, std = 1) {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * std + mean;
}

function generateWeeks(startDate, numWeeks) {
  const weeks = [];
  const start = new Date(startDate);
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    weeks.push(d.toISOString().split('T')[0]);
  }
  return weeks;
}

function hillFunction(x, ec, slope) {
  if (x <= 0) return 0;
  const xn = Math.pow(x, slope);
  const ecn = Math.pow(ec, slope);
  return xn / (xn + ecn);
}

export function generateSyntheticData(profile, lookbackYears = null) {
  const rng = seededRandom(42);
  let numWeeks, geos, channels, startDate;

  // If lookbackYears is provided, use it to calculate data range from today
  if (lookbackYears) {
    numWeeks = lookbackYears * 52;
    geos = GEOS;
    channels = CHANNELS;
    const today = new Date();
    const start = new Date(today);
    start.setFullYear(start.getFullYear() - lookbackYears);
    // Align to Monday
    const day = start.getDay();
    const diff = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
    start.setDate(start.getDate() + diff);
    startDate = start.toISOString().split('T')[0];
  } else {
    switch (profile) {
      case 'fully_compliant':
        numWeeks = 156; geos = GEOS; channels = CHANNELS; startDate = '2022-01-03';
        break;
      case 'partially_compliant':
        numWeeks = 78; geos = GEOS.slice(0, 3); channels = CHANNELS; startDate = '2024-07-01';
        break;
      case 'non_compliant':
        numWeeks = 26;
        geos = [{ name: 'National', key: 'national', pop: 330000000 }];
        channels = CHANNELS; startDate = '2025-07-01';
        break;
      default:
        throw new Error('Unknown profile: ' + profile);
    }
  }

  const weeks = generateWeeks(startDate, numWeeks);
  const rows = [];
  const channelStats = {};
  const geoStats = {};

  channels.forEach((ch) => {
    channelStats[ch.key] = {
      name: ch.name, totalSpend: 0, totalImpressions: 0, totalContribution: 0,
      weeklySpend: [], weeklyContribution: [], avgROI: ch.avgROI,
      alpha: 0.3 + rng() * 0.5, ec: 0.5 + rng() * 0.5, slope: 1.0,
    };
  });

  geos.forEach((geo) => {
    geoStats[geo.key] = { name: geo.name, population: geo.pop, totalKPI: 0, weeks: [] };
    const baseKPI = (geo.pop / 1000000) * (800 + rng() * 400);

    weeks.forEach((week, wi) => {
      const monthOfYear = new Date(week).getMonth();
      let seasonality = 1.0;
      if (monthOfYear >= 9 && monthOfYear <= 11) seasonality = 1.15 + rng() * 0.15;
      else if (monthOfYear >= 0 && monthOfYear <= 2) seasonality = 0.85 + rng() * 0.05;
      else seasonality = 0.95 + rng() * 0.1;

      let holidayEffect = 0;
      if (monthOfYear === 11 && new Date(week).getDate() > 20) holidayEffect = 0.25;
      if (monthOfYear === 10 && new Date(week).getDate() > 24) holidayEffect = 0.15;

      const trend = 1.0 + (wi / numWeeks) * 0.15;
      let kpi = baseKPI * seasonality * trend * (1 + holidayEffect);
      let totalMediaContribution = 0;
      const channelData = {};

      channels.forEach((ch) => {
        const baseSpend = (geo.pop / 330000000) * (50000 + rng() * 100000) * (ch.avgCPM / 25);
        const spend = Math.max(0, baseSpend * seasonality * (0.7 + rng() * 0.6) * trend);
        const impressions = (spend / ch.avgCPM) * 1000;
        const stats = channelStats[ch.key];
        const normalizedMedia = impressions / (geo.pop / 1000);
        const saturatedEffect = hillFunction(normalizedMedia, stats.ec * 100, stats.slope);
        const contribution = saturatedEffect * spend * (ch.avgROI / 100) * (0.8 + rng() * 0.4);
        totalMediaContribution += contribution;

        channelData[ch.key] = { spend: Math.round(spend), impressions: Math.round(impressions), contribution: Math.round(contribution) };
        stats.totalSpend += spend;
        stats.totalImpressions += impressions;
        stats.totalContribution += contribution;
        stats.weeklySpend.push(spend);
        stats.weeklyContribution.push(contribution);
      });

      kpi += totalMediaContribution;
      kpi *= 1 + normalRandom(rng, 0, 0.03);
      kpi = Math.max(0, Math.round(kpi));

      geoStats[geo.key].totalKPI += kpi;
      geoStats[geo.key].weeks.push({ week, kpi });
      rows.push({ time: week, geo: geo.key, geoName: geo.name, population: geo.pop, kpi, ...channelData });
    });
  });

  // Generate 1st party channel data scaled to look-back window
  const weeksCount = weeks.length;
  const weeklyEmailSent = Math.round(85000 + rng() * 35000);
  const weeklyWhatsAppSent = Math.round(42000 + rng() * 18000);
  const weeklySMSSent = Math.round(65000 + rng() * 25000);
  const emailOpenRate = 0.22 + rng() * 0.12;
  const whatsappOpenRate = 0.85 + rng() * 0.10;
  const smsOpenRate = 0.92 + rng() * 0.06;

  const firstPartyData = {
    conversionPaths: { avgTouchpoints: 4.2, topPaths: [
      { path: 'Google Ads > Meta Ads > Email > Purchase', pct: 18 },
      { path: 'TikTok Ads > Google Ads > Purchase', pct: 14 },
      { path: 'Meta Ads > YouTube Ads > Google Ads > Purchase', pct: 12 },
      { path: 'Email > Google Ads > Purchase', pct: 11 },
      { path: 'Direct > Purchase', pct: 9 },
    ]},
    firstPartyChannels: {
      email: {
        totalSent: weeklyEmailSent * weeksCount,
        totalOpened: Math.round(weeklyEmailSent * weeksCount * emailOpenRate),
        openRate: emailOpenRate,
        weeklySent: weeklyEmailSent,
      },
      whatsapp: {
        totalSent: weeklyWhatsAppSent * weeksCount,
        totalOpened: Math.round(weeklyWhatsAppSent * weeksCount * whatsappOpenRate),
        openRate: whatsappOpenRate,
        weeklySent: weeklyWhatsAppSent,
      },
      sms: {
        totalSent: weeklySMSSent * weeksCount,
        totalOpened: Math.round(weeklySMSSent * weeksCount * smsOpenRate),
        openRate: smsOpenRate,
        weeklySent: weeklySMSSent,
      },
    },
  };

  return {
    profile: lookbackYears ? lookbackYears + '_year' : profile,
    rows, weeks, numWeeks, numGeos: geos.length, numChannels: channels.length,
    channels: channels.map((c) => ({ ...c, stats: channelStats[c.key] })),
    geos: geos.map((g) => ({ ...g, stats: geoStats[g.key] })),
    firstPartyData,
    summary: {
      totalRows: rows.length,
      dateRange: weeks[0] + ' to ' + weeks[weeks.length - 1],
      totalSpend: Object.values(channelStats).reduce((s, c) => s + c.totalSpend, 0),
      totalKPI: Object.values(geoStats).reduce((s, g) => s + g.totalKPI, 0),
    },
  };
}

export function validateData(data) {
  const issues = [];
  const { numWeeks, numGeos, numChannels, rows } = data;

  if (numGeos > 1 && numWeeks < 104) {
    issues.push({
      severity: numWeeks < 52 ? 'error' : 'warning', code: 'INSUFFICIENT_HISTORY',
      title: 'Insufficient Time Series History',
      detail: 'Meridian requires a minimum of 2 years (104 weeks) of weekly data for geo-level models. Your dataset contains only ' + numWeeks + ' weeks (' + (numWeeks / 52).toFixed(1) + ' years).',
      recommendation: 'Extend your data collection period or switch to national-level modeling (requires 3 years minimum).',
    });
  }

  if (numGeos === 1 && numWeeks < 156) {
    issues.push({
      severity: numWeeks < 104 ? 'error' : 'warning', code: 'INSUFFICIENT_HISTORY_NATIONAL',
      title: 'Insufficient History for National Model',
      detail: 'National-level (single geo) models require a minimum of 3 years (156 weeks). Your dataset contains only ' + numWeeks + ' weeks.',
      recommendation: 'Collect at least 3 years of weekly data, or add geo-level breakdown to reduce the minimum to 2 years.',
    });
  }

  if (numGeos === 1) {
    issues.push({
      severity: 'warning', code: 'NO_GEO_BREAKDOWN',
      title: 'No Geographic Breakdown',
      detail: 'Your data is at the national level only. Meridian strongly recommends geo-level data (e.g., DMAs) for tighter credible intervals via its hierarchical Bayesian framework.',
      recommendation: 'Break down data by DMA, state, or region. Recommended: top 50-100 DMAs by population.',
    });
  } else if (numGeos < 10) {
    issues.push({
      severity: 'warning', code: 'LOW_GEO_COUNT',
      title: 'Low Geographic Granularity',
      detail: 'Only ' + numGeos + ' geographic regions provided. Meridian recommends 50-100 DMAs for optimal hierarchical modeling.',
      recommendation: 'Consider adding more geographic regions for tighter confidence intervals.',
    });
  }

  if (numChannels > 20) {
    issues.push({
      severity: 'warning', code: 'TOO_MANY_CHANNELS',
      title: 'Excessive Number of Media Channels',
      detail: numChannels + ' channels detected. Meridian recommends keeping channels below 20.',
      recommendation: 'Merge low-spend or related channels together.',
    });
  }

  const nEffects = numChannels * 2 + 6 + Math.min(numWeeks, 100) + numGeos;
  const nDataPoints = rows.length;
  const ratio = nDataPoints / nEffects;
  if (ratio < 5) {
    issues.push({
      severity: ratio < 3 ? 'error' : 'warning', code: 'LOW_DATA_RATIO',
      title: 'Insufficient Data Points per Model Effect',
      detail: 'Data-to-effects ratio is ' + ratio.toFixed(1) + ':1 (' + nDataPoints + ' data points, ~' + nEffects + ' effects). Meridian recommends at least 5:1.',
      recommendation: 'Add more time periods or geographic regions, or reduce channels.',
    });
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  let overallStatus;
  if (errors.length > 0) overallStatus = 'non_compliant';
  else if (warnings.length > 0) overallStatus = 'partially_compliant';
  else overallStatus = 'fully_compliant';

  return {
    overallStatus, issues, errors, warnings,
    passedChecks: 6 - issues.length, totalChecks: 6,
    canProceed: errors.length === 0,
    summary: { dataPoints: nDataPoints, effects: nEffects, ratio: ratio.toFixed(1), timeSpan: numWeeks + ' weeks (' + (numWeeks / 52).toFixed(1) + ' years)', geoCount: numGeos, channelCount: numChannels },
  };
}

export function generateModelResults(data, config) {
  const rng = seededRandom(123);
  const { channels, weeks, numWeeks } = data;

  const channelROI = channels.map((ch) => {
    const baseROI = ch.avgROI * (0.7 + rng() * 0.6);
    const ci_lower = baseROI * (0.6 + rng() * 0.2);
    const ci_upper = baseROI * (1.2 + rng() * 0.4);
    const mROI = baseROI * (0.4 + rng() * 0.4);
    const totalSpend = ch.stats.totalSpend;
    const contribution = totalSpend * baseROI;
    return {
      channel: ch.name, key: ch.key, roi: baseROI, roi_lower: ci_lower, roi_upper: ci_upper,
      mROI, mROI_lower: mROI * 0.7, mROI_upper: mROI * 1.3,
      totalSpend, contribution, spendShare: 0, contributionShare: 0, effectiveness: contribution,
    };
  });

  const totalSpend = channelROI.reduce((s, c) => s + c.totalSpend, 0);
  const totalContribution = channelROI.reduce((s, c) => s + c.contribution, 0);
  channelROI.forEach((c) => {
    c.spendShare = c.totalSpend / totalSpend;
    c.contributionShare = c.contribution / totalContribution;
  });

  const responseCurves = channels.map((ch) => {
    const stats = ch.stats;
    const maxSpend = stats.totalSpend / numWeeks * 3;
    const points = [];
    for (let i = 0; i <= 50; i++) {
      const spend = (i / 50) * maxSpend;
      const normalizedSpend = spend / (maxSpend * 0.5);
      const response = hillFunction(normalizedSpend, stats.ec, stats.slope) * ch.avgROI * spend * 0.01;
      const lower = response * (0.7 + rng() * 0.1);
      const upper = response * (1.1 + rng() * 0.2);
      points.push({ spend: Math.round(spend), response: Math.round(response), lower: Math.round(lower), upper: Math.round(upper) });
    }
    return { channel: ch.name, key: ch.key, points, currentSpend: Math.round(stats.totalSpend / numWeeks) };
  });

  const adstockCurves = channels.map((ch) => {
    const alpha = ch.stats.alpha;
    const points = [];
    for (let lag = 0; lag <= 12; lag++) points.push({ lag, effect: Math.pow(alpha, lag) });
    return { channel: ch.name, key: ch.key, alpha, points };
  });

  const saturationCurves = channels.map((ch) => {
    const points = [];
    for (let i = 0; i <= 50; i++) {
      const x = (i / 50) * 3;
      points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(hillFunction(x, ch.stats.ec, ch.stats.slope).toFixed(4)) });
    }
    return { channel: ch.name, key: ch.key, ec: ch.stats.ec, slope: ch.stats.slope, points };
  });

  const kpiBreakdown = [];
  const totalKPI = data.summary.totalKPI;
  const baselineRatio = 0.55 + rng() * 0.1;

  weeks.forEach((week, wi) => {
    const monthOfYear = new Date(week).getMonth();
    let seasonality = 1.0;
    if (monthOfYear >= 9) seasonality = 1.15;
    else if (monthOfYear <= 2) seasonality = 0.88;
    const weekKPI = (totalKPI / numWeeks) * seasonality * (0.9 + rng() * 0.2);
    const baseline = weekKPI * baselineRatio;
    const entry = { week, baseline: Math.round(baseline) };
    let remaining = weekKPI - baseline;
    channels.forEach((ch) => {
      const share = ch.stats.totalContribution / channels.reduce((s, c) => s + c.stats.totalContribution, 0);
      entry[ch.key] = Math.round(Math.max(0, remaining * share * (0.7 + rng() * 0.6)));
    });
    kpiBreakdown.push(entry);
  });

  const diagnostics = {
    rHat: parseFloat((1.0 + rng() * 0.02).toFixed(3)),
    effectiveSampleSize: 800 + Math.round(rng() * 400),
    ppp: parseFloat((0.45 + rng() * 0.1).toFixed(3)),
    convergenceStatus: 'PASS', roiPlausibility: 'PASS', priorPosteriorShift: 'PASS', overallStatus: 'PASS',
    chains: 4, warmupSteps: 500, samplingSteps: 500, totalTime: '3m 24s',
  };

  // Add Organic channel for 1st party data when connected
  if (config.connectFirstParty) {
    const organicSpend = 0; // Organic has no media spend
    const organicContribution = totalContribution * (0.08 + rng() * 0.06); // 8-14% of total
    const organicROI = 0;
    channelROI.push({
      channel: 'Organic', key: 'organic', roi: organicROI, roi_lower: 0, roi_upper: 0,
      mROI: 0, mROI_lower: 0, mROI_upper: 0,
      totalSpend: organicSpend, contribution: organicContribution,
      spendShare: 0, contributionShare: organicContribution / (totalContribution + organicContribution),
      effectiveness: organicContribution,
    });
    // Recalculate contribution shares including organic
    const newTotalContribution = channelROI.reduce((s, c) => s + c.contribution, 0);
    channelROI.forEach((c) => {
      c.contributionShare = c.contribution / newTotalContribution;
    });
  }

  const firstPartyEnrichment = config.connectFirstParty ? {
    uplift: parseFloat((0.12 + rng() * 0.08).toFixed(2)),
  } : null;

  return {
    channelROI, responseCurves, adstockCurves, saturationCurves, kpiBreakdown,
    diagnostics, firstPartyEnrichment, totalSpend, totalContribution, totalKPI, baselineRatio,
  };
}

export function generateOptimizationResults(modelResults, budget, scenario) {
  const rng = seededRandom(456);
  const { channelROI } = modelResults;
  const currentTotal = channelROI.reduce((s, c) => s + c.totalSpend, 0);
  const budgetMultiplier = budget / currentTotal;

  const optimized = channelROI.map((ch) => {
    let optimalShift;
    if (ch.mROI > ch.roi * 0.7) optimalShift = 1.1 + rng() * 0.4;
    else optimalShift = 0.5 + rng() * 0.3;

    const optimizedSpend = ch.totalSpend * budgetMultiplier * optimalShift;
    const optimizedContribution = optimizedSpend * ch.roi * (0.9 + rng() * 0.15);
    return {
      channel: ch.channel, key: ch.key,
      currentSpend: Math.round(ch.totalSpend * budgetMultiplier),
      optimizedSpend: Math.round(optimizedSpend),
      currentContribution: Math.round(ch.contribution * budgetMultiplier),
      optimizedContribution: Math.round(optimizedContribution),
      change: ((optimalShift - 1) * 100).toFixed(1),
      roi: ch.roi, mROI: ch.mROI,
    };
  });

  const totalOptimized = optimized.reduce((s, c) => s + c.optimizedSpend, 0);
  optimized.forEach((c) => { c.optimizedSpend = Math.round((c.optimizedSpend / totalOptimized) * budget); });

  const totalOptContrib = optimized.reduce((s, c) => s + c.optimizedContribution, 0);
  const totalCurContrib = optimized.reduce((s, c) => s + c.currentContribution, 0);

  return {
    scenario, budget, channels: optimized,
    totalCurrentSpend: Math.round(budget), totalOptimizedSpend: Math.round(budget),
    totalCurrentContribution: Math.round(totalCurContrib),
    totalOptimizedContribution: Math.round(totalOptContrib),
    uplift: ((totalOptContrib - totalCurContrib) / totalCurContrib * 100).toFixed(1),
    optimizedROI: (totalOptContrib / budget).toFixed(2),
    currentROI: (totalCurContrib / budget).toFixed(2),
  };
}

export { CHANNELS, GEOS };
