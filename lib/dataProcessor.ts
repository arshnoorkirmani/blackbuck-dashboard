export function processData(rawData: any, page: string, loggedInEmail: string, appConfig: any = {}) {
  const role = rawData.role || "AGENT";
  const email = (loggedInEmail || "").toLowerCase();

  // Dynamic config extraction (future proofing)
  const planPointsConfig = appConfig.planPoints || {
    "BONUS": 1,
    "SUPER_BONUS": 2,
    "SUPER_BONUS_PLUS": 3
  };

  // ── STEP 2: PARSE ALL SECTIONS ──
  const parsed = {
    agents: parseAgentRaw(rawData.data?.agentRaw || []),
    tls: parseTlRaw(rawData.data?.tlRaw || []),
    tlTotals: parseTlTotals(rawData.data?.tlRaw || []),
    transactions: parseTeleSalesRaw(rawData.data?.teleSalesRaw || []),
    incentives: parseIncentiveRaw(rawData.data?.incentiveRaw || []),
    appraisals: parseAppraisalRaw(rawData.data?.appraisalRaw || []),
  };

  // ── STEP 3: BUILD LOOKUP MAPS ──
  const agentByEmail = new Map();
  parsed.agents.forEach((row) => {
    const agEmail = String(row[1]).toLowerCase().trim();
    if (agEmail) agentByEmail.set(agEmail, row);
  });

  const incentiveByEmail = new Map();
  parsed.incentives.forEach((row) => {
    const incEmail = String(row[2]).toLowerCase().trim();
    if (incEmail) incentiveByEmail.set(incEmail, row);
  });

  const appraisalByOldId = new Map();
  parsed.appraisals.forEach((row) => {
    const oldId = String(row[0]).trim();
    if (oldId) appraisalByOldId.set(oldId, row);
  });

  const transactionsByAgent = new Map();
  parsed.transactions.forEach((tx) => {
    const agEmail = String(tx[6]).toLowerCase().trim();
    if (agEmail) {
      if (!transactionsByAgent.has(agEmail)) transactionsByAgent.set(agEmail, []);
      transactionsByAgent.get(agEmail).push(tx);
    }
  });

  const tlByName = new Map();
  parsed.tls.forEach((row) => {
    const name = String(row[3]).trim();
    if (name) tlByName.set(name, row);
  });

  // ── STEP 6: BUILD ALL AGENT OBJECTS ──
  const allAgents = new Map();
  agentByEmail.forEach((agentRow, agEmail) => {
    // Filter out Inactive agents globally as per user request
    const status = String(agentRow[6] || "").trim();
    if (status === "Inactive") return;

    const incentiveRow = incentiveByEmail.get(agEmail) || null;
    const appraisalRow = appraisalByOldId.get(String(agentRow[0]).trim()) || null;
    const transactions = transactionsByAgent.get(agEmail) || [];
    const agentObj = buildAgentObject(agEmail, agentRow, incentiveRow, appraisalRow, transactions, planPointsConfig);
    allAgents.set(agEmail, agentObj);
  });

  // ── STEP 7: BUILD TEAM OBJECTS ──
  const allTeams: any[] = [];
  tlByName.forEach((tlRow, tlName) => {
    const teamAgents = Array.from(allAgents.values()).filter(a => a.tlName === tlName);
    allTeams.push(buildTeamObject(tlName, tlRow, teamAgents));
  });

  // ── STEP 8: BUILD ANALYTICS OBJECT ──
  const analytics = buildAnalytics(allAgents, allTeams, parsed.tlTotals);

  // ── STEP 9: FINAL RETURN BASED ON PAGE + ROLE ──
  const loggedInAgent = allAgents.get(email) || null;
  const loggedInTL = allTeams.find(t => t.tlName === loggedInAgent?.tlName) || null;

  if (page === "dashboard") {
    if (role === "AGENT") {
      return {
        page: "dashboard",
        role,
        configUsed: appConfig,
        agent: loggedInAgent,
        team: loggedInTL ? {
          tlName: loggedInTL.tlName,
          rank: loggedInTL.rank,
          performance: loggedInTL.performance,
          totals: loggedInTL.totals,
          salesSummary: loggedInTL.salesSummary,
          leaderboard: loggedInTL.leaderboard,
        } : null,
        meta: rawData.meta,
      };
    }
    if (role === "TL") {
      const myTeam = allTeams.find(t => t.agents.some((a: any) => a.email === email)) || null;
      return {
        page: "dashboard",
        role,
        configUsed: appConfig,
        agent: loggedInAgent,
        team: myTeam,
        quickStats: myTeam ? {
          teamRank: myTeam.rank,
          totalSoldPoints: myTeam.totals.totalSalePoints,
          achPercent: myTeam.performance.achPercent,
          activeAgents: myTeam.totals.activeCount,
          drrPoints: myTeam.performance.drr,
        } : null,
        meta: rawData.meta,
      };
    }
    if (role === "ADMIN") {
      return {
        page: "dashboard",
        role,
        configUsed: appConfig,
        agent: loggedInAgent,
        allTeams,
        analytics,
        meta: rawData.meta,
      };
    }
  }

  if (page === "team") {
    if (role === "AGENT") {
      return { page: "team", role, team: loggedInTL, meta: rawData.meta };
    }
    if (role === "TL") {
      const myTeam = allTeams.find(t => t.agents.some((a: any) => a.email === email)) || null;
      return {
        page: "team",
        role,
        team: myTeam,
        allTeams: allTeams.map(t => ({
          tlName: t.tlName,
          rank: t.rank,
          performance: t.performance,
          totals: t.totals,
        })),
        meta: rawData.meta,
      };
    }
    if (role === "ADMIN") {
      return { page: "team", role, allTeams, meta: rawData.meta };
    }
  }

  if (page === "analytics") {
    return {
      page: "analytics",
      role,
      analytics,
      highlight: role === "AGENT" ? {
        agentEmail: email,
        agentEmpId: loggedInAgent?.empId,
        agentRank: loggedInAgent?.performance.rank,
        teamName: loggedInAgent?.tlName,
      } : null,
      meta: rawData.meta,
    };
  }

  return { error: "Invalid page or role" };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ## PARSER HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseAgentRaw(raw: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(2).filter(row => {
    const id = String(row[0] || "").trim();
    return id.length > 0 && /^[A-Za-z0-9]+$/.test(id) && id !== "EMP_ID";
  });
}

function parseTlRaw(raw: any[]) {
  if (!Array.isArray(raw) || raw.length < 4) return [];
  return raw.slice(3, 21).filter(row => !isNaN(parseNum(row[2])) && String(row[3]).trim().length > 0);
}

function parseTlTotals(raw: any[]) {
  if (!Array.isArray(raw)) return { total: [], bangalore: [], jaipur: [] };
  // Rows 21 (total), 23 (Blr), 24 (Jaipur) based on the exact index described 
  return {
    total: raw[21] || [],
    bangalore: raw[23] || [],
    jaipur: raw[24] || []
  };
}

function parseTeleSalesRaw(raw: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(1).filter(row => {
    const email = String(row[6] || "").trim();
    const date = String(row[2] || "").trim();
    return email.includes("@") && date.length > 0;
  });
}

function parseIncentiveRaw(raw: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(2).filter(row => String(row[1] || "").trim().length > 0);
}

function parseAppraisalRaw(raw: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(1).filter(row => String(row[0] || "").trim().length > 0);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ## DATA PROCESSING HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeDate(str: string): string | null {
  if (!str) return null;
  const s = String(str).trim();
  if (!s || s === "-") return null;

  // Format: "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);

  // Format: "DD-MM-YYYY"
  const dmYMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (dmYMatch) return `${dmYMatch[3]}-${dmYMatch[2]}-${dmYMatch[1]}`;

  // Format: "DD-MMM-YY"
  const dMMyMatch = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(s);
  if (dMMyMatch) {
    const day = dMMyMatch[1].padStart(2, '0');
    const mStr = dMMyMatch[2].toLowerCase();
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[mStr] || '01';
    let year = dMMyMatch[3];
    if (year.length === 2) {
      // Assuming 2xxx if year starts with 0/1/2/3, this handles yy safely
      year = parseInt(year, 10) < 50 ? '20' + year : '19' + year;
    }
    return `${year}-${month}-${day}`;
  }
  return null;
}

function getDateRanges() {
  const now = new Date();
  
  // Format local date YYYY-MM-DD
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDate(now);
  const getOffset = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };
  
  const yesterdayStr = getOffset(-1);

  // This Week (Monday to Today)
  const dayOfWeek = now.getDay() || 7; // 1-7 (Mon-Sun)
  const mondayOffset = -(dayOfWeek - 1);
  const thisWeekStart = getOffset(mondayOffset);

  // Last Week (Mon-Sun)
  const lastWeekStart = getOffset(mondayOffset - 7);
  const lastWeekEnd = getOffset(mondayOffset - 1);

  // Months
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  return {
    today: { type: 'exact', val: todayStr },
    yesterday: { type: 'exact', val: yesterdayStr },
    thisWeek: { type: 'range', from: thisWeekStart, to: todayStr },
    lastWeek: { type: 'range', from: lastWeekStart, to: lastWeekEnd },
    thisMonth: { type: 'prefix', val: thisMonthStr },
    lastMonth: { type: 'prefix', val: lastMonthStr },
  };
}

function checkDateRange(date: string | null, range: any) {
  if (!date) return false;
  if (range.type === 'exact') return date === range.val;
  if (range.type === 'prefix') return date.startsWith(range.val);
  if (range.type === 'range') return date >= range.from && date <= range.to;
  return false;
}

function getRemainingWorkingDays(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  
  let workingDays = 0;
  for (let d = currentDay; d <= lastDay; d++) {
    const dayDate = new Date(year, month, d);
    if (dayDate.getDay() !== 0) workingDays++; // Exclude Sundays
  }
  return workingDays;
}

function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const s = String(val).replace(/,/g, '').trim();
  if (s === "-" || s === "#VALUE!" || s === "") return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

const parseAmount = parseNum;

function pct(part: number, total: number): string {
  if (!total) return "0.0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

function resolveSaleCode(transactions: any[]): string {
  const counts = new Map<string, number>();
  transactions.forEach(t => {
    const sc = String(t[1] || "").trim();
    if (sc) counts.set(sc, (counts.get(sc) || 0) + 1);
  });
  if (counts.size === 0) return "";
  
  let best = "";
  let max = 0;
  counts.forEach((count, code) => {
    if (count > max || (count === max && code.length > best.length)) {
      max = count;
      best = code;
    }
  });
  return best;
}

function buildPeriodSummary(txns: any[], range: any) {
  const filtered = txns.filter(t => checkDateRange(t.date, range));
  return {
    salesCount: filtered.length,
    salesPoints: filtered.reduce((s, t) => s + (t.point || 0), 0),
    totalAmount: filtered.reduce((s, t) => s + t.planCost, 0),
    customers10k: filtered.filter(t => t.txnBucket === "Converted Above 10K").length,
    customers50k: filtered.filter(t => t.totalTransaction >= 50000).length,
    transactions: filtered
  };
}

function buildSalesSummary(txns: any[], ranges: any) {
  return {
    today: buildPeriodSummary(txns, ranges.today),
    yesterday: buildPeriodSummary(txns, ranges.yesterday),
    thisWeek: buildPeriodSummary(txns, ranges.thisWeek),
    lastWeek: buildPeriodSummary(txns, ranges.lastWeek),
    thisMonth: buildPeriodSummary(txns, ranges.thisMonth),
    lastMonth: buildPeriodSummary(txns, ranges.lastMonth),
    allTime: {
        salesCount: txns.length,
        salesPoints: txns.reduce((s, t) => s + (t.point || 0), 0),
        totalAmount: txns.reduce((s, t) => s + t.planCost, 0),
        customers10k: txns.filter(t => t.txnBucket === "Converted Above 10K").length,
        customers50k: txns.filter(t => t.totalTransaction >= 50000).length,
        transactions: txns
    }
  };
}

function buildPlanBreakdown(txns: any[]) {
  const totals = txns.length;
  const breakDown = (type: string) => {
    const f = txns.filter(t => t.planType === type);
    return { count: f.length, amount: f.reduce((s, t) => s + t.planCost, 0), percentage: pct(f.length, totals) };
  };
  return {
    bonus: breakDown("BONUS"),
    superBonus: breakDown("SUPER_BONUS"),
    superBonusPlus: breakDown("SUPER_BONUS_PLUS"),
  };
}

function getDailyTrend(txns: any[]) {
  const byDate = new Map();
  txns.forEach(t => {
    if (!t.date) return;
    if (!byDate.has(t.date)) byDate.set(t.date, { date: t.date, salesCount: 0, totalAmount: 0, customers10k: 0, customers50k: 0 });
    const rec = byDate.get(t.date);
    rec.salesCount++;
    rec.totalAmount += t.planCost;
    if (t.txnBucket === "Converted Above 10K") rec.customers10k++;
    if (t.totalTransaction >= 50000) rec.customers50k++;
  });
  
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getBestPerformingDay(txns: any[]) {
  const trend = getDailyTrend(txns);
  if (trend.length === 0) return { date: null, salesCount: 0, totalAmount: 0, customers10k: 0, customers50k: 0 };
  return [...trend].sort((a, b) => b.salesCount - a.salesCount)[0];
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ## STEP 5: BUILD FULL OBJECT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildAgentObject(email: string, agentRow: any, incentiveRow: any, appraisalRow: any, transactions: any[], planPointsConfig: Record<string, number>) {
  const normalizedTxns = transactions
    .filter(t => t[6] && t[2])
    .map(t => {
      const pType = String(t[4] || "").trim().toUpperCase();
      return {
        phone: String(t[0]),
        saleCode: String(t[1]),
        date: normalizeDate(t[2]),
        planCost: parseNum(t[3]),
        planType: pType,
        point: planPointsConfig[pType] || 0, // Resolve points according to dynamic configuration
        isAutoRenewal: String(t[5]).trim() === "AUTO_RENEWAL",
        location: String(t[10]),
        prevTransaction: parseAmount(t[14]),
        marTransaction: parseAmount(t[15]),
        totalTransaction: parseAmount(t[16]),
        txnBucket: String(t[17]).trim(),
      };
    })
    .filter(t => t.date !== null);

  const identity = {
    empId: String(agentRow[0]),
    email: email,
    tlName: String(agentRow[2]),
    doj: normalizeDate(agentRow[3]),
    tenure: String(agentRow[4]),
    grade: String(agentRow[5]),
    status: String(agentRow[6]),
    location: normalizedTxns[0]?.location || "",
    saleCode: resolveSaleCode(normalizedTxns),
  };

  const performance = {
    presentDays: parseNum(agentRow[7]),
    wfhAttendance: parseNum(agentRow[8]),
    attPercent: String(agentRow[9]),
    talktime: String(agentRow[10]),
    quality: String(agentRow[11]),
    completedCalls: String(agentRow[12]),
    planSaleTarget: parseNum(agentRow[13]),
    bonus: parseNum(agentRow[14]),
    superBonus: parseNum(agentRow[15]),
    superBonusPlus: parseNum(agentRow[16]),
    monthlyPlanSold: parseNum(agentRow[17]),
    totalSold: parseNum(agentRow[18]),
    salePointAch: parseNum(agentRow[19]),
    totalSalePoint: parseNum(agentRow[21]),
    achPercent: String(agentRow[22]),
    slab: parseNum(agentRow[23]),
    incentivesEarned: parseNum(agentRow[24]),
    funnel5k: String(agentRow[25]),
    converted10k: parseNum(agentRow[26]),
    ach10kPercent: String(agentRow[27]),
    payoutFactor: parseNum(agentRow[28]),
    finalPayout: parseNum(agentRow[29]),
    rank: parseNum(agentRow[30]),
    eligibility: String(agentRow[31]),
  };

  const incentive = incentiveRow ? {
    location: String(incentiveRow[0]),
    rank: parseNum(incentiveRow[31]),
    eligibility: String(incentiveRow[32]),
    vintage: String(incentiveRow[45]),
    target: parseNum(incentiveRow[46]),
    totalSold: parseNum(incentiveRow[19]),
    salesPoints: parseNum(incentiveRow[22]),
    achPercent: String(incentiveRow[23]),
    slab: parseNum(incentiveRow[24]),
    incentiveAt50_59: parseNum(incentiveRow[38]),
    incentiveAt60_69: parseNum(incentiveRow[39]),
    incentiveAt70_85: parseNum(incentiveRow[40]),
    incentiveAtAbove85: parseNum(incentiveRow[41]),
    totalIncentive: parseNum(incentiveRow[37]),
    payoutFactor: parseNum(incentiveRow[29]),
    finalPayout: parseNum(incentiveRow[30]),
  } : null;

  const appraisal = appraisalRow ? {
    oldEmpId: String(appraisalRow[0]),
    name: String(appraisalRow[1]),
    personalPhone: String(appraisalRow[2]),
    personalEmail: String(appraisalRow[3]),
    newEmpId: String(appraisalRow[4]),
  } : null;

  const above10k = normalizedTxns.filter(t => t.txnBucket === "Converted Above 10K");
  const above50k = normalizedTxns.filter(t => t.totalTransaction >= 50000);
  const customers = {
    all: normalizedTxns,
    above10k,
    above50k,
    summary: { total: normalizedTxns.length, above10kCount: above10k.length, above50kCount: above50k.length }
  };

  const dateRanges = getDateRanges();
  const salesSummary = buildSalesSummary(normalizedTxns, dateRanges);

  // Focus targets on generic 'Sale Points' rather than static sale customer counts
  const targetPoints = parseNum(incentiveRow?.[46]) || performance.planSaleTarget || 0;
  const totalAchievedPoints = performance.totalSalePoint || parseNum(agentRow[21]);
  const remainingPoints = Math.max(0, targetPoints - totalAchievedPoints);
  const daysLeft = getRemainingWorkingDays();
  const drrValue = daysLeft > 0 ? Math.ceil(remainingPoints / daysLeft) : 0;
  
  const drr = {
    target: targetPoints, 
    totalAchievedPoints, 
    remainingTarget: remainingPoints, 
    remainingDays: daysLeft, 
    drr: drrValue, 
    isOnTrack: remainingPoints <= 0 || (daysLeft > 0 && drrValue <= 3)
  };

  const achNum = parseFloat(performance.achPercent) || 0;
  const filterTags = {
    status: identity.status,
    location: identity.location,
    grade: identity.grade,
    tlName: identity.tlName,
    eligibility: performance.eligibility,
    vintage: incentiveRow?.[45] || identity.tenure,
    achBucket: achNum < 50 ? "Below 50%" : achNum < 75 ? "50-75%" : achNum < 100 ? "75-100%" : "Above 100%",
    payoutBucket: performance.finalPayout === 0 ? "None" : performance.finalPayout < 5000 ? "Low" : performance.finalPayout < 10000 ? "Medium" : "High",
    converted10kBucket: performance.converted10k === 0 ? "0" : performance.converted10k <= 5 ? "1-5" : performance.converted10k <= 10 ? "5-10" : "10+",
    planTypes: [...new Set(normalizedTxns.map(t => t.planType).filter(Boolean))],
    soldToday: salesSummary.today.salesCount > 0,
    soldYesterday: salesSummary.yesterday.salesCount > 0,
    soldThisWeek: salesSummary.thisWeek.salesCount > 0,
    soldThisMonth: salesSummary.thisMonth.salesCount > 0,
  };

  const searchIndex = [
    identity.empId, identity.email, identity.tlName, identity.location, identity.grade, identity.saleCode, appraisal?.name || "", appraisal?.oldEmpId || ""
  ].join(" ").toLowerCase();

  const performanceScore = {
    salesScore: Math.min(100, achNum),
    payoutScore: performance.finalPayout > 0 ? Math.min(100, (performance.finalPayout / 20000) * 100) : 0,
    overall: Math.round((Math.min(100, achNum) * 0.6) + (performance.finalPayout > 0 ? 40 : 0)),
  };

  const sortedDates = [...new Set(normalizedTxns.map(t => String(t.date)))].sort();
  const activeDates = {
    firstSaleDate: sortedDates[0] || null,
    lastSaleDate: sortedDates[sortedDates.length - 1] || null,
    totalActiveDays: sortedDates.length,
    saleDates: sortedDates,
  };

  const targetGap = {
    target: targetPoints,
    achieved: totalAchievedPoints,
    remaining: remainingPoints,
    percentDone: targetPoints > 0 ? Math.round((totalAchievedPoints / targetPoints) * 1000) / 10 : 0,
    daysLeft,
    neededPerDay: drrValue,
    isAchievable: drr.isOnTrack,
  };

  const alerts: any[] = [];
  if (achNum < 50) alerts.push({ type: "low_performance", message: "Achievement below 50%", severity: "critical" });
  if (performance.eligibility === "Not Eligible") alerts.push({ type: "not_eligible", message: "Not eligible for payout", severity: "warning" });
  if (salesSummary.thisWeek.salesCount === 0) alerts.push({ type: "no_sale_week", message: "No sale this week", severity: "warning" });
  if (drrValue > 5) alerts.push({ type: "high_drr", message: `Need ${drrValue} sales/day`, severity: "info" });

  const thisWeekSales = salesSummary.thisWeek.salesCount;
  const lastWeekSales = salesSummary.lastWeek.salesCount;
  const trend = {
    direction: thisWeekSales > lastWeekSales ? "up" : thisWeekSales < lastWeekSales ? "down" : "stable",
    weeklyGrowth: lastWeekSales > 0 ? `${Math.round(((thisWeekSales - lastWeekSales) / lastWeekSales) * 100)}%` : "N/A",
    isImproving: thisWeekSales >= lastWeekSales,
  };

  return {
    ...identity, performance, incentive, appraisal, customers, salesSummary, drr, filterTags, searchIndex, performanceScore, activeDates, targetGap, alerts, trend,
  };
}


function buildTeamObject(tlName: string, tlRow: any, agentObjects: any[]) {
  const performance = {
    rank: parseNum(tlRow[2]),
    avgTalktime: String(tlRow[4]),
    avgCompletedCalls: String(tlRow[5]),
    avgQuality: String(tlRow[6]),
    planSaleTarget: parseNum(tlRow[7]),
    bonus: parseNum(tlRow[8]),
    superBonus: parseNum(tlRow[9]),
    superBonusPlus: parseNum(tlRow[10]),
    monthlyPlanSold: parseNum(tlRow[11]),
    totalSold: parseNum(tlRow[12]),
    salePointAch: parseNum(tlRow[13]),
    totalSalePoint: parseNum(tlRow[15]),
    achPercent: String(tlRow[16]),
    funnel5k: parseNum(tlRow[17]),
    converted10k: parseNum(tlRow[18]),
    ach10kPercent: String(tlRow[19]),
    required: parseNum(tlRow[20]),
    drr: parseNum(tlRow[21]),
  };

  const location = agentObjects[0]?.location || "";
  const totals = {
    agentCount: agentObjects.length,
    activeCount: agentObjects.filter(a => a.status === "Active").length,
    inactiveCount: agentObjects.filter(a => a.status === "Inactive").length,
    totalTarget: agentObjects.reduce((s, a) => s + a.performance.planSaleTarget, 0),
    totalSold: agentObjects.reduce((s, a) => s + a.performance.totalSold, 0),
    totalSalePoints: agentObjects.reduce((s, a) => s + a.performance.salePointAch, 0),
    totalIncentive: agentObjects.reduce((s, a) => s + a.performance.incentivesEarned, 0),
    totalFinalPayout: agentObjects.reduce((s, a) => s + a.performance.finalPayout, 0),
    totalConverted10k: agentObjects.reduce((s, a) => s + a.performance.converted10k, 0),
    totalFunnel5k: agentObjects.reduce((s, a) => s + (parseNum(a.performance.funnel5k) || 0), 0),
    totalAbove50k: agentObjects.reduce((s, a) => s + a.customers.summary.above50kCount, 0),
  };

  const periods = ["today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth", "allTime"];
  const salesSummary: any = {};
  for (const period of periods) {
    salesSummary[period] = {
      salesCount: agentObjects.reduce((s, a) => s + a.salesSummary[period].salesCount, 0),
      totalAmount: agentObjects.reduce((s, a) => s + a.salesSummary[period].totalAmount, 0),
      customers10k: agentObjects.reduce((s, a) => s + a.salesSummary[period].customers10k, 0),
      customers50k: agentObjects.reduce((s, a) => s + a.salesSummary[period].customers50k, 0),
    };
  }

  const allTxns = agentObjects.flatMap(a => a.customers.all);
  const planBreakdown = buildPlanBreakdown(allTxns);

  const eligible = agentObjects.filter(a => a.performance.eligibility === "Eligible");
  const notEligible = agentObjects.filter(a => a.performance.eligibility === "Not Eligible");
  const statusBreakdown = {
    eligible: { count: eligible.length, percentage: pct(eligible.length, agentObjects.length), agentIds: eligible.map(a => a.empId) },
    notEligible: { count: notEligible.length, percentage: pct(notEligible.length, agentObjects.length), agentIds: notEligible.map(a => a.empId) },
  };

  const topPerformers = [...agentObjects]
    .sort((a, b) => b.performance.totalSold - a.performance.totalSold)
    .map((a, i) => ({
      rank: i + 1, empId: a.empId, email: a.email, saleCode: a.saleCode, totalSold: a.performance.totalSold, achPercent: a.performance.achPercent, converted10k: a.performance.converted10k, finalPayout: a.performance.finalPayout, eligibility: a.performance.eligibility,
    }));

  return {
    tlName, location, rank: performance.rank, performance, agents: agentObjects, totals, salesSummary, planBreakdown, statusBreakdown, bestPerformingDay: getBestPerformingDay(allTxns), topPerformers, leaderboard: topPerformers,
  };
}

function buildAnalytics(allAgentsObj: any, allTeams: any[], tlTotals: any) {
  const allAgentsList = Array.from(allAgentsObj.values()) as any[];
  const allTxns = allAgentsList.flatMap(a => a.customers.all);
  const dateRanges = getDateRanges();

  const tlLeaderboard = allTeams.sort((a, b) => a.rank - b.rank).map(team => ({
    rank: team.rank, tlName: team.tlName, location: team.location, totalSold: team.performance.totalSold, achPercent: team.performance.achPercent, converted10k: team.performance.converted10k, ach10kPercent: team.performance.ach10kPercent, drr: team.performance.drr, required: team.performance.required,
  }));

  return {
    overall: {
      totalAgents: allAgentsList.length,
      activeAgents: allAgentsList.filter(a => a.status === "Active").length,
      inactiveAgents: allAgentsList.filter(a => a.status === "Inactive").length,
      totalTarget: parseNum(tlTotals.total[7]),
      totalSold: parseNum(tlTotals.total[12]),
      totalSalePoints: parseNum(tlTotals.total[15]),
      achPercent: String(tlTotals.total[16]),
      totalConverted10k: parseNum(tlTotals.total[18]),
      ach10kPercent: String(tlTotals.total[19]),
      required: parseNum(tlTotals.total[20]),
      drr: parseNum(tlTotals.total[21]),
      totalRevenue: allTxns.reduce((s, t) => s + t.planCost, 0),
      totalIncentive: allAgentsList.reduce((s, a) => s + (a.performance.incentivesEarned || 0), 0),
      totalPayout: allAgentsList.reduce((s, a) => s + (a.performance.finalPayout || 0), 0),
      totalAbove50k: allTxns.filter(t => t.totalTransaction >= 50000).length,
    },
    locationWise: {
      bangalore: tlTotals.bangalore ? buildLocationSummary(tlTotals.bangalore) : null,
      jaipur: tlTotals.jaipur ? buildLocationSummary(tlTotals.jaipur) : null,
    },
    planBreakdown: buildPlanBreakdown(allTxns),
    periodComparison: {
      today: buildPeriodSummary(allTxns, dateRanges.today),
      yesterday: buildPeriodSummary(allTxns, dateRanges.yesterday),
      thisWeek: buildPeriodSummary(allTxns, dateRanges.thisWeek),
      lastWeek: buildPeriodSummary(allTxns, dateRanges.lastWeek),
      thisMonth: buildPeriodSummary(allTxns, dateRanges.thisMonth),
      lastMonth: buildPeriodSummary(allTxns, dateRanges.lastMonth),
    },
    bestPerformingDay: getBestPerformingDay(allTxns),
    dailyTrend: getDailyTrend(allTxns),
    tlLeaderboard,
    topAgents: {
      bySales: [...allAgentsList].sort((a, b) => b.performance.totalSold - a.performance.totalSold).slice(0,10).map((a,i) => ({ rank: i+1, empId: a.empId, email: a.email, tlName: a.tlName, totalSold: a.performance.totalSold, achPercent: a.performance.achPercent, finalPayout: a.performance.finalPayout })),
      byPayout: [...allAgentsList].sort((a, b) => b.performance.finalPayout - a.performance.finalPayout).slice(0,10).map((a,i) => ({ rank: i+1, empId: a.empId, email: a.email, tlName: a.tlName, finalPayout: a.performance.finalPayout, eligibility: a.performance.eligibility })),
      by10kConversion: [...allAgentsList].sort((a, b) => b.performance.converted10k - a.performance.converted10k).slice(0,10).map((a,i) => ({ rank: i+1, empId: a.empId, email: a.email, tlName: a.tlName, converted10k: a.performance.converted10k, ach10kPercent: a.performance.ach10kPercent })),
    }
  };
}

function buildLocationSummary(row: any[]) {
    return {
        totalTarget: parseNum(row[7]), totalSold: parseNum(row[12]),
        achPercent: String(row[16]), drr: parseNum(row[21])
    };
}
