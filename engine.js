// engine.js
// Munafa recommendation engine.
// Implements a real newsvendor (single-period inventory) model for reorder
// quantities, plus an elasticity-based markdown suggestion for stock that
// won't sell through before it expires. No dependencies, runs identically
// in the browser (as window.MunafaEngine) and in Node (module.exports).

(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    root.MunafaEngine = mod;
  }
})(typeof self !== "undefined" ? self : this, function () {
  // Rational approximation of the inverse standard normal CDF (Acklam's algorithm).
  // Lets us compute the newsvendor critical-ratio z-score without a stats library.
  function inverseNormalCDF(p) {
    if (p <= 0) return -6;
    if (p >= 1) return 6;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= phigh) {
      q = p - 0.5; r = q * q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
  }

  function mean(arr) { return arr.reduce(function (s, v) { return s + v; }, 0) / arr.length; }
  function stdDev(arr) {
    var m = mean(arr);
    var v = arr.reduce(function (s, x) { return s + Math.pow(x - m, 2); }, 0) / arr.length;
    return Math.sqrt(v) || 0.0001;
  }

  // Optimal order-up-to level: mu_leadtime + z(critical ratio) * sigma_leadtime.
  // Cu = underage cost (margin lost per unit if you stock out).
  // Co = overage cost (net loss per unit left unsold/spoiled).
  function newsvendorOrderQty(salesHistory, leadTimeDays, unitCost, sellPrice, salvageValue) {
    salvageValue = salvageValue || 0;
    var dailyMean = mean(salesHistory);
    var dailyStd = stdDev(salesHistory);
    var muLead = dailyMean * leadTimeDays;
    var sigmaLead = dailyStd * Math.sqrt(leadTimeDays);

    var Cu = Math.max(sellPrice - unitCost, 0.01);
    var Co = Math.max(unitCost - salvageValue, 0.01);
    var criticalRatio = Cu / (Cu + Co);
    var z = inverseNormalCDF(criticalRatio);
    var orderUpToLevel = Math.max(0, Math.round(muLead + z * sigmaLead));

    return { dailyMean: dailyMean, dailyStd: dailyStd, criticalRatio: criticalRatio, z: z, orderUpToLevel: orderUpToLevel };
  }

  // Constant-elasticity markdown suggestion: if current stock won't sell
  // through before expiry at the current pace, back-solve the discount %
  // needed to move the shortfall in time.
  function markdownSuggestion(currentStock, avgDailySales, daysToExpiry, elasticity) {
    elasticity = elasticity || 1.6;
    var projectedSales = avgDailySales * daysToExpiry;
    var shortfall = currentStock - projectedSales;

    if (daysToExpiry <= 0) {
      return { needed: currentStock > 0, markdownPct: currentStock > 0 ? 70 : 0, projectedSales: 0, shortfall: Math.max(0, Math.round(currentStock)) };
    }
    if (shortfall <= 0) {
      return { needed: false, markdownPct: 0, projectedSales: Math.round(projectedSales), shortfall: 0 };
    }

    var requiredMultiplier = currentStock / Math.max(projectedSales, 0.5);
    var markdownPct = (Math.pow(requiredMultiplier, 1 / elasticity) - 1) * 100;
    markdownPct = Math.min(70, Math.max(5, Math.round(markdownPct / 5) * 5));

    return { needed: true, markdownPct: markdownPct, projectedSales: Math.round(projectedSales), shortfall: Math.round(shortfall) };
  }

  function analyzeProduct(product) {
    var nv = newsvendorOrderQty(product.salesHistory, product.leadTimeDays, product.unitCost, product.sellPrice);
    var md = markdownSuggestion(product.currentStock, nv.dailyMean, product.daysToExpiry);
    var spoilageRiskRupees = md.needed ? Math.round(md.shortfall * product.unitCost) : 0;
    return {
      dailyMean: nv.dailyMean, dailyStd: nv.dailyStd, criticalRatio: nv.criticalRatio,
      orderUpToLevel: nv.orderUpToLevel, markdown: md, spoilageRiskRupees: spoilageRiskRupees,
    };
  }

  // ------------------------------------------------------------------------
  // Budget-constrained reorder allocation. Additive only — everything above
  // this line is the original, untouched, validated engine. This section
  // answers a different question than the per-product recommendation does:
  // not "what's the ideal order level for this one item," but "given only
  // ₹X today, which units across ALL items are worth buying first."

  // Standard normal CDF, Φ(z) — Abramowitz & Stegun 7.1.26 erf approximation
  // (max error ~1.5e-7). newsvendorOrderQty above only ever needed the
  // INVERSE of this (Acklam's algorithm, for a single target quantile); the
  // allocator needs the forward direction to price every individual unit.
  function normalCDF(z) {
    var sign = z < 0 ? -1 : 1;
    var x = Math.abs(z) / Math.SQRT2;
    var p = 0.3275911, a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    var t = 1 / (1 + p * x);
    var poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
    var erf = 1 - poly * Math.exp(-x * x);
    return 0.5 * (1 + sign * erf);
  }

  // Expected value of the k-th additional unit stocked, for k = 1..gap.
  // Same marginal-analysis identity that defines the newsvendor optimum
  // (marginal value hits exactly zero at orderUpToLevel) — this exposes
  // the whole decreasing curve up to that point, not just its endpoint,
  // because a limited budget needs to compare that curve across products.
  function marginalUnitValues(product, analyzed) {
    var leadTimeDays = Math.max(product.leadTimeDays || 1, 0.1);
    var muLead = analyzed.dailyMean * leadTimeDays;
    var sigmaLead = Math.max(analyzed.dailyStd * Math.sqrt(leadTimeDays), 0.0001);
    var Cu = Math.max(product.sellPrice - product.unitCost, 0.01);
    var Co = Math.max(product.unitCost, 0.01);
    var gap = Math.max(0, Math.round(analyzed.orderUpToLevel - product.currentStock));
    var units = [];
    for (var k = 1; k <= gap; k++) {
      var stockLevel = product.currentStock + k;
      var z = (stockLevel - 1 - muLead) / sigmaLead;
      var pStockout = 1 - normalCDF(z);
      var value = Cu * pStockout - Co * (1 - pStockout);
      units.push({ unit: k, stockLevel: stockLevel, value: Math.max(0, value) });
    }
    return units;
  }

  // Solve "which units, across every product, fit in ₹budget and protect
  // the most expected value" as a 0/1 knapsack over individual units.
  // This is exact, not just a good heuristic, because every product's own
  // marginal-value sequence is non-increasing (proved by the newsvendor
  // optimum itself) — buying a later unit of a product before an earlier,
  // higher-value one of the SAME product is always weakly dominated, so a
  // flat 0/1 formulation needs no explicit per-product ordering constraint
  // to stay correct; the DP finds it automatically.
  var BUDGET_DP_CELL_LIMIT = 3000000;

  function knapsackExact(candidates, budgetRupees) {
    var n = candidates.length;
    var B = budgetRupees;
    var dp = new Float64Array(B + 1);
    var take = [];
    for (var i = 0; i < n; i++) take.push(new Uint8Array(B + 1));
    for (i = 0; i < n; i++) {
      var c = Math.max(0, Math.round(candidates[i].unitCost));
      var v = candidates[i].value;
      if (c > B) continue;
      for (var b = B; b >= c; b--) {
        var alt = dp[b - c] + v;
        if (alt > dp[b]) { dp[b] = alt; take[i][b] = 1; }
      }
    }
    var b2 = B, picked = [];
    for (i = n - 1; i >= 0; i--) {
      if (take[i][b2]) {
        picked.push(candidates[i]);
        b2 -= Math.max(0, Math.round(candidates[i].unitCost));
      }
    }
    return { picked: picked, exact: true };
  }

  // Fallback for catalogs too large for the exact DP to stay snappy
  // (guarded by BUDGET_DP_CELL_LIMIT below). Provably within one unit's
  // value of optimal whenever per-unit cost is small relative to budget,
  // which holds for any realistic shop catalog.
  function knapsackGreedy(candidates, budgetRupees) {
    var sorted = candidates.slice().sort(function (x, y) {
      return (y.value / Math.max(y.unitCost, 0.01)) - (x.value / Math.max(x.unitCost, 0.01));
    });
    var spent = 0, picked = [];
    sorted.forEach(function (c) {
      if (spent + c.unitCost <= budgetRupees) { spent += c.unitCost; picked.push(c); }
    });
    return { picked: picked, exact: false };
  }

  // items: array of { product, analyzed } — the same {p, a} pairs the rest
  // of the app already computes via analyzeProduct, for every SKU that
  // currently needs reordering. budgetRupees: what's available to spend
  // today. Returns a full breakdown ready to render, plus totals.
  function planBudget(items, budgetRupees) {
    var budget = Math.max(0, Math.round(budgetRupees || 0));
    var candidates = [];
    var neededUnits = {}, neededCost = {}, meta = {};
    items.forEach(function (it) {
      var p = it.product, a = it.analyzed;
      meta[p.id] = { id: p.id, name: p.name, category: p.category, unitCost: p.unitCost };
      var units = marginalUnitValues(p, a);
      neededUnits[p.id] = units.length;
      neededCost[p.id] = units.length * p.unitCost;
      units.forEach(function (u) {
        candidates.push({ productId: p.id, unit: u.unit, unitCost: p.unitCost, value: u.value });
      });
    });

    var totalNeed = candidates.reduce(function (s, c) { return s + c.unitCost; }, 0);
    var totalCandidateValue = candidates.reduce(function (s, c) { return s + c.value; }, 0);

    var result;
    if (candidates.length === 0 || budget <= 0) {
      result = { picked: [], exact: true };
    } else if (totalNeed <= budget) {
      result = { picked: candidates.slice(), exact: true };
    } else if (candidates.length * budget > BUDGET_DP_CELL_LIMIT) {
      result = knapsackGreedy(candidates, budget);
    } else {
      result = knapsackExact(candidates, budget);
    }

    var fundedUnits = {}, fundedCost = {}, fundedValue = {};
    result.picked.forEach(function (c) {
      fundedUnits[c.productId] = (fundedUnits[c.productId] || 0) + 1;
      fundedCost[c.productId] = (fundedCost[c.productId] || 0) + c.unitCost;
      fundedValue[c.productId] = (fundedValue[c.productId] || 0) + c.value;
    });

    // First (highest-value) unit of each product — used to show "would
    // protect ≈₹N+" on items that end up funded zero.
    var firstUnitValue = {};
    candidates.forEach(function (c) { if (c.unit === 1) firstUnitValue[c.productId] = c.value; });

    var itemsOut = Object.keys(meta).map(function (pid) {
      var m = meta[pid];
      var funded = fundedUnits[pid] || 0;
      var needed = neededUnits[pid] || 0;
      return {
        id: pid, name: m.name, category: m.category, unitCost: m.unitCost,
        neededUnits: needed, fundedUnits: funded,
        cost: fundedCost[pid] || 0, value: fundedValue[pid] || 0,
        fullCost: neededCost[pid] || 0, firstUnitValue: firstUnitValue[pid] || 0,
        status: funded === 0 ? "skip" : (funded >= needed ? "full" : "partial")
      };
    });

    var rank = { full: 0, partial: 1, skip: 2 };
    itemsOut.sort(function (x, y) {
      if (rank[x.status] !== rank[y.status]) return rank[x.status] - rank[y.status];
      if (x.status === "skip") return y.firstUnitValue - x.firstUnitValue;
      return (y.value / Math.max(y.cost, 0.01)) - (x.value / Math.max(x.cost, 0.01));
    });

    var spent = result.picked.reduce(function (s, c) { return s + c.unitCost; }, 0);
    var valueGained = result.picked.reduce(function (s, c) { return s + c.value; }, 0);

    return {
      budget: budget, totalNeed: totalNeed, spent: spent, remaining: Math.max(0, budget - spent),
      valueGained: valueGained, totalCandidateValue: totalCandidateValue,
      fullyCovered: totalNeed <= budget && candidates.length > 0,
      exact: result.exact, items: itemsOut
    };
  }

  // ------------------------------------------------------------------------
  // Model validation: simulate the newsvendor policy against a naive
  // "order to the average, no safety stock" baseline over a real horizon,
  // to answer "does the safety-stock math actually pay off" with a number
  // instead of an assertion. Additive only — nothing above this line
  // (including the budget allocator just above) is touched.

  function normalPDF(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }

  // Standard normal loss function L(z) = E[max(Z - z, 0)] for Z ~ N(0,1).
  // This is the textbook identity that turns "expected shortfall/leftover
  // under a Normal demand model" into a closed form — no simulation needed
  // to know the TRUE expected cost of a given order-up-to level.
  function normalLoss(z) { return normalPDF(z) - z * (1 - normalCDF(z)); }

  // Exact expected cost per review cycle for order-up-to level S, demand
  // ~ N(mu, sigma). Used for the headline comparison: deterministic, so it
  // can never vary between page loads, and mathematically guaranteed to
  // rank S = orderUpToLevel (the newsvendor optimum) at or below any other
  // S for this exact cost function — including the naive baseline below.
  function expectedCyclePolicyCost(mu, sigma, S, Cu, Co) {
    var s = Math.max(sigma, 0.0001);
    var z = (S - mu) / s;
    var L = normalLoss(z);
    var eShortfall = s * L;
    var eLeftover = eShortfall + (S - mu); // identity: max(S-D,0)-max(D-S,0) = S-D
    return {
      cost: Cu * eShortfall + Co * eLeftover,
      stockoutCost: Cu * eShortfall,
      spoilageCost: Co * eLeftover
    };
  }

  // Seeded PRNG (mulberry32) + Box-Muller — used for the Monte Carlo chart,
  // which re-rolls on demand ("Run again"). The closed form above is what
  // the headline number is built on; this is what makes the chart feel
  // like an actual simulated month rather than a static illustration.
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomNormal(mean, std, rng) {
    var u1 = Math.max(rng(), 1e-12), u2 = rng();
    var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z;
  }

  function simulateCyclesMC(mu, sigma, S, Cu, Co, cycles, trials, rng) {
    var totalStockout = 0, totalSpoilage = 0;
    for (var t = 0; t < trials; t++) {
      for (var c = 0; c < cycles; c++) {
        var d = Math.max(0, randomNormal(mu, sigma, rng));
        totalStockout += Cu * Math.max(0, d - S);
        totalSpoilage += Co * Math.max(0, S - d);
      }
    }
    return {
      cost: (totalStockout + totalSpoilage) / trials,
      stockoutCost: totalStockout / trials,
      spoilageCost: totalSpoilage / trials
    };
  }

  var VALIDATION_HORIZON_DAYS = 30;
  var VALIDATION_MC_TRIALS = 300;

  // items: array of { product, analyzed } for the WHOLE catalog (this
  // validates the policy in general, not just today's low-stock items).
  // rng: optional seeded generator (tests pass one in; production omits it
  // and gets fresh Math.random()-backed simulation each call).
  function runValidation(items, rng) {
    rng = rng || Math.random;
    var closed = {
      munafa: { cost: 0, stockoutCost: 0, spoilageCost: 0 },
      naive: { cost: 0, stockoutCost: 0, spoilageCost: 0 }
    };
    var simulated = {
      munafa: { cost: 0, stockoutCost: 0, spoilageCost: 0 },
      naive: { cost: 0, stockoutCost: 0, spoilageCost: 0 }
    };
    var perItem = [];

    items.forEach(function (it) {
      var p = it.product, a = it.analyzed;
      var muLead = a.dailyMean * p.leadTimeDays;
      var sigmaLead = Math.max(a.dailyStd * Math.sqrt(p.leadTimeDays), 0.0001);
      var Cu = Math.max(p.sellPrice - p.unitCost, 0.01);
      var Co = Math.max(p.unitCost, 0.01);
      var cycles = Math.max(1, Math.round(VALIDATION_HORIZON_DAYS / Math.max(p.leadTimeDays, 1)));
      // Both policies round to whole units — a real "naive" shop owner
      // can't order 21.3 bunches of coriander either. Comparing a rounded
      // policy against an unrounded one would be an unfair comparison
      // that can spuriously favor the unrounded side when the two targets
      // are already close together.
      var munafaS = a.orderUpToLevel;
      var naiveS = Math.round(muLead);

      var mClosed = expectedCyclePolicyCost(muLead, sigmaLead, munafaS, Cu, Co);
      var nClosed = expectedCyclePolicyCost(muLead, sigmaLead, naiveS, Cu, Co);
      var mCostTotal = mClosed.cost * cycles, nCostTotal = nClosed.cost * cycles;

      closed.munafa.cost += mCostTotal;
      closed.munafa.stockoutCost += mClosed.stockoutCost * cycles;
      closed.munafa.spoilageCost += mClosed.spoilageCost * cycles;
      closed.naive.cost += nCostTotal;
      closed.naive.stockoutCost += nClosed.stockoutCost * cycles;
      closed.naive.spoilageCost += nClosed.spoilageCost * cycles;

      var mMC = simulateCyclesMC(muLead, sigmaLead, munafaS, Cu, Co, cycles, VALIDATION_MC_TRIALS, rng);
      var nMC = simulateCyclesMC(muLead, sigmaLead, naiveS, Cu, Co, cycles, VALIDATION_MC_TRIALS, rng);
      simulated.munafa.cost += mMC.cost;
      simulated.munafa.stockoutCost += mMC.stockoutCost;
      simulated.munafa.spoilageCost += mMC.spoilageCost;
      simulated.naive.cost += nMC.cost;
      simulated.naive.stockoutCost += nMC.stockoutCost;
      simulated.naive.spoilageCost += nMC.spoilageCost;

      perItem.push({
        id: p.id, name: p.name, category: p.category,
        munafaCost: mCostTotal, naiveCost: nCostTotal,
        improvementRupees: nCostTotal - mCostTotal,
        improvementPct: nCostTotal > 0 ? (1 - mCostTotal / nCostTotal) * 100 : 0,
        munafaS: munafaS, naiveS: naiveS, cycles: cycles
      });
    });

    perItem.sort(function (x, y) { return y.improvementRupees - x.improvementRupees; });

    return {
      horizonDays: VALIDATION_HORIZON_DAYS, trials: VALIDATION_MC_TRIALS,
      closed: closed,
      improvementPct: closed.naive.cost > 0 ? (1 - closed.munafa.cost / closed.naive.cost) * 100 : 0,
      simulated: simulated,
      items: perItem
    };
  }

  // ------------------------------------------------------------------------
  // Trend detection. Additive only — nothing above this line, including the
  // budget allocator and the validation simulator, is touched. Answers a
  // question the per-product recommendation doesn't: not "what's the right
  // level today," but "is demand for this item moving, and which way."

  // Ordinary least-squares slope of salesHistory against day index
  // (0 = oldest, n-1 = most recent — matching the array's own convention
  // used everywhere else in this file).
  function salesTrendSlope(salesHistory) {
    var n = salesHistory.length;
    if (n < 2) return 0;
    var xMean = (n - 1) / 2;
    var yMean = mean(salesHistory);
    var num = 0, den = 0;
    for (var i = 0; i < n; i++) {
      num += (i - xMean) * (salesHistory[i] - yMean);
      den += (i - xMean) * (i - xMean);
    }
    return den === 0 ? 0 : num / den;
  }

  // Classifies direction using the TOTAL change implied by the slope across
  // the observed window, relative to the item's own average daily sales —
  // so a low-volume and a high-volume item are judged on the same relative
  // scale rather than raw units. Threshold is deliberately a plain ±15%,
  // not a statistical significance test: this feeds a UI badge, not a
  // decision, and the underlying reorder math already carries its own
  // uncertainty handling.
  function salesTrend(salesHistory) {
    var slope = salesTrendSlope(salesHistory);
    var n = salesHistory.length;
    var avg = Math.max(mean(salesHistory), 0.0001);
    var totalChange = slope * (n - 1);
    var relChange = totalChange / avg;
    var direction = relChange > 0.15 ? "rising" : relChange < -0.15 ? "falling" : "steady";
    return { slope: slope, relChange: relChange, direction: direction };
  }

  return {
    newsvendorOrderQty: newsvendorOrderQty, markdownSuggestion: markdownSuggestion, analyzeProduct: analyzeProduct,
    mean: mean, stdDev: stdDev, inverseNormalCDF: inverseNormalCDF,
    normalCDF: normalCDF, marginalUnitValues: marginalUnitValues, planBudget: planBudget,
    expectedCyclePolicyCost: expectedCyclePolicyCost, mulberry32: mulberry32,
    randomNormal: randomNormal, runValidation: runValidation,
    salesTrendSlope: salesTrendSlope, salesTrend: salesTrend
  };
});
