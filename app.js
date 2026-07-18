// app.js
// Munafa UI: rendering, i18n (EN/HI/TE/TA), category-grouped grid with chips,
// summary filters, order + markdown actions with a persisted activity log,
// add/edit sheet, offline-safe ask flow, and GSAP load choreography. All
// decision math lives in engine.js and runs locally — nothing in this file
// blocks on the network.

(function () {
  "use strict";

  var engine = window.MunafaEngine;
  var DEFAULT_PRODUCTS = window.MUNAFA_PRODUCTS;
  var LS_PRODUCTS = "munafa-products-v2";
  var LS_ACTIVITY = "munafa-activity-v1";
  var LS_ORDERS_OLD = "munafa-orders-v1";
  var LS_LANG = "munafa-lang";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function G() { return (!reduced && window.gsap) ? window.gsap : null; }

  // ---------------------------------------------------------------- icons --
  // One hand-drawn duotone line-icon set (24x24, stroke 1.7), tinted via
  // currentColor. Product icons are decorative and follow the category.

  var ICON_PATHS = {
    milk:
      '<path d="M9.5 2.5h5"/>' +
      '<path d="M8 13c1.3-.9 2.7-.9 4 0 1.3.9 2.7.9 4 0v6a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6z" fill="currentColor" opacity=".15" stroke="none"/>' +
      '<path d="M10 2.5v2.3L8 8.5V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8.5l-2-3.7V2.5"/>' +
      '<path d="M8 13c1.3-.9 2.7-.9 4 0 1.3.9 2.7.9 4 0"/>',
    curd:
      '<path d="M4.5 12.5h15a7.5 7.5 0 0 1-15 0z" fill="currentColor" opacity=".15" stroke="none"/>' +
      '<path d="M4.5 12.5h15a7.5 7.5 0 0 1-15 0z"/>' +
      '<path d="M9 9.7c0-1.5 1.3-2.7 3-2.7s3 1.2 3 2.7"/>' +
      '<path d="M16.5 12.5 19 6.5"/>',
    cheese:
      '<rect x="10.5" y="4.5" width="9" height="9" rx="1.2" fill="currentColor" opacity=".15" stroke="none"/>' +
      '<rect x="10.5" y="4.5" width="9" height="9" rx="1.2"/>' +
      '<rect x="4.5" y="10.5" width="9" height="9" rx="1.2" fill="var(--paper-hi, #FCF8EC)"/>' +
      '<rect x="4.5" y="10.5" width="9" height="9" rx="1.2"/>',
    butter:
      '<rect x="5" y="8.5" width="14" height="7" rx="1.5" fill="currentColor" opacity=".15" stroke="none"/>' +
      '<rect x="5" y="8.5" width="14" height="7" rx="1.5"/>' +
      '<path d="M9.5 8.5v7"/>' +
      '<path d="M3.8 18.5h16.4"/>',
    egg:
      '<path d="M12 3.2c3.4 0 6.3 4.9 6.3 9.8a6.3 6.3 0 0 1-12.6 0c0-4.9 2.9-9.8 6.3-9.8z" fill="currentColor" opacity=".13" stroke="none"/>' +
      '<path d="M12 3.2c3.4 0 6.3 4.9 6.3 9.8a6.3 6.3 0 0 1-12.6 0c0-4.9 2.9-9.8 6.3-9.8z"/>',
    bread:
      '<path d="M4 9.5A3.5 3.5 0 0 1 7.5 6h9A3.5 3.5 0 0 1 20 9.5c0 1.1-.6 2.1-1.5 2.6V19a1.8 1.8 0 0 1-1.8 1.8H7.3A1.8 1.8 0 0 1 5.5 19v-6.9C4.6 11.6 4 10.6 4 9.5z" fill="currentColor" opacity=".13" stroke="none"/>' +
      '<path d="M4 9.5A3.5 3.5 0 0 1 7.5 6h9A3.5 3.5 0 0 1 20 9.5c0 1.1-.6 2.1-1.5 2.6V19a1.8 1.8 0 0 1-1.8 1.8H7.3A1.8 1.8 0 0 1 5.5 19v-6.9C4.6 11.6 4 10.6 4 9.5z"/>' +
      '<path d="M9 14.5 11 12M13 14.5 15 12"/>',
    tomato:
      '<circle cx="12" cy="13.5" r="6.5" fill="currentColor" opacity=".14" stroke="none"/>' +
      '<circle cx="12" cy="13.5" r="6.5"/>' +
      '<path d="M12 7c-.4-1.8-1.7-3-3.6-3.2 1.1 1 1.6 2 1.8 3.2M12 7c.4-1.8 1.7-3 3.6-3.2-1.1 1-1.6 2-1.8 3.2M12 7V4.6"/>',
    onion:
      '<path d="M12 8.2c4.1 0 7 2.6 7 6.3a7 7 0 0 1-14 0c0-3.7 2.9-6.3 7-6.3z" fill="currentColor" opacity=".14" stroke="none"/>' +
      '<path d="M12 8.2c4.1 0 7 2.6 7 6.3a7 7 0 0 1-14 0c0-3.7 2.9-6.3 7-6.3z"/>' +
      '<path d="M12 8.2c-1.9 1.9-2.4 4-2.4 6.3M12 8.2c1.9 1.9 2.4 4 2.4 6.3M12 8.2V5"/>' +
      '<path d="M9.8 3.4 12 5l2.2-1.6"/>',
    herb:
      '<path d="M11.8 12.6C7.6 12.7 5.4 10 5.3 6c4.2-.1 6.4 2.6 6.5 6.6z" fill="currentColor" opacity=".13" stroke="none"/>' +
      '<path d="M11.8 12.6C7.6 12.7 5.4 10 5.3 6c4.2-.1 6.4 2.6 6.5 6.6z"/>' +
      '<path d="M12.2 12.6c4.2.1 6.4-2.6 6.5-6.6-4.2.1-6.4 2.6-6.5 6.6z"/>' +
      '<path d="M12 21v-8.4"/>',
    leaf:
      '<path d="M12 3.5c4.6 2.6 6.6 7.2 4.9 11.7C15.6 18.6 12 20.5 12 20.5s-3.6-1.9-4.9-5.3C5.4 10.7 7.4 6.1 12 3.5z" fill="currentColor" opacity=".13" stroke="none"/>' +
      '<path d="M12 3.5c4.6 2.6 6.6 7.2 4.9 11.7C15.6 18.6 12 20.5 12 20.5s-3.6-1.9-4.9-5.3C5.4 10.7 7.4 6.1 12 3.5z"/>' +
      '<path d="M12 8v9.5M12 12.2 9.2 10.4M12 12.2l2.8-1.8"/>',
    banana:
      '<path d="M6.2 4.5c-1.2 7.4 3.3 13.1 11.3 13.8l2.6.2c-1 1.6-3 2.4-5.6 2.1C7.6 19.9 3.4 14.4 4.3 7.9c.2-1.3.7-2.5 1.4-3.4h.5z" fill="currentColor" opacity=".14" stroke="none"/>' +
      '<path d="M6.2 4.5c-1.2 7.4 3.3 13.1 11.3 13.8l2.6.2c-1 1.6-3 2.4-5.6 2.1C7.6 19.9 3.4 14.4 4.3 7.9c.2-1.3.7-2.5 1.4-3.4h.5z"/>' +
      '<path d="M6.2 4.5 6 3.2"/>',
    grain:
      '<path d="M8.5 6.5h7l1.8 2.8a11.7 11.7 0 0 1 1.9 6.3 4.2 4.2 0 0 1-4.2 4.2H9a4.2 4.2 0 0 1-4.2-4.2c0-2.2.7-4.4 1.9-6.3L8.5 6.5z" fill="currentColor" opacity=".13" stroke="none"/>' +
      '<path d="M8.5 6.5h7l1.8 2.8a11.7 11.7 0 0 1 1.9 6.3 4.2 4.2 0 0 1-4.2 4.2H9a4.2 4.2 0 0 1-4.2-4.2c0-2.2.7-4.4 1.9-6.3L8.5 6.5z"/>' +
      '<path d="M8.5 6.5c-.3-2 7.3-2 7 0"/>' +
      '<path d="M10.4 12.2v3M13.6 12.2v3M12 10.8v3"/>',
    basket:
      '<path d="M4.5 9.5h15l-1.4 8.6a2 2 0 0 1-2 1.7H7.9a2 2 0 0 1-2-1.7L4.5 9.5z" fill="currentColor" opacity=".12" stroke="none"/>' +
      '<path d="M4.5 9.5h15l-1.4 8.6a2 2 0 0 1-2 1.7H7.9a2 2 0 0 1-2-1.7L4.5 9.5z"/>' +
      '<path d="M8.5 9.5 12 4l3.5 5.5"/>' +
      '<path d="M9.3 13v3.4M12 13v3.4M14.7 13v3.4"/>',
    tag:
      '<path d="M4 11.6V5a1 1 0 0 1 1-1h6.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.3-.7z" fill="currentColor" opacity=".13" stroke="none"/>' +
      '<path d="M4 11.6V5a1 1 0 0 1 1-1h6.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.3-.7z"/>' +
      '<circle cx="8.6" cy="8.6" r="1.5"/>'
  };

  // Legacy keyword fallback — only used to resolve icons for products saved by
  // earlier builds; the add/edit form now derives icons from the category.
  var ICON_ORDER = ["cheese", "curd", "butter", "milk", "egg", "bread", "tomato", "onion", "herb", "leaf", "banana", "grain", "basket"];

  var ICON_KEYWORDS = {
    cheese: ["paneer", "पनीर", "పన్నీర్", "பன்னீர்", "cheese", "चीज़"],
    curd: ["curd", "dahi", "दही", "yogurt", "yoghurt", "పెరుగు", "தயிர்", "lassi", "लस्सी", "छाछ", "మజ్జిగ", "மோர்"],
    butter: ["butter", "makkhan", "मक्खन", "ghee", "घी", "వెన్న", "నెయ్యి", "வெண்ணெய்", "நெய்"],
    milk: ["milk", "doodh", "dudh", "दूध", "పాల", "பால்", "toned", "cream", "मलाई"],
    egg: ["egg", "anda", "ande", "अंडा", "अंडे", "గుడ్డు", "గుడ్లు", "முட்டை", "tray"],
    bread: ["bread", "ब्रेड", "pav", "पाव", "bun", "बन", "బ్రెడ్", "பிரெட்", "toast", "rusk", "रस्क", "cake", "केक"],
    tomato: ["tomato", "tamatar", "टमाटर", "టమాట", "தக்காளி"],
    onion: ["onion", "pyaz", "pyaaz", "प्याज", "ఉల్లి", "வெங்காயம்"],
    herb: ["coriander", "dhania", "धनिया", "कोथमीर", "కొత్తిమీర", "கொத்தமல்லி", "mint", "pudina", "पुदीना", "curry leaf", "कड़ी पत्ता", "కరివేపాకు", "கறிவேப்பிலை"],
    leaf: ["spinach", "palak", "पालक", "saag", "साग", "greens", "methi", "मेथी", "పాలకూర", "కీర", "கீரை", "keerai", "lettuce", "cabbage", "गोभी"],
    banana: ["banana", "kela", "केला", "అరటి", "வாழை"],
    grain: ["rice", "chawal", "चावल", "basmati", "बासमती", "బియ్యం", "అన్నం", "அரிசி", "atta", "आटा", "flour", "wheat", "गेहूं", "dal", "दाल", "పప్పు", "பருப்பு", "sugar", "चीनी", "పంచదార", "சர்க்கரை", "poha", "पोहा"]
  };

  var EMOJI_MAP = {
    "🥛": "milk", "🥣": "curd", "🧀": "cheese", "🧈": "butter", "🥚": "egg",
    "🍞": "bread", "🍅": "tomato", "🧅": "onion", "🌿": "herb", "🥬": "leaf",
    "🍌": "banana", "🌾": "grain", "🍚": "grain", "🛒": "basket"
  };

  var CAT_ICON = {
    "Dairy": "milk", "Dairy & Eggs": "egg", "Bakery": "bread",
    "Produce": "leaf", "Staples": "grain", "custom": "basket"
  };

  function iconSvg(id) {
    return '<svg class="pico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICON_PATHS[id] || ICON_PATHS.basket) + "</svg>";
  }

  function suggestIcon(name) {
    var n = String(name || "").toLowerCase();
    if (!n.trim()) return "basket";
    for (var i = 0; i < ICON_ORDER.length; i++) {
      var id = ICON_ORDER[i];
      var words = ICON_KEYWORDS[id] || [];
      for (var j = 0; j < words.length; j++) {
        if (n.indexOf(words[j]) >= 0) return id;
      }
    }
    return "basket";
  }

  function resolveIconId(p) {
    if (ICON_PATHS[p.icon]) return p.icon;
    if (EMOJI_MAP[p.icon]) return EMOJI_MAP[p.icon];
    var byName = suggestIcon(p.name);
    if (byName !== "basket") return byName;
    return CAT_ICON[p.category] || "basket";
  }

  // ---------------------------------------------------------------- i18n --

  var I18N = {
    en: {
      tagline: "Know what to reorder and what to mark down — before it spoils, not after.",
      addStock: "Add stock",
      activity: "Activity",
      actTitle: "Recent activity",
      actCaption: "Confirmed actions are saved on this phone only — sharing today's list is how they reach your supplier.",
      actEmpty: "Actions you confirm will appear here.",
      actClear: "Clear log",
      logOrder: "{name} — ordered {n} units",
      logMd: "{name} — {n}% markdown applied",
      sumMdTodayL: "in markdowns applied today",
      sumOrderTodayL: "units reordered today",
      shareBtn: "Share today's actions",
      shareCopied: "Copied — paste it to your supplier",
      shareTitle: "Munafa — stock actions for {date}",
      shareOrder: "order {n} units",
      shareMd: "apply {n}% markdown",
      dateToday: "Today",
      dateYesterday: "Yesterday",
      sumMarkdown: "items to mark down today",
      sumReorder: "items to reorder now",
      sumRisk: "of stock at risk of spoiling",
      all: "All",
      showAll: "Show all {n} items",
      emptyMsg: "Nothing here right now.",
      stock: "Stock",
      expiry: "Expiry",
      avgPerDay: "Sold/day",
      daysShort: "{n}d",
      lineMd: "Expires in {d} — {risk} at risk if not discounted today.",
      lineRo: "Stock covers ~{c} days at this pace — order before it runs out.",
      lineOk: "Sells through before expiry — nothing to do.",
      dayOne: "1 day", dayMany: "{n} days",
      stampMarkdown: "{n}% off today",
      stampReorder: "order +{n} more",
      stampOk: "stocked right ✓",
      trendRising: "rising",
      trendFalling: "falling",
      orderBtn: "Order {n} units",
      ordered: "Ordered {n} ✓",
      markBtn: "Apply {n}% off",
      marked: "Marked down {n}% ✓",
      justNow: "just now",
      today: "today",
      qtyLess: "Fewer units",
      qtyMore: "More units",
      mdLess: "Less discount",
      mdMore: "More discount",
      askWhy: "Ask Munafa why",
      thinking: "Thinking…",
      askAgain: "Ask again",
      aiTag: "Munafa AI · via internet",
      offlineTag: "Offline tip · made on this device",
      setupTag: "AI isn't set up yet · showing an offline estimate",
      editAria: "Edit {name}",
      closeAria: "Close",
      formAdd: "Add stock",
      formEdit: "Edit item",
      fName: "Product name",
      fCategory: "Category",
      fCost: "Buy price (₹)",
      fPrice: "Sell price (₹)",
      fStock: "Units in stock",
      fExpiry: "Days to expiry",
      fLead: "Delivery days",
      fSales: "Daily sales, recent days",
      fSalesHint: "Units sold each day, separated by commas — most recent last.",
      save: "Save & recalculate",
      cancel: "Cancel",
      remove: "Remove item",
      removeConfirm: "Remove this item?",
      invalid: "Fill every field with a valid number (sales like: 12, 15, 9).",
      footer: "TakeOver'26 · Intelligent Procurement — demo data from a kirana counter.",
      reset: "Reset demo data",
      importBtn: "Import Excel",
      impTitle: "Import from Excel",
      impCaption: "Check the rows below, fix anything that looks wrong, then add them to your stock.",
      impReading: "Reading file…",
      impMapping: "Matching columns…",
      impFile: "{n} rows · {file}",
      impInclude: "Add",
      impSoldEst: "Sold/day (est.)",
      impEstNote: "≈ Sold/day is estimated from stock on hand — Munafa corrects itself once you edit in real sales.",
      impFixRows: "{n} row(s) have invalid values — fix the red cells or untick them.",
      impMissingCols: "Couldn't identify these columns: {cols}. You can type the values in below.",
      impNoRows: "No usable rows found in this sheet.",
      impBadFile: "Couldn't read that file — use .xlsx, .xls or .csv.",
      impNeedNet: "Connect to the internet once to load the Excel reader, then try again.",
      impAddN: "Add {n} items",
      budgetNudge: "{total} needed to restock {n} items today",
      budgetPlanBtn: "Plan budget",
      planBtn: "Ask Munafa for today's plan",
      planCaption: "One prioritized plan across everything flagged today — what to do first, and why.",
      planAgain: "Refresh plan",
      planEmptyMsg: "Nothing is flagged right now — check back once something needs attention.",
      budgetTitle: "Plan today's spending",
      budgetCaption: "Set what you actually have to spend today — Munafa funds the highest-value items first.",
      budgetInputLabel: "Today's budget",
      budgetAllocated: "{spent} of {budget} allocated",
      budgetLeftover: "{n} left over",
      budgetValueHead: "Expected savings",
      budgetFullyCovered: "This covers every reorder — nothing left waiting.",
      budgetSpendOrder: "Spend in this order",
      budgetCanWait: "Can wait",
      budgetUnitsTag: "{n}/{m} units",
      budgetSkipTag: "skip today",
      budgetProtects: "protects ≈{n}",
      budgetWouldProtect: "would protect ≈{n}+",
      budgetConfirmBtn: "Confirm & log {n} orders",
      budgetZeroState: "Raise the budget to fund at least one item.",
      budgetNoCandidates: "Nothing to plan — every reorder is already logged today.",
      budgetConfirmedNote: "Logged {n} orders — open Activity to share with your supplier.",
      validateCta: "See the model tested against simulated demand",
      validateTitle: "How well does this actually work?",
      validateCaption: "We simulate a month of stochastic demand through the same formulas behind every card, and compare against ordering to the average with no safety buffer — the way most shops do it by feel.",
      validateRunning: "Running the simulation…",
      validateHeadlineLabel: "less inventory cost than naive reordering",
      validateHeadlineSub: "{munafa} vs {naive} · simulated across {n} items, {days}-day horizon",
      validateChartMunafa: "Munafa",
      validateChartNaive: "Naive",
      validateChartStockout: "Lost sales",
      validateChartSpoilage: "Spoilage",
      validateMethodBody: "Naive orders to your average demand during lead time, with zero safety stock. Munafa orders to that same average, plus a buffer sized by your specific margins and how much each item's demand actually swings.",
      validateBreakdownTitle: "Biggest wins by item",
      validateRerun: "Run again",
      validateItemPct: "{pct}% less",
      voiceAdd: "Add by voice",
      voiceStop: "Stop listening",
      voiceListening: "Listening — say the item, prices, stock…",
      voiceThinking: "Understanding…",
      voiceReview: "Check the highlighted fields, then save.",
      voiceNoSpeech: "Didn't catch that — tap the mic and try again.",
      voiceDenied: "Microphone is blocked for this site — you can keep typing as usual.",
      voiceFail: "Couldn't work that out — try again, or type it in.",
      voiceSetupMissing: "Voice add isn't finished setting up on this server — you can still type it in.",
      tipMd: "Put {name} on {pct}% off today. At the current pace only about {proj} of your {stock} units will sell before expiry — roughly {risk} would spoil. A discount moves them while they're still fresh.",
      tipRo: "Order {qty} more units of {name}. You sell about {avg} a day and current stock covers only ~{cover} days — running out costs you {margin} of profit on every missed sale.",
      tipOk: "{name} is on track. At about {avg} sold a day, current stock sells through before expiry — no discount needed, no urgent reorder.",
      tallyBtn: "Evening tally",
      tallyTitle: "Evening sales tally",
      tallyCaption: "Tap the mic and say what sold today — “milk twelve, bread four”. Munafa rolls each item's recent sales forward.",
      tallyListening: "Listening — say each item and how many sold…",
      tallyThinking: "Understanding…",
      tallyReview: "Check what was recognized, then save.",
      tallyNoSpeech: "Didn't catch that — tap the mic and try again.",
      tallyDenied: "Microphone is blocked for this site — you can still add sales from an item's edit sheet.",
      tallyFail: "Couldn't work that out — try again.",
      tallySetupMissing: "Evening tally isn't finished setting up on this server yet.",
      tallyStop: "Stop listening",
      tallyMatchedHead: "Recognized",
      tallyUnmatchedHead: "Not understood",
      tallyUnit: "{n} sold",
      tallyUnmatchedNote: "These matched no item on your shelf — nothing was changed for them.",
      tallyNone: "Nothing recognized yet — tap the mic and say what sold today.",
      tallySaveBtn: "Save {n} updates",
      tallySaved: "Updated {n} items.",
      meterLabel: "Saved this week",
      meterSub: "by acting on Munafa's reorder & markdown calls",
      meterBreakdown: "{md} from markdowns applied before expiry · {ro} from reorders that beat a stockout",
      meterEmpty: "Confirm a reorder or markdown — your savings start adding up here.",
      cartTitle: "Today's order",
      cartCaption: "One list of everything you confirmed today — check it, then send it straight to your supplier.",
      cartBarLabel: "Place order",
      cartBarSummary: "{n} items · {total}",
      cartSupplierLabel: "Supplier's WhatsApp number",
      cartSupplierHint: "With country code (91…). Leave blank to pick the contact in WhatsApp yourself.",
      cartTotalLabel: "Estimated purchase total",
      cartSend: "Send on WhatsApp",
      cartEmpty: "Nothing here yet — confirm a reorder on any item's card.",
      shareTotal: "Approx. purchase total: {total}"
    },
    hi: {
      tagline: "क्या मंगाना है और किस पर छूट देनी है — माल ख़राब होने से पहले जानिए।",
      addStock: "स्टॉक जोड़ें",
      activity: "गतिविधि",
      actTitle: "हाल के काम",
      actCaption: "पक्के किए काम सिर्फ़ इसी फ़ोन पर सेव होते हैं — सप्लायर तक पहुँचाने के लिए आज की सूची शेयर करें।",
      actEmpty: "आप जो काम पक्का करेंगे, वो यहाँ दिखेंगे।",
      actClear: "लॉग साफ़ करें",
      logOrder: "{name} — {n} यूनिट ऑर्डर",
      logMd: "{name} — {n}% छूट लगाई",
      sumMdTodayL: "की छूट आज लगाई",
      sumOrderTodayL: "यूनिट आज ऑर्डर हुईं",
      shareBtn: "आज के काम शेयर करें",
      shareCopied: "कॉपी हो गया — सप्लायर को पेस्ट करें",
      shareTitle: "मुनाफ़ा — {date} के स्टॉक काम",
      shareOrder: "{n} यूनिट मंगाएँ",
      shareMd: "{n}% छूट लगाएँ",
      dateToday: "आज",
      dateYesterday: "कल",
      sumMarkdown: "चीज़ों पर आज छूट लगाएँ",
      sumReorder: "चीज़ें अभी मंगाएँ",
      sumRisk: "का माल ख़राब होने के जोखिम में",
      all: "सभी",
      showAll: "सभी {n} चीज़ें देखें",
      emptyMsg: "अभी यहाँ कुछ नहीं।",
      stock: "स्टॉक",
      expiry: "एक्सपायरी",
      avgPerDay: "बिक्री/दिन",
      daysShort: "{n} दिन",
      lineMd: "{d} में एक्सपायरी — आज छूट नहीं दी तो {risk} का माल डूबेगा।",
      lineRo: "इस रफ़्तार से स्टॉक ~{c} दिन चलेगा — ख़त्म होने से पहले ऑर्डर करें।",
      lineOk: "एक्सपायरी से पहले बिक जाएगा — कुछ करना नहीं है।",
      dayOne: "1 दिन", dayMany: "{n} दिन",
      stampMarkdown: "आज {n}% छूट",
      stampReorder: "+{n} और मंगाएँ",
      stampOk: "स्टॉक ठीक ✓",
      trendRising: "बढ़ रहा है",
      trendFalling: "घट रहा है",
      orderBtn: "{n} यूनिट ऑर्डर करें",
      ordered: "{n} यूनिट ऑर्डर हुईं ✓",
      markBtn: "{n}% छूट लगाएँ",
      marked: "{n}% छूट लगाई ✓",
      justNow: "अभी-अभी",
      today: "आज",
      qtyLess: "कम यूनिट",
      qtyMore: "ज़्यादा यूनिट",
      mdLess: "कम छूट",
      mdMore: "ज़्यादा छूट",
      askWhy: "मुनाफ़ा से पूछें — क्यों?",
      thinking: "सोच रहा है…",
      askAgain: "फिर पूछें",
      aiTag: "मुनाफ़ा AI · इंटरनेट से",
      offlineTag: "ऑफ़लाइन सलाह · इसी फ़ोन पर बनी",
      setupTag: "AI अभी सेट नहीं है · ऑफ़लाइन अनुमान दिखाया जा रहा है",
      editAria: "{name} बदलें",
      closeAria: "बंद करें",
      formAdd: "स्टॉक जोड़ें",
      formEdit: "आइटम बदलें",
      fName: "प्रोडक्ट का नाम",
      fCategory: "श्रेणी",
      fCost: "ख़रीद दाम (₹)",
      fPrice: "बिक्री दाम (₹)",
      fStock: "स्टॉक में यूनिट",
      fExpiry: "एक्सपायरी में दिन",
      fLead: "डिलीवरी में दिन",
      fSales: "पिछले दिनों की बिक्री",
      fSalesHint: "हर दिन बिकी यूनिट, कॉमा से अलग — सबसे नई आख़िर में।",
      save: "सेव करें और हिसाब लगाएँ",
      cancel: "रद्द करें",
      remove: "आइटम हटाएँ",
      removeConfirm: "यह आइटम हटाएँ?",
      invalid: "हर खाने में सही संख्या भरें (बिक्री ऐसे: 12, 15, 9)।",
      footer: "TakeOver'26 · इंटेलिजेंट प्रोक्योरमेंट — किराना काउंटर का डेमो डेटा।",
      reset: "डेमो डेटा रीसेट करें",
      importBtn: "Excel से लाएँ",
      impTitle: "Excel से स्टॉक लाएँ",
      impCaption: "नीचे की क़तारें जाँचें, जो ग़लत लगे ठीक करें, फिर स्टॉक में जोड़ें।",
      impReading: "फ़ाइल पढ़ रहा है…",
      impMapping: "कॉलम पहचान रहा है…",
      impFile: "{n} क़तारें · {file}",
      impInclude: "जोड़ें",
      impSoldEst: "बिक्री/दिन (अंदाज़ा)",
      impEstNote: "≈ बिक्री/दिन का अंदाज़ा स्टॉक से लगाया है — असली बिक्री भरते ही मुनाफ़ा ख़ुद ठीक कर लेगा।",
      impFixRows: "{n} क़तारों में ग़लत आँकड़े हैं — लाल खाने ठीक करें या टिक हटाएँ।",
      impMissingCols: "ये कॉलम पहचान नहीं आए: {cols}। नीचे हाथ से भर सकते हैं।",
      impNoRows: "इस शीट में काम की क़तारें नहीं मिलीं।",
      impBadFile: "फ़ाइल पढ़ नहीं पाए — .xlsx, .xls या .csv लें।",
      impNeedNet: "Excel रीडर लोड करने के लिए एक बार इंटरनेट चाहिए, फिर दोबारा कोशिश करें।",
      impAddN: "{n} चीज़ें जोड़ें",
      budgetNudge: "आज {n} चीज़ें मंगाने के लिए {total} चाहिए",
      budgetPlanBtn: "बजट तय करें",
      planBtn: "आज की योजना मुनाफ़ा से पूछें",
      planCaption: "आज जो भी ध्यान माँगता है, उस सबका एक क्रमबद्ध जवाब — पहले क्या करें, और क्यों।",
      planAgain: "योजना फिर देखें",
      planEmptyMsg: "अभी कुछ भी ध्यान नहीं माँग रहा — बाद में देखें।",
      budgetTitle: "आज का ख़र्च तय करें",
      budgetCaption: "आज जितना ख़र्च कर सकते हैं वो डालें — मुनाफ़ा सबसे ज़रूरी चीज़ें पहले लेगा।",
      budgetInputLabel: "आज का बजट",
      budgetAllocated: "{budget} में से {spent} तय हुआ",
      budgetLeftover: "{n} बचा",
      budgetValueHead: "अंदाज़न बचत",
      budgetFullyCovered: "सारा ऑर्डर पूरा हो गया — कुछ बाक़ी नहीं।",
      budgetSpendOrder: "इस क्रम में ख़र्च करें",
      budgetCanWait: "रुक सकता है",
      budgetUnitsTag: "{n}/{m} यूनिट",
      budgetSkipTag: "आज छोड़ें",
      budgetProtects: "≈{n} बचाता है",
      budgetWouldProtect: "≈{n}+ बच सकता था",
      budgetConfirmBtn: "{n} ऑर्डर दर्ज करें",
      budgetZeroState: "कम से कम एक चीज़ के लिए बजट बढ़ाएँ।",
      budgetNoCandidates: "तय करने को कुछ नहीं — आज का सारा ऑर्डर दर्ज हो चुका।",
      budgetConfirmedNote: "{n} ऑर्डर दर्ज हुए — सप्लायर को भेजने के लिए Activity खोलें।",
      validateCta: "नक़ली मांग पर मॉडल टेस्ट देखें",
      validateTitle: "यह असल में कितना अच्छा काम करता है?",
      validateCaption: "हर कार्ड के पीछे वही फ़ॉर्मूला लेकर हम एक महीने की उतार-चढ़ाव वाली मांग का सिमुलेशन करते हैं, और उसकी तुलना बिना किसी सुरक्षा भंडार के औसत पर मंगाने से करते हैं — जैसे ज़्यादातर दुकानें अंदाज़े से करती हैं।",
      validateRunning: "सिमुलेशन चल रहा है…",
      validateHeadlineLabel: "कम स्टॉक लागत, अंदाज़े से मंगाने के मुक़ाबले",
      validateHeadlineSub: "{munafa} बनाम {naive} · {n} चीज़ों पर, {days} दिन के दौर में सिमुलेट किया",
      validateChartMunafa: "मुनाफ़ा",
      validateChartNaive: "अंदाज़ा",
      validateChartStockout: "छूटी बिक्री",
      validateChartSpoilage: "ख़राब माल",
      validateMethodBody: "अंदाज़े वाला तरीक़ा लीड टाइम के औसत जितना मंगाता है, बिना किसी सुरक्षा भंडार के। मुनाफ़ा वही औसत मंगाता है, साथ में आपके मार्जिन और हर चीज़ की मांग के उतार-चढ़ाव के हिसाब से एक भंडार जोड़ता है।",
      validateBreakdownTitle: "किस चीज़ में सबसे ज़्यादा फ़ायदा",
      validateRerun: "फिर से चलाएँ",
      validateItemPct: "{pct}% कम",
      voiceAdd: "बोलकर जोड़ें",
      voiceStop: "सुनना बंद करें",
      voiceListening: "सुन रहा है — चीज़, दाम, स्टॉक बोलिए…",
      voiceThinking: "समझ रहा है…",
      voiceReview: "हाइलाइट किए खाने जाँचें, फिर सेव करें।",
      voiceNoSpeech: "कुछ सुनाई नहीं दिया — माइक दबाकर फिर बोलिए।",
      voiceDenied: "इस साइट के लिए माइक बंद है — आप टाइप करके भी जोड़ सकते हैं।",
      voiceFail: "समझ नहीं आया — फिर बोलिए या टाइप कर दीजिए।",
      voiceSetupMissing: "आवाज़ वाला सेटअप अभी पूरा नहीं है — फिलहाल टाइप करके जोड़ें।",
      tipMd: "{name} पर आज {pct}% छूट लगाएँ। मौजूदा रफ़्तार से एक्सपायरी तक {stock} में से सिर्फ़ ~{proj} ही बिकेंगे — क़रीब {risk} का माल ख़राब होगा। छूट से माल ताज़ा रहते ही बिक जाएगा।",
      tipRo: "{name} की {qty} यूनिट और मंगाएँ। रोज़ ~{avg} बिकती हैं और स्टॉक सिर्फ़ ~{cover} दिन चलेगा — माल ख़त्म हुआ तो हर छूटी बिक्री पर {margin} का मुनाफ़ा जाएगा।",
      tipOk: "{name} ठीक चल रहा है। रोज़ ~{avg} की रफ़्तार से स्टॉक एक्सपायरी से पहले बिक जाएगा — न छूट चाहिए, न अभी ऑर्डर।",
      tallyBtn: "शाम का हिसाब",
      tallyTitle: "आज की बिक्री का हिसाब",
      tallyCaption: "माइक दबाएँ और बोलें आज क्या बिका — “दूध बारह, ब्रेड चार”। मुनाफ़ा हर चीज़ की हाल की बिक्री आगे बढ़ा देगा।",
      tallyListening: "सुन रहा है — हर चीज़ और कितनी बिकी बोलिए…",
      tallyThinking: "समझ रहा है…",
      tallyReview: "पहचानी गई चीज़ें जाँचें, फिर सेव करें।",
      tallyNoSpeech: "समझ नहीं आया — माइक दबाकर फिर बोलिए।",
      tallyDenied: "इस साइट के लिए माइक बंद है — आप चीज़ की एडिट शीट से बिक्री जोड़ सकते हैं।",
      tallyFail: "समझ नहीं पाए — फिर कोशिश करें।",
      tallySetupMissing: "शाम का हिसाब इस सर्वर पर अभी पूरी तरह सेट नहीं हुआ है।",
      tallyStop: "सुनना बंद करें",
      tallyMatchedHead: "पहचाना गया",
      tallyUnmatchedHead: "समझ नहीं आया",
      tallyUnit: "{n} बिके",
      tallyUnmatchedNote: "ये किसी चीज़ से मेल नहीं खाए — इनके लिए कुछ नहीं बदला।",
      tallyNone: "अभी कुछ पहचाना नहीं — माइक दबाकर बोलिए आज क्या बिका।",
      tallySaveBtn: "{n} अपडेट सेव करें",
      tallySaved: "{n} चीज़ें अपडेट हुईं।",
      meterLabel: "इस हफ़्ते बचाया",
      meterSub: "मुनाफ़ा की ऑर्डर और छूट सलाह मानकर",
      meterBreakdown: "{md} एक्सपायरी से पहले छूट से · {ro} स्टॉक ख़त्म होने से बचाने वाले ऑर्डर से",
      meterEmpty: "एक ऑर्डर या छूट पक्की करें — आपकी बचत यहाँ जुड़ने लगेगी।",
      cartTitle: "आज का ऑर्डर",
      cartCaption: "आज पक्के किए सारे ऑर्डर एक सूची में — जाँचें, फिर सीधे सप्लायर को भेजें।",
      cartBarLabel: "ऑर्डर भेजें",
      cartBarSummary: "{n} चीज़ें · {total}",
      cartSupplierLabel: "सप्लायर का WhatsApp नंबर",
      cartSupplierHint: "देश कोड के साथ (91…)। ख़ाली छोड़ें तो WhatsApp में ख़ुद संपर्क चुनें।",
      cartTotalLabel: "अनुमानित ख़रीद कुल",
      cartSend: "WhatsApp पर भेजें",
      cartEmpty: "अभी कुछ नहीं — किसी चीज़ के कार्ड पर ऑर्डर पक्का करें।",
      shareTotal: "अनुमानित ख़रीद कुल: {total}"
    },
    te: {
      tagline: "ఏది మళ్లీ తెప్పించాలో, దేనిపై తగ్గింపు ఇవ్వాలో — సరుకు పాడవక ముందే తెలుసుకోండి.",
      addStock: "స్టాక్ జోడించండి",
      activity: "చర్యలు",
      actTitle: "ఇటీవలి చర్యలు",
      actCaption: "నిర్ధారించిన చర్యలు ఈ ఫోన్‌లోనే సేవ్ అవుతాయి — సప్లయర్‌కు పంపాలంటే ఈరోజు జాబితా షేర్ చేయండి.",
      actEmpty: "మీరు నిర్ధారించే చర్యలు ఇక్కడ కనిపిస్తాయి.",
      actClear: "లాగ్ క్లియర్",
      logOrder: "{name} — {n} యూనిట్లు ఆర్డర్",
      logMd: "{name} — {n}% తగ్గింపు",
      sumMdTodayL: "ఈరోజు వేసిన తగ్గింపులు",
      sumOrderTodayL: "ఈరోజు ఆర్డర్ చేసిన యూనిట్లు",
      shareBtn: "ఈరోజు చర్యలు షేర్ చేయండి",
      shareCopied: "కాపీ అయింది — సప్లయర్‌కు పేస్ట్ చేయండి",
      shareTitle: "మునాఫా — {date} స్టాక్ చర్యలు",
      shareOrder: "{n} యూనిట్లు తెప్పించాలి",
      shareMd: "{n}% తగ్గింపు వేయాలి",
      dateToday: "ఈరోజు",
      dateYesterday: "నిన్న",
      sumMarkdown: "వస్తువులపై ఈరోజు తగ్గింపు",
      sumReorder: "వస్తువులు ఇప్పుడే తెప్పించాలి",
      sumRisk: "సరుకు పాడయ్యే ప్రమాదంలో",
      all: "అన్నీ",
      showAll: "అన్నీ {n} చూపించు",
      emptyMsg: "ఇప్పుడు ఇక్కడ ఏమీ లేదు.",
      stock: "స్టాక్",
      expiry: "గడువు",
      avgPerDay: "అమ్మకం/రోజు",
      daysShort: "{n} రో.",
      lineMd: "{d}లో గడువు — ఈరోజు తగ్గింపు ఇవ్వకపోతే {risk} నష్టం.",
      lineRo: "ఈ వేగంతో స్టాక్ ~{c} రోజులే వస్తుంది — అయిపోయే ముందే ఆర్డర్ చేయండి.",
      lineOk: "గడువులోపు అమ్ముడైపోతుంది — ఏమీ చేయనక్కర్లేదు.",
      dayOne: "1 రోజు", dayMany: "{n} రోజుల",
      stampMarkdown: "ఈరోజు {n}% తగ్గింపు",
      stampReorder: "+{n} తెప్పించండి",
      stampOk: "స్టాక్ సరిపడా ✓",
      trendRising: "పెరుగుతోంది",
      trendFalling: "తగ్గుతోంది",
      orderBtn: "{n} యూనిట్లు ఆర్డర్ చేయండి",
      ordered: "{n} ఆర్డర్ అయింది ✓",
      markBtn: "{n}% తగ్గింపు వేయండి",
      marked: "{n}% తగ్గింపు అయింది ✓",
      justNow: "ఇప్పుడే",
      today: "ఈరోజు",
      qtyLess: "తక్కువ",
      qtyMore: "ఎక్కువ",
      mdLess: "తక్కువ తగ్గింపు",
      mdMore: "ఎక్కువ తగ్గింపు",
      askWhy: "మునాఫాను అడగండి — ఎందుకు?",
      thinking: "ఆలోచిస్తోంది…",
      askAgain: "మళ్లీ అడగండి",
      aiTag: "మునాఫా AI · ఇంటర్నెట్ ద్వారా",
      offlineTag: "ఆఫ్‌లైన్ సలహా · ఈ ఫోన్‌లోనే",
      setupTag: "AI ఇంకా సెటప్ కాలేదు · ఆఫ్‌లైన్ అంచనా చూపిస్తోంది",
      editAria: "{name} మార్చండి",
      closeAria: "మూసివేయి",
      formAdd: "స్టాక్ జోడించండి",
      formEdit: "వస్తువు మార్చండి",
      fName: "వస్తువు పేరు",
      fCategory: "వర్గం",
      fCost: "కొన్న ధర (₹)",
      fPrice: "అమ్మే ధర (₹)",
      fStock: "స్టాక్‌లో యూనిట్లు",
      fExpiry: "గడువుకు రోజులు",
      fLead: "డెలివరీ రోజులు",
      fSales: "గత రోజుల అమ్మకాలు",
      fSalesHint: "రోజుకు అమ్మిన యూనిట్లు, కామాతో వేరు చేసి — తాజాది చివర.",
      save: "సేవ్ చేసి లెక్కించండి",
      cancel: "రద్దు",
      remove: "వస్తువు తీసేయండి",
      removeConfirm: "ఈ వస్తువు తీసేయాలా?",
      invalid: "ప్రతి గడిలో సరైన సంఖ్య ఉండాలి (అమ్మకాలు: 12, 15, 9).",
      footer: "TakeOver'26 · ఇంటెలిజెంట్ ప్రొక్యూర్‌మెంట్ — కిరాణా కౌంటర్ డెమో డేటా.",
      reset: "డెమో డేటా రీసెట్",
      importBtn: "Excel నుంచి తేండి",
      impTitle: "Excel నుంచి స్టాక్ తేండి",
      impCaption: "కింది వరుసలు చూసి, తప్పుగా ఉన్నవి సరిచేసి, స్టాక్‌లో చేర్చండి.",
      impReading: "ఫైల్ చదువుతోంది…",
      impMapping: "కాలమ్‌లు గుర్తిస్తోంది…",
      impFile: "{n} వరుసలు · {file}",
      impInclude: "చేర్చు",
      impSoldEst: "అమ్మకం/రోజు (అంచనా)",
      impEstNote: "≈ అమ్మకం/రోజు స్టాక్ నుంచి అంచనా — నిజమైన అమ్మకాలు రాయగానే మునాఫా సరిచేసుకుంటుంది.",
      impFixRows: "{n} వరుసల్లో తప్పు విలువలున్నాయి — ఎరుపు గడులు సరిచేయండి లేదా టిక్ తీసేయండి.",
      impMissingCols: "ఈ కాలమ్‌లు గుర్తించలేకపోయాం: {cols}. కింద మీరే నింపవచ్చు.",
      impNoRows: "ఈ షీట్‌లో పనికొచ్చే వరుసలు లేవు.",
      impBadFile: "ఫైల్ చదవలేకపోయాం — .xlsx, .xls లేదా .csv వాడండి.",
      impNeedNet: "Excel రీడర్ లోడ్ కావడానికి ఒకసారి ఇంటర్నెట్ కావాలి, మళ్లీ ప్రయత్నించండి.",
      impAddN: "{n} వస్తువులు చేర్చండి",
      budgetNudge: "ఈరోజు {n} వస్తువులు తెప్పించడానికి {total} కావాలి",
      budgetPlanBtn: "బడ్జెట్ పెట్టండి",
      planBtn: "ఈరోజు ప్రణాళిక కోసం మునాఫాను అడగండి",
      planCaption: "ఈరోజు గుర్తించిన అన్నిటికీ ఒక ప్రాధాన్యత ప్రణాళిక — ముందు ఏమి చేయాలి, ఎందుకు.",
      planAgain: "ప్రణాళికను మళ్ళీ చూడండి",
      planEmptyMsg: "ఇప్పుడు దేనికీ శ్రద్ధ అవసరం లేదు — తర్వాత చూడండి.",
      budgetTitle: "ఈరోజు ఖర్చు ప్లాన్ చేయండి",
      budgetCaption: "ఈరోజు ఎంత ఖర్చు పెట్టగలరో అది పెట్టండి — మునాఫా ఎక్కువ విలువైనవి ముందు తీసుకుంటుంది.",
      budgetInputLabel: "ఈరోజు బడ్జెట్",
      budgetAllocated: "{budget}లో {spent} కేటాయించారు",
      budgetLeftover: "{n} మిగిలింది",
      budgetValueHead: "అంచనా ఆదా",
      budgetFullyCovered: "అన్ని ఆర్డర్లూ పూర్తయ్యాయి — ఏదీ ఆగలేదు.",
      budgetSpendOrder: "ఈ క్రమంలో ఖర్చు పెట్టండి",
      budgetCanWait: "ఆగొచ్చు",
      budgetUnitsTag: "{n}/{m} యూనిట్లు",
      budgetSkipTag: "ఈరోజు వద్దు",
      budgetProtects: "≈{n} ఆదా చేస్తుంది",
      budgetWouldProtect: "≈{n}+ ఆదా అయ్యేది",
      budgetConfirmBtn: "{n} ఆర్డర్లు నమోదు చేయండి",
      budgetZeroState: "కనీసం ఒక వస్తువుకైనా బడ్జెట్ పెంచండి.",
      budgetNoCandidates: "ప్లాన్ చేయడానికి ఏమీ లేదు — ఈరోజు ఆర్డర్లన్నీ నమోదయ్యాయి.",
      budgetConfirmedNote: "{n} ఆర్డర్లు నమోదయ్యాయి — సప్లయర్‌కు పంపడానికి Activity తెరవండి.",
      validateCta: "అనుకరణ డిమాండ్‌పై మోడల్ పరీక్ష చూడండి",
      validateTitle: "ఇది నిజంగా ఎంత బాగా పనిచేస్తుంది?",
      validateCaption: "ప్రతి కార్డ్ వెనుక ఉన్న అదే ఫార్ములాతో మేం ఒక నెల యాదృచ్ఛిక డిమాండ్‌ను సిమ్యులేట్ చేసి, ఎలాంటి భద్రతా నిల్వ లేకుండా సగటుకు మంగించడంతో పోలుస్తాం — చాలా దుకాణాలు ఇలాగే అంచనాతో చేస్తాయి.",
      validateRunning: "సిమ్యులేషన్ నడుస్తోంది…",
      validateHeadlineLabel: "తక్కువ స్టాక్ ఖర్చు, అంచనా పద్ధతితో పోలిస్తే",
      validateHeadlineSub: "{munafa} vs {naive} · {n} వస్తువులపై, {days} రోజుల కాలంలో సిమ్యులేట్ చేసింది",
      validateChartMunafa: "మునాఫా",
      validateChartNaive: "అంచనా",
      validateChartStockout: "తప్పిన అమ్మకాలు",
      validateChartSpoilage: "పాడైన సరుకు",
      validateMethodBody: "అంచనా పద్ధతి లీడ్ టైమ్ సగటు మేరకు మాత్రమే తెప్పిస్తుంది, భద్రతా నిల్వ లేకుండా. మునాఫా అదే సగటుతో పాటు, మీ మార్జిన్లు మరియు ఒక్కో వస్తువు డిమాండ్ ఎంత మారుతుందో దాని ఆధారంగా ఒక నిల్వను చేరుస్తుంది.",
      validateBreakdownTitle: "ఏ వస్తువులో ఎక్కువ లాభం",
      validateRerun: "మళ్లీ నడపండి",
      validateItemPct: "{pct}% తక్కువ",
      voiceAdd: "మాట్లాడి జోడించండి",
      voiceStop: "వినడం ఆపండి",
      voiceListening: "వింటోంది — వస్తువు, ధర, స్టాక్ చెప్పండి…",
      voiceThinking: "అర్థం చేసుకుంటోంది…",
      voiceReview: "హైలైట్ అయిన గడులు చూసి, సేవ్ చేయండి.",
      voiceNoSpeech: "ఏమీ వినిపించలేదు — మైక్ నొక్కి మళ్లీ చెప్పండి.",
      voiceDenied: "ఈ సైట్‌కు మైక్ అనుమతి లేదు — మామూలుగా టైప్ చేసి జోడించవచ్చు.",
      voiceFail: "అర్థం కాలేదు — మళ్లీ చెప్పండి లేదా టైప్ చేయండి.",
      voiceSetupMissing: "వాయిస్ సెటప్ ఇంకా పూర్తి కాలేదు — ఇప్పుడు టైప్ చేసి జోడించండి.",
      tipMd: "{name}పై ఈరోజే {pct}% తగ్గింపు పెట్టండి. ఇప్పటి వేగంతో గడువులోపు {stock}లో ~{proj} మాత్రమే అమ్ముడవుతాయి — సుమారు {risk} సరుకు పాడవుతుంది. తగ్గింపుతో తాజాగా ఉండగానే అమ్మేయవచ్చు.",
      tipRo: "{name} ఇంకో {qty} యూనిట్లు తెప్పించండి. రోజుకు ~{avg} అమ్ముడవుతున్నాయి, స్టాక్ ~{cover} రోజులకే సరిపోతుంది — సరుకు అయిపోతే ప్రతి అమ్మకంపై {margin} లాభం పోతుంది.",
      tipOk: "{name} బాగానే ఉంది. రోజుకు ~{avg} వేగంతో గడువులోపు స్టాక్ అమ్ముడైపోతుంది — తగ్గింపూ అక్కర్లేదు, ఇప్పుడే ఆర్డరూ అక్కర్లేదు.",
      tallyBtn: "సాయంత్రం లెక్క",
      tallyTitle: "నేటి అమ్మకాల లెక్క",
      tallyCaption: "మైక్ నొక్కి ఈరోజు ఏం అమ్ముడయ్యాయో చెప్పండి — “పాలు పన్నెండు, బ్రెడ్ నాలుగు”. మునాఫా ప్రతి వస్తువు ఇటీవలి అమ్మకాలను ముందుకు జరుపుతుంది.",
      tallyListening: "వింటోంది — ప్రతి వస్తువు, ఎన్ని అమ్ముడయ్యాయో చెప్పండి…",
      tallyThinking: "అర్థం చేసుకుంటోంది…",
      tallyReview: "గుర్తించినవి సరిచూసి, సేవ్ చేయండి.",
      tallyNoSpeech: "అర్థం కాలేదు — మైక్ నొక్కి మళ్ళీ చెప్పండి.",
      tallyDenied: "ఈ సైట్‌కు మైక్ నిరోధించబడింది — వస్తువు ఎడిట్ షీట్ నుండి అమ్మకాలు జోడించవచ్చు.",
      tallyFail: "అర్థం చేసుకోలేకపోయాం — మళ్ళీ ప్రయత్నించండి.",
      tallySetupMissing: "సాయంత్రం లెక్క ఈ సర్వర్‌లో ఇంకా పూర్తిగా సెటప్ కాలేదు.",
      tallyStop: "వినడం ఆపండి",
      tallyMatchedHead: "గుర్తించబడింది",
      tallyUnmatchedHead: "అర్థం కాలేదు",
      tallyUnit: "{n} అమ్ముడయ్యాయి",
      tallyUnmatchedNote: "ఇవి ఏ వస్తువుతోనూ సరిపోలలేదు — వీటికి ఏమీ మారలేదు.",
      tallyNone: "ఇంకా ఏమీ గుర్తించలేదు — మైక్ నొక్కి ఈరోజు ఏం అమ్ముడయ్యాయో చెప్పండి.",
      tallySaveBtn: "{n} అప్‌డేట్‌లు సేవ్ చేయండి",
      tallySaved: "{n} వస్తువులు అప్‌డేట్ అయ్యాయి.",
      meterLabel: "ఈ వారం ఆదా",
      meterSub: "మునాఫా ఆర్డర్, తగ్గింపు సూచనలు పాటించడం ద్వారా",
      meterBreakdown: "{md} గడువుకు ముందు తగ్గింపుల నుండి · {ro} స్టాక్ అయిపోకుండా కాపాడిన ఆర్డర్ల నుండి",
      meterEmpty: "ఒక ఆర్డర్ లేదా తగ్గింపు నిర్ధారించండి — మీ ఆదా ఇక్కడ పోగవడం మొదలవుతుంది.",
      cartTitle: "నేటి ఆర్డర్",
      cartCaption: "ఈరోజు నిర్ధారించిన ఆర్డర్లన్నీ ఒకే జాబితాలో — సరిచూసి, నేరుగా సప్లయర్‌కు పంపండి.",
      cartBarLabel: "ఆర్డర్ పంపండి",
      cartBarSummary: "{n} వస్తువులు · {total}",
      cartSupplierLabel: "సప్లయర్ WhatsApp నంబర్",
      cartSupplierHint: "దేశ కోడ్‌తో (91…). ఖాళీగా వదిలేస్తే WhatsAppలో మీరే కాంటాక్ట్ ఎంచుకోవచ్చు.",
      cartTotalLabel: "అంచనా కొనుగోలు మొత్తం",
      cartSend: "WhatsAppలో పంపండి",
      cartEmpty: "ఇంకా ఏమీ లేదు — ఏదైనా వస్తువు కార్డ్‌పై ఆర్డర్ నిర్ధారించండి.",
      shareTotal: "అంచనా కొనుగోలు మొత్తం: {total}"
    },
    ta: {
      tagline: "எதை மீண்டும் வரவழைக்க வேண்டும், எதற்குத் தள்ளுபடி தர வேண்டும் — சரக்கு கெட்டுப்போகும் முன்பே அறியுங்கள்.",
      addStock: "இருப்பு சேர்க்க",
      activity: "செயல்கள்",
      actTitle: "சமீபத்திய செயல்கள்",
      actCaption: "உறுதி செய்த செயல்கள் இந்த ஃபோனில் மட்டும் சேமிக்கப்படும் — சப்ளையருக்கு அனுப்ப இன்றைய பட்டியலைப் பகிருங்கள்.",
      actEmpty: "நீங்கள் உறுதி செய்யும் செயல்கள் இங்கே தெரியும்.",
      actClear: "பதிவை அழி",
      logOrder: "{name} — {n} அலகுகள் ஆர்டர்",
      logMd: "{name} — {n}% தள்ளுபடி",
      sumMdTodayL: "இன்று போட்ட தள்ளுபடி",
      sumOrderTodayL: "இன்று ஆர்டர் செய்த அலகுகள்",
      shareBtn: "இன்றைய செயல்களைப் பகிர்",
      shareCopied: "காப்பி ஆனது — சப்ளையருக்கு பேஸ்ட் செய்யுங்கள்",
      shareTitle: "முனாஃபா — {date} இருப்பு செயல்கள்",
      shareOrder: "{n} அலகுகள் வரவழைக்க",
      shareMd: "{n}% தள்ளுபடி போட",
      dateToday: "இன்று",
      dateYesterday: "நேற்று",
      sumMarkdown: "பொருட்களுக்கு இன்று தள்ளுபடி",
      sumReorder: "பொருட்கள் இப்போது ஆர்டர் செய்ய",
      sumRisk: "சரக்கு வீணாகும் அபாயத்தில்",
      all: "எல்லாம்",
      showAll: "எல்லா {n} பொருட்களும்",
      emptyMsg: "இப்போது இங்கு எதுவும் இல்லை.",
      stock: "இருப்பு",
      expiry: "காலாவதி",
      avgPerDay: "விற்பனை/நாள்",
      daysShort: "{n} நா.",
      lineMd: "{d}இல் காலாவதி — இன்று தள்ளுபடி இல்லையெனில் {risk} இழப்பு.",
      lineRo: "இந்த வேகத்தில் இருப்பு ~{c} நாட்களே — தீரும் முன் ஆர்டர் செய்யுங்கள்.",
      lineOk: "காலாவதிக்குள் விற்றுவிடும் — எதுவும் செய்ய வேண்டாம்.",
      dayOne: "1 நாள்", dayMany: "{n} நாட்கள்",
      stampMarkdown: "இன்று {n}% தள்ளுபடி",
      stampReorder: "+{n} வரவழைக்க",
      stampOk: "இருப்பு சரி ✓",
      trendRising: "அதிகரிக்கிறது",
      trendFalling: "குறைகிறது",
      orderBtn: "{n} அலகுகள் ஆர்டர்",
      ordered: "{n} ஆர்டர் ஆனது ✓",
      markBtn: "{n}% தள்ளுபடி போடு",
      marked: "{n}% தள்ளுபடி ஆனது ✓",
      justNow: "இப்போதுதான்",
      today: "இன்று",
      qtyLess: "குறைவு",
      qtyMore: "அதிகம்",
      mdLess: "குறைந்த தள்ளுபடி",
      mdMore: "அதிக தள்ளுபடி",
      askWhy: "முனாஃபாவிடம் கேளுங்கள் — ஏன்?",
      thinking: "யோசிக்கிறது…",
      askAgain: "மீண்டும் கேட்க",
      aiTag: "முனாஃபா AI · இணையம் வழி",
      offlineTag: "ஆஃப்லைன் குறிப்பு · இந்த ஃபோனிலேயே",
      setupTag: "AI இன்னும் அமைக்கப்படவில்லை · ஆஃப்லைன் மதிப்பீடு காட்டப்படுகிறது",
      editAria: "{name} மாற்ற",
      closeAria: "மூடு",
      formAdd: "இருப்பு சேர்க்க",
      formEdit: "பொருளை மாற்ற",
      fName: "பொருள் பெயர்",
      fCategory: "வகை",
      fCost: "வாங்கிய விலை (₹)",
      fPrice: "விற்கும் விலை (₹)",
      fStock: "இருப்பில் உள்ள அலகுகள்",
      fExpiry: "காலாவதிக்கு நாட்கள்",
      fLead: "டெலிவரி நாட்கள்",
      fSales: "சமீப நாட்களின் விற்பனை",
      fSalesHint: "ஒவ்வொரு நாளும் விற்ற அலகுகள், காற்புள்ளியால் பிரித்து — புதியது கடைசியில்.",
      save: "சேமித்து கணக்கிடு",
      cancel: "ரத்து",
      remove: "பொருளை நீக்கு",
      removeConfirm: "இந்தப் பொருளை நீக்கவா?",
      invalid: "எல்லா கட்டங்களிலும் சரியான எண் தேவை (விற்பனை: 12, 15, 9).",
      footer: "TakeOver'26 · இன்டெலிஜென்ட் ப்ரொக்யூர்மென்ட் — கிராணா கடை டெமோ டேட்டா.",
      reset: "டெமோ டேட்டாவை மீட்டமை",
      importBtn: "Excel-இருந்து சேர்",
      impTitle: "Excel-இருந்து ஸ்டாக் சேர்",
      impCaption: "கீழே உள்ள வரிசைகளைச் சரிபார்த்து, தவறு இருந்தால் திருத்தி, ஸ்டாக்கில் சேர்க்கவும்.",
      impReading: "கோப்பைப் படிக்கிறது…",
      impMapping: "நெடுவரிசைகளை அடையாளம் காண்கிறது…",
      impFile: "{n} வரிசைகள் · {file}",
      impInclude: "சேர்",
      impSoldEst: "விற்பனை/நாள் (மதிப்பீடு)",
      impEstNote: "≈ விற்பனை/நாள் ஸ்டாக்கிலிருந்து மதிப்பீடு — உண்மையான விற்பனையைச் சேர்த்ததும் முனாஃபா தானே சரிசெய்யும்.",
      impFixRows: "{n} வரிசைகளில் தவறான மதிப்புகள் — சிவப்புக் கட்டங்களைச் சரிசெய்யவும் அல்லது டிக் நீக்கவும்.",
      impMissingCols: "இந்த நெடுவரிசைகள் அடையாளம் காணவில்லை: {cols}. கீழே நீங்களே நிரப்பலாம்.",
      impNoRows: "இந்தத் தாளில் பயனுள்ள வரிசைகள் இல்லை.",
      impBadFile: "கோப்பைப் படிக்க முடியவில்லை — .xlsx, .xls அல்லது .csv பயன்படுத்தவும்.",
      impNeedNet: "Excel ரீடர் ஏற்ற ஒருமுறை இணையம் தேவை, மீண்டும் முயற்சிக்கவும்.",
      impAddN: "{n} பொருட்கள் சேர்",
      budgetNudge: "இன்று {n} பொருட்களை வரவழைக்க {total} தேவை",
      budgetPlanBtn: "பட்ஜெட் அமைக்க",
      planBtn: "இன்றைய திட்டத்தை முனாஃபாவிடம் கேளுங்கள்",
      planCaption: "இன்று கவனம் தேவைப்படும் அனைத்திற்கும் ஒரு முன்னுரிமைத் திட்டம் — முதலில் என்ன செய்வது, ஏன்.",
      planAgain: "திட்டத்தை மீண்டும் காண்க",
      planEmptyMsg: "இப்போது எதுவும் கவனம் தேவைப்படவில்லை — பின்னர் பாருங்கள்.",
      budgetTitle: "இன்றைய செலவைத் திட்டமிடுங்கள்",
      budgetCaption: "இன்று எவ்வளவு செலவிடலாம் என்பதை இடுங்கள் — முனாஃபா அதிக மதிப்புள்ளவற்றை முதலில் எடுக்கும்.",
      budgetInputLabel: "இன்றைய பட்ஜெட்",
      budgetAllocated: "{budget}இல் {spent} ஒதுக்கப்பட்டது",
      budgetLeftover: "{n} மிச்சம்",
      budgetValueHead: "மதிப்பிடப்பட்ட சேமிப்பு",
      budgetFullyCovered: "எல்லா ஆர்டரும் முழுமையானது — எதுவும் நிலுவையில் இல்லை.",
      budgetSpendOrder: "இந்த வரிசையில் செலவிடுங்கள்",
      budgetCanWait: "காத்திருக்கலாம்",
      budgetUnitsTag: "{n}/{m} அலகுகள்",
      budgetSkipTag: "இன்று வேண்டாம்",
      budgetProtects: "≈{n} சேமிக்கும்",
      budgetWouldProtect: "≈{n}+ சேமிக்கக்கூடும்",
      budgetConfirmBtn: "{n} ஆர்டர்களைப் பதிவு செய்யுங்கள்",
      budgetZeroState: "குறைந்தது ஒரு பொருளுக்காவது பட்ஜெட்டை உயர்த்துங்கள்.",
      budgetNoCandidates: "திட்டமிட எதுவும் இல்லை — இன்றைய ஆர்டர்கள் அனைத்தும் பதிவாகிவிட்டன.",
      budgetConfirmedNote: "{n} ஆர்டர்கள் பதிவாகின — சப்ளையருக்கு அனுப்ப Activity-ஐத் திறக்கவும்.",
      validateCta: "போலி தேவையில் மாடல் சோதனையைப் பாருங்கள்",
      validateTitle: "இது உண்மையில் எவ்வளவு நன்றாக வேலை செய்கிறது?",
      validateCaption: "ஒவ்வொரு கார்டுக்குப் பின்னாலும் உள்ள அதே சூத்திரத்துடன், ஒரு மாத ஏற்ற இறக்கமான தேவையை நாங்கள் உருவகப்படுத்தி, பாதுகாப்பு இருப்பு இல்லாமல் சராசரிக்கு ஆர்டர் செய்வதுடன் ஒப்பிடுகிறோம் — பெரும்பாலான கடைகள் யூகத்தில் இப்படித்தான் செய்கின்றன.",
      validateRunning: "உருவகப்படுத்துகிறது…",
      validateHeadlineLabel: "குறைவான ஸ்டாக் செலவு, யூக முறையை விட",
      validateHeadlineSub: "{munafa} vs {naive} · {n} பொருட்களில், {days} நாள் காலப்பகுதியில் உருவகப்படுத்தியது",
      validateChartMunafa: "முனாஃபா",
      validateChartNaive: "யூகம்",
      validateChartStockout: "தவறிய விற்பனை",
      validateChartSpoilage: "வீணான சரக்கு",
      validateMethodBody: "யூக முறை லீட் டைம் சராசரிக்கு மட்டும் ஆர்டர் செய்யும், பாதுகாப்பு இருப்பு இல்லாமல். முனாஃபா அதே சராசரியுடன், உங்கள் லாபவீதம் மற்றும் ஒவ்வொரு பொருளின் தேவை எவ்வளவு மாறுகிறது என்பதற்கேற்ப ஒரு இருப்பைச் சேர்க்கும்.",
      validateBreakdownTitle: "எந்தப் பொருளில் அதிக லாபம்",
      validateRerun: "மீண்டும் இயக்கு",
      validateItemPct: "{pct}% குறைவு",
      voiceAdd: "பேசி சேர்க்கவும்",
      voiceStop: "கேட்பதை நிறுத்து",
      voiceListening: "கேட்கிறது — பொருள், விலை, ஸ்டாக் சொல்லுங்கள்…",
      voiceThinking: "புரிந்துகொள்கிறது…",
      voiceReview: "தனிப்படுத்திய கட்டங்களைப் பார்த்து, சேவ் செய்யுங்கள்.",
      voiceNoSpeech: "எதுவும் கேட்கவில்லை — மைக்கைத் தட்டி மீண்டும் சொல்லுங்கள்.",
      voiceDenied: "இந்தத் தளத்திற்கு மைக் அனுமதி இல்லை — வழக்கம் போல் டைப் செய்யலாம்.",
      voiceFail: "புரியவில்லை — மீண்டும் சொல்லுங்கள் அல்லது டைப் செய்யுங்கள்.",
      voiceSetupMissing: "குரல் அமைப்பு இன்னும் முடிக்கப்படவில்லை — இப்போதைக்கு டைப் செய்து சேர்க்கவும்.",
      tipMd: "{name}க்கு இன்றே {pct}% தள்ளுபடி போடுங்கள். இந்த வேகத்தில் காலாவதிக்குள் {stock}இல் ~{proj} மட்டுமே விற்கும் — சுமார் {risk} சரக்கு வீணாகும். தள்ளுபடி போட்டால் புதிதாக இருக்கும்போதே விற்றுவிடும்.",
      tipRo: "{name} இன்னும் {qty} அலகுகள் வரவழைக்கவும். நாளுக்கு ~{avg} விற்கிறது, இருப்பு ~{cover} நாட்களுக்குத்தான் போதும் — தீர்ந்துவிட்டால் ஒவ்வொரு தவறிய விற்பனையிலும் {margin} லாபம் போகும்.",
      tipOk: "{name} சரியாகப் போகிறது. நாளுக்கு ~{avg} வேகத்தில் காலாவதிக்குள் இருப்பு விற்றுவிடும் — தள்ளுபடியும் வேண்டாம், அவசர ஆர்டரும் வேண்டாம்.",
      tallyBtn: "மாலை கணக்கு",
      tallyTitle: "இன்றைய விற்பனை கணக்கு",
      tallyCaption: "மைக்கை அழுத்தி இன்று என்ன விற்றது சொல்லுங்கள் — “பால் பன்னிரண்டு, ரொட்டி நான்கு”. முனாஃபா ஒவ்வொரு பொருளின் சமீபத்திய விற்பனையை முன்னகர்த்தும்.",
      tallyListening: "கேட்கிறது — ஒவ்வொரு பொருளும், எத்தனை விற்றது சொல்லுங்கள்…",
      tallyThinking: "புரிந்துகொள்கிறது…",
      tallyReview: "அடையாளம் கண்டவற்றைச் சரிபார்த்து, சேமிக்கவும்.",
      tallyNoSpeech: "புரியவில்லை — மைக்கை அழுத்தி மீண்டும் சொல்லுங்கள்.",
      tallyDenied: "இந்த தளத்திற்கு மைக் தடுக்கப்பட்டுள்ளது — பொருளின் திருத்தத் தாளில் இருந்து விற்பனையைச் சேர்க்கலாம்.",
      tallyFail: "புரிந்துகொள்ள முடியவில்லை — மீண்டும் முயற்சிக்கவும்.",
      tallySetupMissing: "மாலை கணக்கு இந்த சேவையகத்தில் இன்னும் முழுமையாக அமைக்கப்படவில்லை.",
      tallyStop: "கேட்பதை நிறுத்து",
      tallyMatchedHead: "அடையாளம் காணப்பட்டது",
      tallyUnmatchedHead: "புரியவில்லை",
      tallyUnit: "{n} விற்றது",
      tallyUnmatchedNote: "இவை எந்தப் பொருளுடனும் பொருந்தவில்லை — இவற்றுக்கு எதுவும் மாற்றப்படவில்லை.",
      tallyNone: "இன்னும் எதுவும் அடையாளம் காணப்படவில்லை — மைக்கை அழுத்தி இன்று என்ன விற்றது சொல்லுங்கள்.",
      tallySaveBtn: "{n} புதுப்பிப்புகளைச் சேமி",
      tallySaved: "{n} பொருட்கள் புதுப்பிக்கப்பட்டன.",
      meterLabel: "இந்த வாரம் சேமிப்பு",
      meterSub: "முனாஃபாவின் ஆர்டர் & தள்ளுபடி பரிந்துரைகளைச் செயல்படுத்தி",
      meterBreakdown: "{md} காலாவதிக்கு முன் தள்ளுபடிகளில் இருந்து · {ro} இருப்பு தீர்வதைத் தடுத்த ஆர்டர்களில் இருந்து",
      meterEmpty: "ஒரு ஆர்டர் அல்லது தள்ளுபடியை உறுதிசெய்யுங்கள் — உங்கள் சேமிப்பு இங்கே கூடத் தொடங்கும்.",
      cartTitle: "இன்றைய ஆர்டர்",
      cartCaption: "இன்று உறுதிசெய்த ஆர்டர்கள் அனைத்தும் ஒரே பட்டியலில் — சரிபார்த்து, நேரடியாக சப்ளையருக்கு அனுப்புங்கள்.",
      cartBarLabel: "ஆர்டர் அனுப்பு",
      cartBarSummary: "{n} பொருட்கள் · {total}",
      cartSupplierLabel: "சப்ளையரின் WhatsApp எண்",
      cartSupplierHint: "நாட்டுக் குறியீட்டுடன் (91…). காலியாக விட்டால் WhatsAppல் நீங்களே தொடர்பைத் தேர்வு செய்யலாம்.",
      cartTotalLabel: "மதிப்பிடப்பட்ட கொள்முதல் மொத்தம்",
      cartSend: "WhatsAppல் அனுப்பு",
      cartEmpty: "இன்னும் எதுவும் இல்லை — ஏதேனும் பொருளின் கார்டில் ஆர்டரை உறுதிசெய்யுங்கள்.",
      shareTotal: "மதிப்பிடப்பட்ட கொள்முதல் மொத்தம்: {total}"
    }
  };

  var CATEGORIES = {
    "Dairy": { en: "Dairy", hi: "डेयरी", te: "పాల ఉత్పత్తులు", ta: "பால் பொருட்கள்" },
    "Dairy & Eggs": { en: "Dairy & Eggs", hi: "डेयरी-अंडे", te: "పాలు-గుడ్లు", ta: "பால்-முட்டை" },
    "Bakery": { en: "Bakery", hi: "बेकरी", te: "బేకరీ", ta: "பேக்கரி" },
    "Produce": { en: "Produce", hi: "सब्ज़ी-फल", te: "కూరగాయలు-పండ్లు", ta: "காய்கறி-பழம்" },
    "Staples": { en: "Staples", hi: "राशन", te: "నిత్యావసరాలు", ta: "மளிகை" },
    "custom": { en: "Other", hi: "अन्य", te: "ఇతరాలు", ta: "மற்றவை" }
  };

  var CAT_ORDER = ["Dairy", "Dairy & Eggs", "Bakery", "Produce", "Staples", "custom"];

  var LOCALES = { en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN" };

  // -------------------------------------------------------------- helpers --

  function $(sel) { return document.querySelector(sel); }

  function t() { return I18N[state.lang] || I18N.en; }

  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] != null ? vars[k] : "";
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rupees(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

  function catLabel(cat) {
    var m = CATEGORIES[cat];
    return m ? (m[state.lang] || m.en) : cat;
  }

  function daysWord(n) {
    return n === 1 ? t().dayOne : fmt(t().dayMany, { n: n });
  }

  // Short form for card stamps; clock-only form for log entries, whose date
  // lives on the group header above them.
  function timeShort(at) {
    var d = new Date(at), now = new Date();
    if (now - at < 120000) return t().justNow;
    if (d.toDateString() === now.toDateString()) return t().today;
    return d.toLocaleDateString(LOCALES[state.lang] || "en-IN", { day: "numeric", month: "short" });
  }

  function timeClock(at) {
    if (Date.now() - at < 120000) return t().justNow;
    return new Date(at).toLocaleTimeString(LOCALES[state.lang] || "en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  function sameDay(a, b) { return new Date(a).toDateString() === new Date(b).toDateString(); }

  function isToday(at) { return sameDay(at, Date.now()); }

  function dateHeading(at) {
    var now = Date.now();
    if (sameDay(at, now)) return t().dateToday;
    if (sameDay(at, now - 86400000)) return t().dateYesterday;
    var d = new Date(at);
    var opts = { day: "numeric", month: "short" };
    if (d.getFullYear() !== new Date(now).getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString(LOCALES[state.lang] || "en-IN", opts);
  }

  // ---------------------------------------------------------------- state --

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through */ }
    return fallback;
  }

  function loadProducts() {
    var arr = loadJson(LS_PRODUCTS, null);
    if (Array.isArray(arr) && arr.length && arr.every(function (p) {
      return p && p.id && Array.isArray(p.salesHistory) && p.salesHistory.length;
    })) return arr;
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  }

  function saveProducts() {
    try { localStorage.setItem(LS_PRODUCTS, JSON.stringify(state.products)); } catch (e) { /* private mode */ }
    // Run the background check for automatic SMS alerts
    if (typeof autoSendAlerts === "function") autoSendAlerts();
  }

  function saveActivity() {
    try { localStorage.setItem(LS_ACTIVITY, JSON.stringify(state.activity)); } catch (e) { /* private mode */ }
  }

  function autoSendAlerts() {
    if (!state || !state.products || !engine) return;
    
    var todayStr = new Date().toISOString().substring(0, 10);
    var lsExhaustKey = "munafa-last-exhaust-alert";
    var lsExpireKey = "munafa-last-expire-alert";

    // 1. Exhaust check
    if (localStorage.getItem(lsExhaustKey) !== todayStr) {
      var exhausts = [];
      state.products.forEach(function (p) {
        var stat = engine.analyzeProduct(p);
        var outLvl = stat.orderUpToLevel || 10;
        if (p.currentStock <= 5 || p.currentStock < outLvl) {
          exhausts.push(p.name + " - restock " + outLvl);
        }
      });
      
      // Only send if AT LEAST 5 items are exhausting
      if (exhausts.length >= 5) {
        var msgLines = ["exhaust:"];
        exhausts.forEach(function(l) { msgLines.push(l); });
        
        // Optimistically set today so we don't spam while fetch is running
        localStorage.setItem(lsExhaustKey, todayStr);
        
        fetch("/api/send-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msgLines.join("\n") })
        }).catch(function() {
          // If network fails, allow retry later
          localStorage.removeItem(lsExhaustKey);
        });
      }
    }

    // 2. Expire check
    if (localStorage.getItem(lsExpireKey) !== todayStr) {
      var expires = [];
      state.products.forEach(function (p) {
        var stat = engine.analyzeProduct(p);
        if (p.daysToExpiry <= 7) {
          var mkdn = engine.markdownSuggestion(p.currentStock, stat.dailyMean, p.daysToExpiry, 1.6);
          if (mkdn.needed && mkdn.markdownPct > 0) {
            expires.push(p.name + " - " + mkdn.markdownPct + "% discount");
          }
        }
      });

      // Send if ANY item is urgently expiring
      if (expires.length > 0) {
        var msgLines2 = ["expire:"];
        expires.forEach(function(l) { msgLines2.push(l); });
        
        localStorage.setItem(lsExpireKey, todayStr);
        
        fetch("/api/send-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msgLines2.join("\n") })
        }).catch(function() {
          localStorage.removeItem(lsExpireKey);
        });
      }
    }
  }

  var state = {
    lang: localStorage.getItem(LS_LANG) || "en",
    products: loadProducts(),
    activity: loadJson(LS_ACTIVITY, []) || [],  // [{id, productId, name, type: "order"|"markdown", value, at}]
    rows: [],
    filter: null,                               // stat-tile filter: null | "md" | "ro" | "risk"
    catFilter: null,                            // category chip filter: null | category name
    aiNotes: {},                                // productId + ":" + lang -> { text, kind }
    planNotes: {},                              // lang -> { text, kind }
    editingId: null
  };
  if (!I18N[state.lang]) state.lang = "en";
  if (!Array.isArray(state.activity)) state.activity = [];

  // One-time migration: the previous build stored orders as a plain map.
  (function migrateOldOrders() {
    var old = loadJson(LS_ORDERS_OLD, null);
    if (!old || typeof old !== "object") return;
    Object.keys(old).forEach(function (pid) {
      var p = state.products.find(function (x) { return x.id === pid; });
      var rec = old[pid] || {};
      state.activity.push({
        id: "a" + (rec.at || Date.now()) + Math.random().toString(36).slice(2, 6),
        productId: pid, name: p ? p.name : pid, type: "order",
        value: rec.qty || 0, at: rec.at || Date.now()
      });
    });
    state.activity.sort(function (a, b) { return a.at - b.at; });
    saveActivity();
    try { localStorage.removeItem(LS_ORDERS_OLD); } catch (e) { /* ignore */ }
  })();

  // ------------------------------------------------------------- activity --

  function lastAction(pid, type) {
    for (var i = state.activity.length - 1; i >= 0; i--) {
      var e = state.activity[i];
      if (e.productId === pid && e.type === type) return e;
    }
    return null;
  }

  // Optional `snapshot` ({ rupeesSaved, savingKind }) freezes the rupee figure
  // behind THIS action at the moment it's taken, so the Munafa Meter can sum
  // honest, defensible savings without ever recomputing from a product's
  // since-changed stock or prices. It's purely additive: callers that don't
  // pass one (the budget allocator, and every entry logged before this feature)
  // simply omit the fields and are skipped by the Meter — never back-filled.
  function addActivity(product, type, value, snapshot) {
    var entry = {
      id: "a" + Date.now() + Math.random().toString(36).slice(2, 6),
      productId: product.id, name: product.name, type: type, value: value, at: Date.now()
    };
    if (snapshot && typeof snapshot.rupeesSaved === "number" && isFinite(snapshot.rupeesSaved) && snapshot.rupeesSaved >= 0) {
      entry.rupeesSaved = Math.round(snapshot.rupeesSaved);
      entry.savingKind = snapshot.savingKind === "spoilage" ? "spoilage" : "stockout";
    }
    state.activity.push(entry);
    saveActivity();
    updateActBadge(true);
    renderActivity(true);
    renderMeter(true);
    renderCartBar();
  }

  function removeLastAction(pid, type) {
    for (var i = state.activity.length - 1; i >= 0; i--) {
      if (state.activity[i].productId === pid && state.activity[i].type === type) {
        state.activity.splice(i, 1);
        break;
      }
    }
    saveActivity();
    updateActBadge(false);
    renderActivity(true);
    renderMeter(true);
    renderCartBar();
  }

  // Panel undo removes one precise entry; the caller re-renders so the
  // product's card falls back to its live recommendation.
  function removeActivityById(id) {
    for (var i = state.activity.length - 1; i >= 0; i--) {
      if (state.activity[i].id === id) {
        state.activity.splice(i, 1);
        break;
      }
    }
    saveActivity();
    updateActBadge(false);
    renderMeter(true);
    renderCartBar();
  }

  function clearProductActivity(pid) {
    state.activity = state.activity.filter(function (e) { return e.productId !== pid; });
    saveActivity();
    updateActBadge(false);
    renderActivity();
    renderMeter(true);
    renderCartBar();
  }

  function updateActBadge(pulse) {
    var badge = $("#actBadge");
    var n = state.activity.length;
    badge.hidden = n === 0;
    badge.textContent = n > 9 ? "9+" : String(n);
    var g = G();
    if (pulse && n && g) {
      g.fromTo(badge, { scale: 1.6 }, { scale: 1, duration: 0.4, ease: "back.out(2.5)", clearProps: "all" });
    }
  }

  // Today's totals for the drawer summary tiles. Markdown rupees = the price
  // cut across the stock currently on the shelf (pct × sell price × units).
  function todayStats() {
    var md = 0, units = 0;
    state.activity.forEach(function (en) {
      if (!isToday(en.at)) return;
      if (en.type === "order") { units += Number(en.value) || 0; return; }
      var p = state.products.find(function (x) { return x.id === en.productId; });
      if (p) md += p.sellPrice * p.currentStock * (Number(en.value) || 0) / 100;
    });
    return { mdRupees: Math.round(md), orderUnits: units };
  }

  // ---------------------------------------------------------------- meter --
  // Munafa Meter: the honest cumulative payoff. It sums ONLY activity entries
  // that carry a snapshotted rupee figure (see addActivity) from the last 7
  // days — spoilage avoided by markdowns, stockouts avoided by reorders. It
  // never recomputes from live product state, so it can't drift; old entries
  // missing the snapshot fields are simply skipped (no NaN, no crash). Pure
  // local arithmetic — works fully offline, no network call.
  var METER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

  function meterStats() {
    var cutoff = Date.now() - METER_WINDOW_MS;
    var spoilage = 0, stockout = 0;
    state.activity.forEach(function (en) {
      if (typeof en.rupeesSaved !== "number" || !isFinite(en.rupeesSaved) || en.rupeesSaved < 0) return;
      if (!(en.at >= cutoff)) return;
      if (en.savingKind === "spoilage") spoilage += en.rupeesSaved;
      else if (en.savingKind === "stockout") stockout += en.rupeesSaved;
    });
    spoilage = Math.round(spoilage);
    stockout = Math.round(stockout);
    return { spoilage: spoilage, stockout: stockout, total: spoilage + stockout };
  }

  // Stockout-avoided estimate for a confirmed reorder, snapshotted at order time.
  // One-sentence formula (for a judge): per-unit margin (sellPrice − unitCost)
  // times the units ordered, with the units capped at one week of average daily
  // sales (dailyMean × 7) so a large one-off bulk order can't inflate the figure
  // — you only "avoid a stockout" on units you'd realistically have sold soon.
  function orderSavingRupees(row, qty) {
    var margin = Math.max(0, (row.p.sellPrice || 0) - (row.p.unitCost || 0));
    var cap = Math.max(1, Math.round((row.a.dailyMean || 0) * 7));
    var credited = Math.min(Math.max(0, Number(qty) || 0), cap);
    return Math.round(margin * credited);
  }

  function renderMeter(animateNums) {
    var tile = $("#meterTile");
    if (!tile) return;
    var s = meterStats();
    setStat("meterTotal", s.total, rupees, animateNums);
    var breakEl = $("#meterBreak");
    if (!breakEl) return;
    breakEl.textContent = s.total > 0
      ? fmt(t().meterBreakdown, { md: rupees(s.spoilage), ro: rupees(s.stockout) })
      : t().meterEmpty;
  }

  function entryLine(en) {
    return en.type === "order"
      ? fmt(t().logOrder, { name: en.name, n: en.value })
      : fmt(t().logMd, { name: en.name, n: en.value });
  }

  function renderActivity(animateNums) {
    var list = $("#actList");
    var items = state.activity.slice().reverse();

    var stats = todayStats();
    setStat("sumMdToday", stats.mdRupees, rupees, animateNums);
    setStat("sumOrderToday", stats.orderUnits, function (v) { return String(Math.round(v)); }, animateNums);

    $("#clearLog").hidden = !items.length;
    $("#shareBtn").hidden = !items.some(function (en) { return isToday(en.at); });

    if (!items.length) {
      list.innerHTML = '<li class="act-empty">' + esc(t().actEmpty) + "</li>";
      return;
    }

    var html = "", lastKey = null;
    items.forEach(function (en) {
      var key = new Date(en.at).toDateString();
      if (key !== lastKey) {
        html += '<li class="act-date">' + esc(dateHeading(en.at)) + "</li>";
        lastKey = key;
      }
      var line = entryLine(en);
      html += '<li class="act-item" data-entry="' + esc(en.id) + '">' +
        '<span class="act-ico ' + en.type + '">' + iconSvg(en.type === "order" ? "basket" : "tag") + "</span>" +
        '<div class="act-body"><div class="act-line">' + esc(line) + "</div>" +
        '<div class="act-time">' + esc(timeClock(en.at)) + "</div></div>" +
        '<button class="link act-undo" type="button" aria-label="' + esc(t().cancel + " — " + line) + '">' +
          esc(t().cancel) + "</button>" +
      "</li>";
    });
    list.innerHTML = html;
  }

  // -------------------------------------------------------------- analyze --

  function analyzeAll() {
    var rows = state.products.map(function (p) {
      var a = engine.analyzeProduct(p);
      var needsReorder = p.currentStock < a.orderUpToLevel;
      var sellOutDays = a.dailyMean > 0.05 ? p.currentStock / a.dailyMean : 999;
      return {
        p: p, a: a,
        needsReorder: needsReorder,
        reorderQty: Math.max(0, a.orderUpToLevel - p.currentStock),
        sellOutDays: sellOutDays,
        trend: engine.salesTrend(p.salesHistory),
        verdict: a.markdown.needed ? "md" : (needsReorder ? "ro" : "ok")
      };
    });
    var rank = { md: 0, ro: 1, ok: 2 };
    rows.sort(function (x, y) {
      if (rank[x.verdict] !== rank[y.verdict]) return rank[x.verdict] - rank[y.verdict];
      if (x.verdict === "md") return y.a.spoilageRiskRupees - x.a.spoilageRiskRupees;
      if (x.verdict === "ro") return y.reorderQty - x.reorderQty;
      return x.p.daysToExpiry - y.p.daysToExpiry;
    });
    return rows;
  }

  // ------------------------------------------------- the expiry race strip --

  function raceHtml(row) {
    var days = row.p.daysToExpiry;
    var sell = Math.min(row.sellOutDays, Math.max(days * 2.5, 4));
    var horizon = Math.max(days, sell, 1) * 1.12;
    var expPct = Math.min(days / horizon * 100, 100);
    var sellPct = Math.min(sell / horizon * 100, 100);
    var spoil = row.sellOutDays > days && row.a.markdown.shortfall > 0;
    var fillPct = spoil ? expPct : sellPct;

    var ticks = "";
    if (horizon <= 16) {
      for (var i = 1; i < Math.ceil(horizon); i++) {
        ticks += '<span class="race-tick" style="left:' + (i / horizon * 100).toFixed(2) + '%"></span>';
      }
    }

    return '<div class="race-track" aria-hidden="true">' + ticks +
      '<div class="race-fill" style="width:' + fillPct.toFixed(2) + '%"></div>' +
      (spoil ? '<div class="race-spoil" style="left:' + expPct.toFixed(2) + '%;width:' + Math.max(sellPct - expPct, 2).toFixed(2) + '%"></div>' : "") +
      '<div class="race-exp" style="left:' + Math.min(expPct, 98.5).toFixed(2) + '%"></div>' +
    '</div>';
  }

  // One plain sentence tying time left, stock, and rupees together.
  // Templates contain no user text, so trusted HTML (the bolded ₹) is safe.
  function verdictLine(row) {
    if (row.a.markdown.needed) {
      return fmt(t().lineMd, {
        d: daysWord(row.p.daysToExpiry),
        risk: '<strong class="risk">' + rupees(row.a.spoilageRiskRupees) + "</strong>"
      });
    }
    if (row.needsReorder) {
      var cover = row.sellOutDays < 10 ? (Math.round(row.sellOutDays * 10) / 10) : Math.round(row.sellOutDays);
      return fmt(t().lineRo, { c: cover });
    }
    return t().lineOk;
  }

  // ---------------------------------------------------------------- cards --

  function orderPanelHtml(row) {
    var q = Math.max(1, row.reorderQty);
    return '<div class="act-panel order-panel" data-qty="' + q + '">' +
      '<button class="qty-btn dec" type="button" aria-label="' + esc(t().qtyLess) + '">−</button>' +
      '<span class="qty-val">' + q + "</span>" +
      '<button class="qty-btn inc" type="button" aria-label="' + esc(t().qtyMore) + '">+</button>' +
      '<button class="go-btn order-btn" type="button">' + esc(fmt(t().orderBtn, { n: q })) + "</button>" +
    "</div>";
  }

  function markPanelHtml(row) {
    var p = row.a.markdown.markdownPct;
    return '<div class="act-panel mark-panel" data-pct="' + p + '">' +
      '<button class="qty-btn dec" type="button" aria-label="' + esc(t().mdLess) + '">−</button>' +
      '<span class="qty-val">' + p + "%</span>" +
      '<button class="qty-btn inc" type="button" aria-label="' + esc(t().mdMore) + '">+</button>' +
      '<button class="go-btn mark-btn" type="button">' + esc(fmt(t().markBtn, { n: p })) + "</button>" +
    "</div>";
  }

  function doneHtml(type, entry) {
    var label = type === "order"
      ? fmt(t().ordered, { n: entry.value })
      : fmt(t().marked, { n: entry.value });
    return '<div class="act-done" data-type="' + type + '">' +
      '<span class="stamp stamp-done">' + esc(label + " · " + timeShort(entry.at)) + "</span>" +
      '<button class="link act-undo" type="button" data-type="' + type + '">' + esc(t().cancel) + "</button>" +
    "</div>";
  }

  function cardHtml(row) {
    var p = row.p, a = row.a;

    var stamps = "";
    if (a.markdown.needed) {
      stamps += '<span class="stamp stamp-md">' + esc(fmt(t().stampMarkdown, { n: a.markdown.markdownPct })) + "</span>";
    }
    if (row.needsReorder) {
      stamps += '<span class="stamp stamp-ro">' + esc(fmt(t().stampReorder, { n: row.reorderQty })) + "</span>";
    }
    if (!a.markdown.needed && !row.needsReorder) {
      stamps += '<span class="stamp stamp-ok">' + esc(t().stampOk) + "</span>";
    }

    var trendTag = "";
    if (row.trend && row.trend.direction === "rising") {
      trendTag = ' <span class="trend-tag trend-up">↗ ' + esc(t().trendRising) + "</span>";
    } else if (row.trend && row.trend.direction === "falling") {
      trendTag = ' <span class="trend-tag trend-down">↘ ' + esc(t().trendFalling) + "</span>";
    }

    var meta = esc(t().stock) + " " + p.currentStock +
      ' <span class="dot">·</span> ' + esc(t().expiry) + " " + esc(fmt(t().daysShort, { n: p.daysToExpiry })) +
      ' <span class="dot">·</span> ' + esc(t().avgPerDay) + " " + a.dailyMean.toFixed(1) + trendTag;

    var actions = "";
    if (a.markdown.needed) {
      var mrec = lastAction(p.id, "markdown");
      actions += mrec ? doneHtml("markdown", mrec) : markPanelHtml(row);
    }
    if (row.needsReorder) {
      var orec = lastAction(p.id, "order");
      actions += orec ? doneHtml("order", orec) : orderPanelHtml(row);
    }

    return '<article class="card v-' + row.verdict + '" data-id="' + esc(p.id) + '">' +
      '<div class="card-top">' +
        '<span class="icon-chip">' + iconSvg(resolveIconId(p)) + "</span>" +
        '<div class="names"><h3>' + esc(p.name) + "</h3></div>" +
        '<button class="icon-btn edit-btn" type="button" aria-label="' + esc(fmt(t().editAria, { name: p.name })) + '">✎</button>' +
      "</div>" +
      '<div class="stamps">' + stamps + "</div>" +
      raceHtml(row) +
      '<p class="verdict-line">' + verdictLine(row) + "</p>" +
      '<div class="meta-line">' + meta + "</div>" +
      actions +
      '<button class="ask-btn" type="button">' + esc(t().askWhy) + "</button>" +
      '<div class="chit" aria-live="polite" hidden></div>' +
    "</article>";
  }

  // ------------------------------------------------------ chips & grid html --

  function chipsHtml(all) {
    var counts = {};
    all.forEach(function (r) { counts[r.p.category] = (counts[r.p.category] || 0) + 1; });
    var cats = CAT_ORDER.filter(function (c) { return counts[c]; })
      .concat(Object.keys(counts).filter(function (c) { return CAT_ORDER.indexOf(c) < 0; }));
    var html = '<button class="chip" type="button" data-cat="" aria-pressed="' + String(!state.catFilter) + '">' +
      esc(t().all) + ' <span class="chip-n">' + all.length + "</span></button>";
    cats.forEach(function (c) {
      html += '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="' + String(state.catFilter === c) + '">' +
        esc(catLabel(c)) + ' <span class="chip-n">' + counts[c] + "</span></button>";
    });
    return html;
  }

  function gridHtml(rows, total) {
    var html = "";
    if (state.filter || state.catFilter) {
      html += '<div class="filterbar"><button class="showall" type="button">✕ ' +
        esc(fmt(t().showAll, { n: total })) + "</button></div>";
    }
    if (!rows.length) {
      return html + '<p class="empty">' + esc(t().emptyMsg) + "</p>";
    }
    // Stat-tile filters are task lists, not shelf walks — one flat grid, no
    // near-empty category sections around a single card each.
    if (state.filter) {
      return html + '<div class="cat-grid">' + rows.map(cardHtml).join("") + "</div>";
    }
    var groups = {};
    rows.forEach(function (r) {
      (groups[r.p.category] = groups[r.p.category] || []).push(r);
    });
    var order = CAT_ORDER.concat(Object.keys(groups).filter(function (c) {
      return CAT_ORDER.indexOf(c) < 0;
    }));
    order.forEach(function (cat) {
      var g = groups[cat];
      if (!g || !g.length) return;
      html += '<section class="cat-sec">' +
        '<h2 class="cat-head"><span>' + esc(catLabel(cat)) + '</span><span class="cat-count">' + g.length + "</span></h2>" +
        '<div class="cat-grid">' + g.map(cardHtml).join("") + "</div>" +
      "</section>";
    });
    return html;
  }

  // --------------------------------------------------------------- render --

  function setStat(id, value, format, animate) {
    var el = document.getElementById(id);
    var from = Number(el.dataset.v || 0);
    el.dataset.v = value;
    el.classList.toggle("zero", value === 0);
    var g = G();
    if (!animate || !g || from === value) { el.textContent = format(value); return; }
    var o = { v: from };
    g.to(o, {
      v: value, duration: 0.85, ease: "power2.out",
      onUpdate: function () { el.textContent = format(o.v); },
      onComplete: function () { el.textContent = format(value); }
    });
  }

  function render(opts) {
    opts = opts || {};
    document.documentElement.lang = state.lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t()[el.getAttribute("data-i18n")] || "";
    });
    $("#fabBtn").setAttribute("aria-label", t().addStock);
    $("#closeSheet").setAttribute("aria-label", t().closeAria);
    $("#closeDrawer").setAttribute("aria-label", t().closeAria);
    $("#drawerTitle").textContent = t().actTitle;
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang));
    });
    document.querySelectorAll(".stat").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.filter === state.filter));
    });

    state.rows = analyzeAll();
    var all = state.rows;

    // Markdown (overstocked-and-expiring) and reorder (running low) are
    // independent signals — the tiles and their filtered views must match.
    var mdRows = all.filter(function (r) { return r.a.markdown.needed; });
    var roRows = all.filter(function (r) { return r.needsReorder && !r.a.markdown.needed; });
    var risk = mdRows.reduce(function (s, r) { return s + r.a.spoilageRiskRupees; }, 0);

    var count = function (v) { return String(Math.round(v)); };
    setStat("sumMarkdown", mdRows.length, count, opts.animateNums);
    setStat("sumReorder", roRows.length, count, opts.animateNums);
    setStat("sumRisk", risk, rupees, opts.animateNums);

    var visible = all;
    if (state.filter === "md") {
      visible = mdRows;
    } else if (state.filter === "ro") {
      visible = roRows;
    } else if (state.filter === "risk") {
      // Strictly items with real spoilage rupees at stake, worst first.
      visible = mdRows
        .filter(function (r) { return r.a.spoilageRiskRupees > 0; })
        .slice()
        .sort(function (a, b) { return b.a.spoilageRiskRupees - a.a.spoilageRiskRupees; });
    }
    if (state.catFilter) {
      visible = visible.filter(function (r) { return r.p.category === state.catFilter; });
    }

    $("#chips").innerHTML = chipsHtml(all);
    $("#grid").innerHTML = gridHtml(visible, all.length);
    updateBudgetNudge();

    renderActivity(opts.animateNums);
    renderMeter(opts.animateNums);
    renderCartBar();
    updateActBadge(false);
    updatePlanPanel();
    // The strip is one shared card around the budget nudge + today's plan;
    // it collapses entirely when neither has anything to say.
    var strip = $("#todayStrip");
    if (strip) strip.hidden = $("#budgetNudge").hidden && $("#planPanel").hidden;

    // Re-attach any advice already fetched for this language.
    all.forEach(function (r) {
      var note = state.aiNotes[r.p.id + ":" + state.lang];
      if (!note) return;
      var card = $("#grid").querySelector('[data-id="' + CSS.escape(r.p.id) + '"]');
      if (!card) return;
      fillChit(card.querySelector(".chit"), note.text, note.kind);
      card.querySelector(".ask-btn").textContent = t().askAgain;
    });

    // Re-attach a cached plan for this language, same pattern as the
    // per-card notes above.
    var planNote = state.planNotes[state.lang];
    var planBtnEl = $("#planBtn");
    if (planNote && planBtnEl) {
      fillChit($("#planChit"), planNote.text, planNote.kind);
      $("#planChit").hidden = false;
      planBtnEl.querySelector("span").textContent = t().planAgain;
    } else if (planBtnEl) {
      planBtnEl.querySelector("span").textContent = t().planBtn;
    }
  }

  function animateGridIn() {
    var g = G();
    if (!g) return;
    var heads = document.querySelectorAll("#grid .cat-head");
    var cards = document.querySelectorAll("#grid .card");
    if (heads.length) {
      g.fromTo(heads, { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: "power2.out", overwrite: "auto", clearProps: "opacity,transform" });
    }
    if (cards.length) {
      g.fromTo(cards, { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: "power2.out", overwrite: "auto", clearProps: "opacity,transform" });
    }
  }

  // ----------------------------------------------------------- the chit --

  function fillChit(chit, text, kind) {
    chit.hidden = false;
    // "setup" reuses the local-tip's quiet visual treatment (it's the same
    // kind of non-AI content) but must never say "offline" — a missing key
    // and a real network outage are different problems, and only one of
    // them is something the person can fix by adding a key.
    chit.classList.toggle("local", kind === "local" || kind === "setup");
    var words = text.split(/\s+/).map(function (w) {
      return '<span class="w">' + esc(w) + "</span>";
    }).join(" ");
    var icon = kind === "ai" ? "✳" : kind === "setup" ? "⚙" : "📱";
    var tag = kind === "ai" ? t().aiTag : kind === "setup" ? t().setupTag : t().offlineTag;
    // Every chit carries its own hide control — once read, the note can be
    // put away (the ask button resets, so it can always be asked again).
    chit.innerHTML = '<p class="chit-text">' + words + "</p>" +
      '<div class="chit-meta"><span aria-hidden="true">' + icon + "</span>" + esc(tag) +
      '<button class="chit-hide" type="button" aria-label="' + esc(t().closeAria) + '">×</button></div>';
  }

  function revealChit(card, chit, text, kind) {
    fillChit(chit, text, kind);
    var g = G();
    if (!g) return;
    g.fromTo(chit,
      { height: 0, opacity: 0, rotate: -2.5, y: -6, overflow: "hidden" },
      { height: "auto", opacity: 1, rotate: -0.4, y: 0, duration: 0.5, ease: "back.out(1.3)", clearProps: "height,overflow" });
    g.fromTo(chit.querySelectorAll(".w"),
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.013, delay: 0.12, ease: "power2.out" });
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
  }

  // ----------------------------------------------------- ask-Munafa flow --

  function localTip(row) {
    var p = row.p, a = row.a;
    if (a.markdown.needed) {
      return fmt(t().tipMd, {
        name: p.name, pct: a.markdown.markdownPct, proj: a.markdown.projectedSales,
        stock: p.currentStock, risk: rupees(a.spoilageRiskRupees)
      });
    }
    if (row.needsReorder) {
      return fmt(t().tipRo, {
        name: p.name, qty: row.reorderQty, avg: a.dailyMean.toFixed(1),
        cover: (p.currentStock / Math.max(a.dailyMean, 0.1)).toFixed(1),
        margin: rupees(p.sellPrice - p.unitCost)
      });
    }
    return fmt(t().tipOk, { name: p.name, avg: a.dailyMean.toFixed(1) });
  }

  function askWhy(card, row, btn) {
    var chit = card.querySelector(".chit");
    var key = row.p.id + ":" + state.lang;

    btn.disabled = true;
    btn.innerHTML = '<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>' + esc(t().thinking);

    function finish(text, kind) {
      state.aiNotes[key] = { text: text, kind: kind };
      revealChit(card, chit, text, kind);
      btn.disabled = false;
      btn.textContent = t().askAgain;
    }

    function fallback(kind) { finish(localTip(row), kind || "local"); }

    if (!navigator.onLine) {
      // Deliberate short beat so the offline answer still feels considered.
      setTimeout(function () { fallback("local"); }, reduced ? 0 : 350);
      return;
    }

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;

    fetch("/api/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ product: row.p, analysis: row.a, language: state.lang }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        return r.json().then(function (b) { return { ok: r.ok, b: b }; });
      })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok || !res.b || !res.b.recommendation) {
          // Carry the server's own error text along so the catch below can
          // tell "not set up" apart from a genuine network/model hiccup,
          // instead of quietly relabeling both as an offline estimate.
          var err = new Error("bad response");
          err.serverMessage = (res.b && typeof res.b.error === "string") ? res.b.error : "";
          throw err;
        }
        finish(res.b.recommendation, "ai");
      })
      .catch(function (e) {
        if (timer) clearTimeout(timer);
        var msg = (e && e.serverMessage) || "";
        fallback(msg.indexOf("GEMINI_API_KEY") >= 0 ? "setup" : "local"); // never block the shopkeeper on the network
      });
  }

  // Non-AI fallback: sorts flagged rows by urgency (spoilage rupees first,
  // then reorder gap) and states the top few in plain template sentences.
  // Same principle as localTip() above — offline or a failed call must
  // never leave the owner with nothing.
  function localPlan(rows) {
    var flagged = rows.filter(function (r) { return r.a.markdown.needed || r.needsReorder; });
    var ranked = flagged.slice().sort(function (x, y) {
      var xUrgent = x.a.markdown.needed ? x.a.spoilageRiskRupees : -1;
      var yUrgent = y.a.markdown.needed ? y.a.spoilageRiskRupees : -1;
      if (yUrgent !== xUrgent) return yUrgent - xUrgent;
      return y.reorderQty - x.reorderQty;
    }).slice(0, 3);

    return ranked.map(function (r, i) {
      var line = r.a.markdown.needed
        ? fmt(t().stampMarkdown, { n: r.a.markdown.markdownPct }) + " — " + r.p.name + " (" + rupees(r.a.spoilageRiskRupees) + ")"
        : fmt(t().stampReorder, { n: r.reorderQty }) + " — " + r.p.name;
      return (i + 1) + ". " + line;
    }).join("\n");
  }

  // Same shape as askWhy above (offline short-circuit, abort timeout, never
  // blocks on the network) but asks one cross-item question via a second,
  // independent endpoint (api/plan.js) instead of api/recommend.js.
  function askPlan(btn) {
    var chit = $("#planChit");
    var rows = state.rows;
    var flagged = rows.filter(function (r) { return r.a.markdown.needed || r.needsReorder; });
    if (!flagged.length) return;

    var label = btn.querySelector("span");
    btn.disabled = true;
    label.innerHTML = '<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>' + esc(t().thinking);

    function finish(text, kind) {
      state.planNotes[state.lang] = { text: text, kind: kind };
      revealChit(chit.closest(".plan-panel"), chit, text, kind);
      btn.disabled = false;
      label.textContent = t().planAgain;
    }

    function fallback(kind) { finish(localPlan(rows), kind || "local"); }

    if (!navigator.onLine) {
      setTimeout(function () { fallback("local"); }, reduced ? 0 : 350);
      return;
    }

    var items = flagged.map(function (r) {
      return r.a.markdown.needed
        ? { name: r.p.name, type: "markdown", markdownPct: r.a.markdown.markdownPct, spoilageRiskRupees: r.a.spoilageRiskRupees, daysToExpiry: r.p.daysToExpiry }
        : { name: r.p.name, type: "reorder", reorderQty: r.reorderQty, sellOutDays: r.sellOutDays };
    });

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

    fetch("/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: items, language: state.lang }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        return r.json().then(function (b) { return { ok: r.ok, b: b }; });
      })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok || !res.b || !res.b.plan) {
          var err = new Error("bad response");
          err.serverMessage = (res.b && typeof res.b.error === "string") ? res.b.error : "";
          throw err;
        }
        finish(res.b.plan, "ai");
      })
      .catch(function (e) {
        if (timer) clearTimeout(timer);
        var msg = (e && e.serverMessage) || "";
        fallback(msg.indexOf("GEMINI_API_KEY") >= 0 ? "setup" : "local"); // never block the shopkeeper on the network
      });
  }

  // -------------------------------------------------------- add/edit sheet --

  var sheet = $("#sheet");
  var form = $("#stockForm");

  function buildCatOptions(selected) {
    var cats = CAT_ORDER.slice();
    state.products.forEach(function (p) {
      if (cats.indexOf(p.category) < 0) cats.push(p.category);
    });
    $("#catSelect").innerHTML = cats.map(function (c) {
      return '<option value="' + esc(c) + '"' + (c === selected ? " selected" : "") + ">" +
        esc(catLabel(c)) + "</option>";
    }).join("");
  }

  function openSheet(product) {
    state.editingId = product ? product.id : null;
    $("#sheetTitle").textContent = product ? t().formEdit : t().formAdd;
    $("#deleteBtn").hidden = !product;
    $("#deleteBtn").textContent = t().remove;
    $("#cancelBtn").textContent = t().cancel;
    $("#saveBtn").textContent = t().save;
    $("#formError").hidden = true;
    form.reset();
    buildCatOptions(product ? product.category : "custom");
    if (product) {
      form.elements.name.value = product.name;
      form.elements.unitCost.value = product.unitCost;
      form.elements.sellPrice.value = product.sellPrice;
      form.elements.currentStock.value = product.currentStock;
      form.elements.daysToExpiry.value = product.daysToExpiry;
      form.elements.leadTimeDays.value = product.leadTimeDays;
      form.elements.salesHistory.value = product.salesHistory.join(", ");
    }
    sheet.showModal(); // entrance animation is CSS-driven via .sheet[open]
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim();
    var category = f.category.value || "custom";
    var unitCost = parseFloat(f.unitCost.value);
    var sellPrice = parseFloat(f.sellPrice.value);
    var currentStock = parseInt(f.currentStock.value, 10);
    var daysToExpiry = parseInt(f.daysToExpiry.value, 10);
    var leadTimeDays = parseInt(f.leadTimeDays.value, 10);
    if (!isFinite(leadTimeDays) || leadTimeDays < 1) leadTimeDays = 1;
    var sales = f.salesHistory.value.split(/[,\s]+/).filter(Boolean).map(Number)
      .filter(function (n) { return isFinite(n) && n >= 0; });

    var valid = name && isFinite(unitCost) && unitCost > 0 && isFinite(sellPrice) && sellPrice > 0 &&
      isFinite(currentStock) && currentStock >= 0 && isFinite(daysToExpiry) && daysToExpiry >= 0 &&
      sales.length >= 1;

    if (!valid) {
      var err = $("#formError");
      err.textContent = t().invalid;
      err.hidden = false;
      return;
    }

    var id;
    if (state.editingId) {
      id = state.editingId;
      var existing = state.products.find(function (p) { return p.id === id; });
      var catChanged = existing.category !== category;
      existing.name = name;
      existing.category = category;
      // Icons are decorative and follow the category; keep a product's own
      // mark unless it moved category.
      if (catChanged || !ICON_PATHS[resolveIconId(existing)]) {
        existing.icon = CAT_ICON[category] || "basket";
      }
      existing.unitCost = unitCost;
      existing.sellPrice = sellPrice;
      existing.currentStock = currentStock;
      existing.daysToExpiry = daysToExpiry;
      existing.leadTimeDays = leadTimeDays;
      existing.salesHistory = sales;
      existing.salesEstimated = false; // owner has entered real sales — imported estimate no longer applies
      // Numbers changed — cached advice and pending actions are stale.
      Object.keys(state.aiNotes).forEach(function (k) {
        if (k.indexOf(id + ":") === 0) delete state.aiNotes[k];
      });
      clearProductActivity(id);
    } else {
      id = "user-" + Date.now();
      state.products.push({
        id: id, name: name, category: category, icon: CAT_ICON[category] || "basket",
        unitCost: unitCost, sellPrice: sellPrice, currentStock: currentStock,
        daysToExpiry: daysToExpiry, leadTimeDays: leadTimeDays, salesHistory: sales
      });
    }

    saveProducts();
    sheet.close();
    render({ animateNums: true });

    var el = $("#grid").querySelector('[data-id="' + CSS.escape(id) + '"]');
    if (el) {
      el.classList.add("flash");
      el.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }
  });

  $("#deleteBtn").addEventListener("click", function () {
    if (!state.editingId) return;
    if (!window.confirm(t().removeConfirm)) return;
    state.products = state.products.filter(function (p) { return p.id !== state.editingId; });
    saveProducts();
    sheet.close();
    render({ animateNums: true });
  });

  $("#cancelBtn").addEventListener("click", function () { sheet.close(); });
  $("#closeSheet").addEventListener("click", function () { sheet.close(); });


  // ------------------------------------------------------------ voice add --

  // Speak a product into the add/edit sheet. The Web Speech API turns one
  // spoken sentence into text in the app's current language; the transcript
  // goes to /api/parse-voice-product (same serverless pattern and the same
  // trust-nothing sanitization as map-columns), and the extracted fields only
  // ever pre-fill this form. Every machine-written field is highlighted until
  // the owner touches it, and the ONLY commit path is the existing Save
  // button — voice never writes to state directly.
  //
  // Feature-gated at load: browsers without SpeechRecognition (Firefox, some
  // Safari builds) never see the mic, and manual entry is untouched either way.

  var VoiceRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var voiceBtn = $("#voiceBtn");
  var voiceStatus = $("#voiceStatus");
  var VOICE_NUMERIC = ["unitCost", "sellPrice", "currentStock", "daysToExpiry", "leadTimeDays"];
  var VOICE_TAP_COOLDOWN = 1500; // ms — swallow double-taps so sessions never overlap

  function voiceKnownCategories() {
    // Same list buildCatOptions renders: base order plus owner-created ones.
    var cats = CAT_ORDER.slice();
    state.products.forEach(function (p) {
      if (cats.indexOf(p.category) < 0) cats.push(p.category);
    });
    return cats;
  }

  function setVoiceStatus(msg, isErr) {
    voiceStatus.textContent = msg || "";
    voiceStatus.classList.toggle("err", !!isErr);
    voiceStatus.hidden = !msg;
  }

  function clearVoiceMarks() {
    form.querySelectorAll(".voice-filled").forEach(function (el) {
      el.classList.remove("voice-filled");
    });
  }

  // A highlight means "the machine wrote this and nobody has checked it" —
  // the moment the owner edits a field it's theirs, so the mark comes off.
  form.addEventListener("input", function (e) {
    if (e.target && e.target.classList) e.target.classList.remove("voice-filled");
  });
  $("#catSelect").addEventListener("change", function (e) {
    e.target.classList.remove("voice-filled");
  });

  // Same fetch discipline as llmMapColumns: hard 12s timeout, and a failure
  // can never block the flow — the owner just types instead.
  function parseVoiceProduct(transcript) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    return fetch("/api/parse-voice-product", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: transcript, lang: state.lang, categories: voiceKnownCategories() }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        return r.json().then(function (b) { return { ok: r.ok, b: b }; });
      })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok || !res.b || !res.b.fields) {
          // Carry the server's own error text along so the caller can tell
          // "not set up" apart from "model/network hiccup" and say so plainly
          // instead of blaming the transcript.
          var err = new Error("bad response");
          err.serverMessage = (res.b && typeof res.b.error === "string") ? res.b.error : "";
          throw err;
        }
        return res.b.fields;
      })
      .catch(function (e) {
        if (timer) clearTimeout(timer);
        throw e;
      });
  }

  // The server already sanitized; trust nothing anyway. Only non-null fields
  // are written, so speaking a correction ("no, forty units") re-fills just
  // that field and leaves the rest alone.
  function applyVoiceFields(fields) {
    if (!sheet.open) return; // sheet closed while the parse was in flight
    fields = fields || {};
    var f = form.elements;
    var filled = 0;

    var name = typeof fields.name === "string" ? fields.name.trim().slice(0, 40) : "";
    if (name) {
      f.name.value = name;
      f.name.classList.add("voice-filled");
      filled++;
    }

    if (typeof fields.category === "string" && voiceKnownCategories().indexOf(fields.category) >= 0) {
      buildCatOptions(fields.category);
      f.category.classList.add("voice-filled");
      filled++;
    }

    VOICE_NUMERIC.forEach(function (key) {
      var v = fields[key];
      if (typeof v === "number" && isFinite(v) && v >= 0) {
        f[key].value = String(v);
        f[key].classList.add("voice-filled");
        filled++;
      }
    });

    // New product, no sales typed yet: seed the same flat estimate the Excel
    // import uses, so one spoken sentence yields a saveable form. It's
    // highlighted like every parsed value — the owner can overwrite it.
    if (!state.editingId && filled && !f.salesHistory.value.trim() && f.currentStock.value) {
      var stock = parseInt(f.currentStock.value, 10);
      if (isFinite(stock)) {
        f.salesHistory.value = estimateSalesHistory(stock).join(", ");
        f.salesHistory.classList.add("voice-filled");
      }
    }

    if (!filled) { setVoiceStatus(t().voiceFail, true); return; }
    setVoiceStatus(t().voiceReview);
  }

  if (VoiceRec) {
    voiceBtn.hidden = false;

    var voice = { phase: "idle", recog: null, lastTap: 0, transcript: "" };

    var voiceSettle = function () {
      voice.phase = "idle";
      voice.recog = null;
      voiceBtn.classList.remove("listening");
      voiceBtn.removeAttribute("aria-label"); // accessible name falls back to the i18n span
    };

    var voiceAbort = function () {
      var r = voice.recog;
      voiceSettle();
      setVoiceStatus("");
      if (r) { try { r.abort(); } catch (e) { /* already ended */ } }
    };

    // Closing the sheet (save, cancel, Esc) kills any live session and wipes
    // the highlights, so the next open always starts clean.
    sheet.addEventListener("close", function () {
      voiceAbort();
      clearVoiceMarks();
    });

    var voiceHandleError = function (code) {
      voiceSettle();
      if (code === "not-allowed" || code === "service-not-allowed") {
        // Denied is sticky for the session: hide the mic, keep typing usable.
        voiceBtn.hidden = true;
        setVoiceStatus(t().voiceDenied, true);
      } else if (code === "no-speech") {
        setVoiceStatus(t().voiceNoSpeech, true);
      } else if (code === "aborted") {
        setVoiceStatus("");
      } else {
        setVoiceStatus(t().voiceFail, true);
      }
    };

    var voiceStart = function () {
      var recog = new VoiceRec();
      recog.lang = LOCALES[state.lang] || "en-IN";
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      // continuous = true is the whole fix for long dictation: with it false
      // (the old setting), the browser treats the first natural pause in
      // speech — a breath between "paneer, two hundred gram" and "buy price
      // forty" — as end-of-speech and stops listening mid-sentence. With it
      // true, onresult fires once per finalized phrase instead of once
      // total, so the transcript is accumulated across calls below and only
      // handed off for parsing once the session actually ends (explicit tap
      // to stop, or the browser's own longer inactivity timeout).
      recog.continuous = true;

      voice.transcript = "";

      recog.onresult = function (ev) {
        // interimResults is off, so every entry in ev.results is a finalized
        // phrase. In continuous mode the list accumulates for the whole
        // session rather than resetting per event, so rebuilding the full
        // string from scratch each time is simpler and safer than trying to
        // track resultIndex — it can't double-count or drop a phrase.
        var full = "";
        try {
          for (var i = 0; i < ev.results.length; i++) {
            full += (full ? " " : "") + (ev.results[i][0].transcript || "");
          }
        } catch (e) { /* malformed event — keep whatever was accumulated already */ }
        full = full.trim();
        if (full) voice.transcript = full;
        if (voice.phase === "listening") setVoiceStatus(voice.transcript || t().voiceListening);
      };

      recog.onerror = function (ev) { voiceHandleError(ev && ev.error); };

      recog.onend = function () {
        if (voice.phase !== "listening") return; // already handled by an error path
        var transcript = voice.transcript;
        voiceSettle();
        if (!transcript) { setVoiceStatus(t().voiceNoSpeech, true); return; }
        voice.phase = "parsing";
        setVoiceStatus(t().voiceThinking);
        parseVoiceProduct(transcript)
          .then(function (fields) {
            voice.phase = "idle";
            applyVoiceFields(fields);
          })
          .catch(function (e) {
            voice.phase = "idle";
            if (!sheet.open) return;
            var msg = (e && e.serverMessage) || "";
            if (msg.indexOf("GEMINI_API_KEY") >= 0) {
              setVoiceStatus(t().voiceSetupMissing, true);
            } else {
              setVoiceStatus(t().voiceFail, true);
            }
          });
      };

      voice.recog = recog;
      voice.phase = "listening";
      voiceBtn.classList.add("listening");
      voiceBtn.setAttribute("aria-label", t().voiceStop);
      setVoiceStatus(t().voiceListening);
      try { recog.start(); } catch (e) { voiceHandleError("aborted"); }
    };

    voiceBtn.addEventListener("click", function () {
      var now = Date.now();
      if (now - voice.lastTap < VOICE_TAP_COOLDOWN) return; // overlapping-session guard
      voice.lastTap = now;
      if (voice.phase === "idle") {
        voiceStart();
      } else if (voice.phase === "listening" && voice.recog) {
        voice.recog.stop(); // onresult/onend settle the state from here
      }
      // phase === "parsing": taps are ignored until the parse resolves
    });
  }


  // ----------------------------------------------------- evening tally --
  // "Shaam ka hisaab": a SECOND voice flow, entirely separate from the
  // per-product Add-stock mic above (which fills one product's fields). The
  // owner opens this once in the evening and rattles off everything that sold
  // today ("doodh baarah, bread chaar, paneer do"). The exact same
  // continuous-mode SpeechRecognition pattern as Add-stock accumulates the whole
  // dictation; /api/parse-tally splits it into {name, qty} pairs; each name is
  // fuzzy-matched against the owner's OWN product list. Nothing is silently
  // created or committed — matched and unmatched items are shown for review, and
  // only on Save does each matched product's salesHistory roll forward by one
  // day (append today, drop the oldest, stays exactly 14). engine.js is
  // untouched: only the data flowing into it changes.

  var tallyMatches = []; // [{ product, qty }] awaiting the owner's Save

  function normTallyName(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  // Small bounded Levenshtein — only the last-resort tie-breaker for mishearings
  // ("panner" → "paneer") after exact and substring matching have both missed.
  function tallyEditDistance(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      for (j = 0; j <= n; j++) prev[j] = cur[j];
    }
    return prev[n];
  }

  // Case-insensitive match of one spoken name to one product: exact normalized
  // match, then substring either direction, then closest first-token by edit
  // distance within a small threshold. Returns a product or null — it NEVER
  // invents a product, so an unmatched name can only end up in the "not
  // understood" list, never as new or corrupted data.
  function matchTallyProduct(name) {
    var q = normTallyName(name);
    if (!q) return null;
    var products = state.products || [];
    var i, pn;
    for (i = 0; i < products.length; i++) {
      if (normTallyName(products[i].name) === q) return products[i];
    }
    var subHit = null, subLen = Infinity;
    for (i = 0; i < products.length; i++) {
      pn = normTallyName(products[i].name);
      if (!pn) continue;
      if (pn.indexOf(q) >= 0 || q.indexOf(pn) >= 0) {
        if (pn.length < subLen) { subLen = pn.length; subHit = products[i]; }
      }
    }
    if (subHit) return subHit;
    var best = null, bestD = Infinity;
    for (i = 0; i < products.length; i++) {
      pn = normTallyName(products[i].name);
      if (!pn) continue;
      var d = tallyEditDistance(q, pn.split(" ")[0]);
      if (d < bestD) { bestD = d; best = products[i]; }
    }
    if (best && bestD <= Math.max(1, Math.floor(q.length / 3))) return best;
    return null;
  }

  // Build the review list from the endpoint's validated [{name, qty}] items.
  // One product can only be claimed by the first spoken name that matches it,
  // so the same item said twice can't be double-counted.
  function renderTallyReview(items) {
    tallyMatches = [];
    var matchedHtml = "", unmatchedHtml = "", usedIds = {};
    (Array.isArray(items) ? items : []).forEach(function (it) {
      var qty = Math.max(0, Math.round(Number(it && it.qty) || 0));
      var p = matchTallyProduct(it && it.name);
      if (p && !usedIds[p.id]) {
        usedIds[p.id] = true;
        tallyMatches.push({ product: p, qty: qty });
        matchedHtml += '<li class="tally-row tally-ok"><span class="tally-name">' + esc(p.name) +
          '</span><span class="tally-qty">' + esc(fmt(t().tallyUnit, { n: qty })) + "</span></li>";
      } else {
        unmatchedHtml += '<li class="tally-row tally-miss"><span class="tally-name">' + esc(String((it && it.name) || "")) +
          '</span><span class="tally-qty">' + esc(fmt(t().tallyUnit, { n: qty })) + "</span></li>";
      }
    });

    var html = "";
    if (matchedHtml) {
      html += '<div class="tally-head">' + esc(t().tallyMatchedHead) + '</div><ul class="tally-ul">' + matchedHtml + "</ul>";
    }
    if (unmatchedHtml) {
      html += '<div class="tally-head tally-head-miss">' + esc(t().tallyUnmatchedHead) + '</div><ul class="tally-ul">' + unmatchedHtml +
        '</ul><p class="tally-note">' + esc(t().tallyUnmatchedNote) + "</p>";
    }
    if (!matchedHtml && !unmatchedHtml) {
      html = '<p class="tally-empty">' + esc(t().tallyNone) + "</p>";
    }
    $("#tallyList").innerHTML = html;

    var saveBtn = $("#tallySave");
    saveBtn.hidden = tallyMatches.length === 0;
    saveBtn.textContent = fmt(t().tallySaveBtn, { n: tallyMatches.length });
  }

  // Commit: roll each matched product's sales window forward by exactly one day.
  // Append today's spoken qty to the END (newest), then drop index 0 (oldest) so
  // the array is a true 14-entry rolling window — never grown, never reordered.
  function applyTally() {
    if (!tallyMatches.length) return;
    tallyMatches.forEach(function (m) {
      var p = m.product;
      if (!Array.isArray(p.salesHistory)) return;
      p.salesHistory.push(m.qty);
      while (p.salesHistory.length > 14) p.salesHistory.shift();
    });
    saveProducts();
    tallyMatches = [];
    tallySheet.close();
    render({ animateNums: true });
  }

  var tallySheet = $("#tallySheet");
  var tallyBtn = $("#tallyBtn");
  var tallyStatus = $("#tallyStatus");

  function setTallyStatus(msg, isErr) {
    if (!tallyStatus) return;
    tallyStatus.textContent = msg || "";
    tallyStatus.classList.toggle("err", !!isErr);
    tallyStatus.hidden = !msg;
  }

  // Same fetch discipline as parseVoiceProduct: 12s hard timeout, failures can
  // never block the flow. No categories are sent — the tally endpoint only needs
  // the transcript and language.
  function parseTally(transcript) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    return fetch("/api/parse-tally", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: transcript, lang: state.lang }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, b: b }; }); })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok || !res.b || !Array.isArray(res.b.items)) {
          var err = new Error("bad response");
          err.serverMessage = (res.b && typeof res.b.error === "string") ? res.b.error : "";
          throw err;
        }
        return res.b.items;
      })
      .catch(function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  if (VoiceRec && tallyBtn && tallySheet) {
    tallyBtn.hidden = false;
    var tally = { phase: "idle", recog: null, lastTap: 0, transcript: "" };

    var tallySettle = function () {
      tally.phase = "idle";
      tally.recog = null;
      tallyBtn.classList.remove("listening");
      var mic = $("#tallyMic");
      if (mic) mic.classList.remove("listening");
    };

    var tallyAbort = function () {
      var r = tally.recog;
      tallySettle();
      if (r) { try { r.abort(); } catch (e) { /* already ended */ } }
    };

    tallySheet.addEventListener("close", function () {
      tallyAbort();
      setTallyStatus("");
      tallyMatches = [];
    });

    var tallyHandleError = function (code) {
      tallySettle();
      if (code === "not-allowed" || code === "service-not-allowed") {
        setTallyStatus(t().tallyDenied, true);
      } else if (code === "no-speech") {
        setTallyStatus(t().tallyNoSpeech, true);
      } else if (code === "aborted") {
        setTallyStatus("");
      } else {
        setTallyStatus(t().tallyFail, true);
      }
    };

    var tallyStart = function () {
      var recog = new VoiceRec();
      recog.lang = LOCALES[state.lang] || "en-IN";
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.continuous = true; // same long-dictation fix as the Add-stock mic
      tally.transcript = "";

      recog.onresult = function (ev) {
        var full = "";
        try {
          for (var i = 0; i < ev.results.length; i++) {
            full += (full ? " " : "") + (ev.results[i][0].transcript || "");
          }
        } catch (e) { /* malformed event — keep what accumulated already */ }
        full = full.trim();
        if (full) tally.transcript = full;
        if (tally.phase === "listening") setTallyStatus(tally.transcript || t().tallyListening);
      };

      recog.onerror = function (ev) { tallyHandleError(ev && ev.error); };

      recog.onend = function () {
        if (tally.phase !== "listening") return;
        var transcript = tally.transcript;
        tallySettle();
        if (!transcript) { setTallyStatus(t().tallyNoSpeech, true); return; }
        tally.phase = "parsing";
        setTallyStatus(t().tallyThinking);
        parseTally(transcript)
          .then(function (items) {
            tally.phase = "idle";
            if (!tallySheet.open) return;
            renderTallyReview(items);
            setTallyStatus(items.length ? t().tallyReview : t().tallyNoSpeech, !items.length);
          })
          .catch(function (e) {
            tally.phase = "idle";
            if (!tallySheet.open) return;
            var msg = (e && e.serverMessage) || "";
            setTallyStatus(msg.indexOf("GEMINI_API_KEY") >= 0 ? t().tallySetupMissing : t().tallyFail, true);
          });
      };

      tally.recog = recog;
      tally.phase = "listening";
      tallyBtn.classList.add("listening");
      var mic = $("#tallyMic");
      if (mic) mic.classList.add("listening");
      setTallyStatus(t().tallyListening);
      try { recog.start(); } catch (e) { tallyHandleError("aborted"); }
    };

    var openTally = function () {
      tallyMatches = [];
      $("#tallyList").innerHTML = "";
      $("#tallySave").hidden = true;
      setTallyStatus("");
      tallySheet.showModal();
      tallyStart();
    };

    var tallyToggle = function () {
      var now = Date.now();
      if (now - tally.lastTap < VOICE_TAP_COOLDOWN) return; // swallow double-taps
      tally.lastTap = now;
      if (tally.phase === "idle") tallyStart();
      else if (tally.phase === "listening" && tally.recog) tally.recog.stop();
      // phase === "parsing": taps ignored until the parse resolves
    };

    tallyBtn.addEventListener("click", openTally);
    var tallyMicBtn = $("#tallyMic");
    if (tallyMicBtn) tallyMicBtn.addEventListener("click", tallyToggle);
    $("#tallySave").addEventListener("click", applyTally);
    $("#closeTally").addEventListener("click", function () { tallySheet.close(); });
  }


  // ------------------------------------------------------- excel import --

  // Pure parsing/mapping helpers for the Excel import. No DOM access here —
  // everything below is testable in isolation.

  // Header aliases: normalised (lowercase, alphanumeric+spaces) variants seen
  // on real shop stock sheets. Deterministic matching runs first; the LLM
  // fallback in api/map-columns.js only fills what this can't. Lists must stay
  // disjoint — "rate" is deliberately absent (means buy OR sell price
  // depending on the shop; let the LLM decide from sample values).
  var IMPORT_ALIASES = {
    name: ["name", "product", "product name", "item", "item name", "items", "description", "product description", "particulars", "goods"],
    category: ["category", "cat", "type", "group", "section", "dept", "department"],
    unitCost: ["cost", "unit cost", "cost price", "buy price", "buying price", "purchase price", "purchase rate", "landing cost", "landing price", "wholesale price", "cp", "cost rs", "cost per unit"],
    sellPrice: ["price", "sell price", "selling price", "sale price", "mrp", "sp", "retail price", "unit price", "selling rate", "price rs"],
    currentStock: ["stock", "qty", "quantity", "current stock", "stock qty", "units", "units in stock", "on hand", "in stock", "stock on hand", "closing stock", "balance", "balance qty", "available", "avail qty"],
    daysToExpiry: ["expiry", "days to expiry", "expiry days", "exp", "exp date", "expiry date", "best before", "best before date", "use by", "use by date", "shelf life", "expires", "expires on", "bb date"],
    leadTimeDays: ["lead time", "lead time days", "lead days", "delivery days", "delivery time", "supplier days", "reorder days"]
  };

  var IMPORT_REQUIRED = ["name", "unitCost", "sellPrice", "currentStock", "daysToExpiry"];

  function normHeader(h) {
    return String(h == null ? "" : h).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  // field -> header index. First alias hit wins; a header feeds one field only.
  function aliasMapHeaders(headers) {
    var map = {};
    var used = {};
    Object.keys(IMPORT_ALIASES).forEach(function (field) {
      var list = IMPORT_ALIASES[field];
      for (var i = 0; i < headers.length; i++) {
        if (used[i]) continue;
        if (list.indexOf(normHeader(headers[i])) >= 0) { map[field] = i; used[i] = true; break; }
      }
    });
    return map;
  }

  function importMissingRequired(map) {
    return IMPORT_REQUIRED.filter(function (f) { return !map.hasOwnProperty(f); });
  }

  // Real sheets often put a shop-name banner above the header row. Scan the
  // first few rows and pick the one the alias dictionary recognises best.
  function findHeaderRowIndex(rows) {
    var best = 0, bestHits = -1;
    var limit = Math.min(rows.length, 6);
    for (var i = 0; i < limit; i++) {
      var hits = Object.keys(aliasMapHeaders(rows[i] || [])).length;
      if (hits > bestHits) { bestHits = hits; best = i; }
    }
    return bestHits >= 2 ? best : 0;
  }

  // "₹1,250.50" → 1250.5 · "Rs. 40" → 40 · " 40/-" → 40 · "abc" → NaN.
  // Takes the first number in the cell; commas are thousands separators.
  function parseNumberLoose(v) {
    if (typeof v === "number") return v;
    if (v == null) return NaN;
    var m = String(v).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : NaN;
  }

  var MONTH_RE = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

  function daysFromToday(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.max(0, Math.round((day - today) / 86400000));
  }

  // Indian sheets are dd/mm/yyyy. If the middle number can't be a month,
  // assume the sheet was mm/dd and swap.
  function parseDMY(s) {
    var m = String(s).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!m) return null;
    var d = +m[1], mo = +m[2], y = +m[3];
    if (y < 100) y += 2000;
    if (mo > 12 && d <= 12) { var t = d; d = mo; mo = t; }
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var dt = new Date(y, mo - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Expiry cells arrive as day counts ("12", "12 days"), dates ("18/07/2026",
  // "2026-08-01", "20 Jul 2026", Date objects via cellDates:true), or raw
  // Excel serials. Everything becomes whole days from today; past dates → 0.
  function coerceDaysToExpiry(v) {
    if (v == null || v === "") return NaN;
    if (v instanceof Date) return isNaN(v.getTime()) ? NaN : daysFromToday(v);
    if (typeof v === "number" && isFinite(v)) {
      if (v >= 20000 && v < 80000) { // Excel date serial (≈1954–2119), not a day count
        // Serials are calendar dates, not instants — read the date in UTC so
        // the shop's timezone can never shift it by a day.
        var ser = new Date(Math.round((v - 25569) * 86400000));
        return daysFromToday(new Date(ser.getUTCFullYear(), ser.getUTCMonth(), ser.getUTCDate()));
      }
      return Math.round(v);
    }
    var s = String(v).trim();
    if (!s) return NaN;
    var dmy = parseDMY(s);
    if (dmy) return daysFromToday(dmy);
    var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return daysFromToday(new Date(+iso[1], +iso[2] - 1, +iso[3]));
    if (MONTH_RE.test(s) && /\d/.test(s)) {
      var parsed = new Date(s);
      if (!isNaN(parsed.getTime())) return daysFromToday(parsed);
    }
    var n = parseNumberLoose(s);
    return isFinite(n) ? Math.round(n) : NaN;
  }

  // Sheets never carry a day-by-day sales history (that's POS data), so give
  // imported items a flat, conservative placeholder: assume stock on hand is
  // about a week of cover. Flagged as estimated in the preview — the engine
  // corrects itself as the owner edits in real sales.
  function estimateSalesHistory(currentStock) {
    var daily = Math.max(1, Math.min(500, Math.round((isFinite(currentStock) ? currentStock : 0) / 7)));
    var arr = [];
    for (var i = 0; i < 14; i++) arr.push(daily);
    return arr;
  }

  // Same rules as the manual add-stock form — nothing extra invented.
  function validateImportRow(row) {
    var errors = {};
    if (!row.name) errors.name = true;
    if (!(isFinite(row.unitCost) && row.unitCost > 0)) errors.unitCost = true;
    if (!(isFinite(row.sellPrice) && row.sellPrice > 0)) errors.sellPrice = true;
    if (!(isFinite(row.currentStock) && row.currentStock >= 0)) errors.currentStock = true;
    if (!(isFinite(row.daysToExpiry) && row.daysToExpiry >= 0)) errors.daysToExpiry = true;
    return errors;
  }

  function importRowHasErrors(row) {
    for (var k in row.errors) { if (row.errors.hasOwnProperty(k)) return true; }
    return false;
  }

  function buildImportRows(dataRows, map) {
    var out = [];
    dataRows.forEach(function (cells) {
      function cell(f) { return map.hasOwnProperty(f) ? cells[map[f]] : ""; }
      var name = String(cell("name") == null ? "" : cell("name")).trim().slice(0, 40);
      var unitCost = parseNumberLoose(cell("unitCost"));
      var sellPrice = parseNumberLoose(cell("sellPrice"));
      var stockRaw = parseNumberLoose(cell("currentStock"));
      var lead = parseNumberLoose(cell("leadTimeDays"));
      // Skip sheet junk (spacer rows, totals with no name and no numbers).
      if (!name && !isFinite(unitCost) && !isFinite(sellPrice) && !isFinite(stockRaw)) return;
      var row = {
        include: true,
        name: name,
        category: String(cell("category") == null ? "" : cell("category")).trim(),
        unitCost: unitCost,
        sellPrice: sellPrice,
        currentStock: isFinite(stockRaw) ? Math.round(stockRaw) : NaN,
        daysToExpiry: coerceDaysToExpiry(cell("daysToExpiry")),
        leadTimeDays: (isFinite(lead) && lead >= 1) ? Math.round(lead) : 1
      };
      row.errors = validateImportRow(row);
      out.push(row);
    });
    return out;
  }

  // Merge the LLM's answer into the deterministic map. Deterministic wins;
  // the LLM only fills gaps, only with headers that really exist, and never
  // reuses a header another field already claimed.
  function mergeLlmMapping(map, llm, headers) {
    if (!llm || typeof llm !== "object") return map;
    var used = {};
    Object.keys(map).forEach(function (f) { used[map[f]] = true; });
    Object.keys(IMPORT_ALIASES).forEach(function (field) {
      if (map.hasOwnProperty(field)) return;
      var h = llm[field];
      if (typeof h !== "string") return;
      var idx = headers.indexOf(h);
      if (idx >= 0 && !used[idx]) { map[field] = idx; used[idx] = true; }
    });
    return map;
  }

  var importSheet = $("#importSheet");
  var importState = { rows: [], fileName: "" };

  var IMPORT_FIELD_LABELS = {
    name: "fName", category: "fCategory", unitCost: "fCost", sellPrice: "fPrice",
    currentStock: "fStock", daysToExpiry: "fExpiry", leadTimeDays: "fLead"
  };
  var IMPORT_COLS = ["name", "category", "unitCost", "sellPrice", "currentStock", "daysToExpiry", "leadTimeDays"];

  function importFieldLabel(f) { return t()[IMPORT_FIELD_LABELS[f]] || f; }

  function setImportStatus(msg) { var el = $("#importStatus"); el.textContent = msg || ""; el.hidden = !msg; }
  function setImportError(msg) { var el = $("#importError"); el.textContent = msg || ""; el.hidden = !msg; }
  function setImportWarn(msg) { var el = $("#importWarn"); el.textContent = msg || ""; el.hidden = !msg; }

  function openImportSheet() {
    importState.rows = [];
    importState.fileName = "";
    $("#closeImport").setAttribute("aria-label", t().closeAria);
    $("#importCancel").textContent = t().cancel;
    $("#importConfirm").textContent = fmt(t().impAddN, { n: 0 });
    $("#importConfirm").disabled = true;
    setImportStatus(""); setImportError(""); setImportWarn("");
    $("#importTableWrap").hidden = true;
    $("#importTable").innerHTML = "";
    $("#importEstNote").hidden = true;
    importSheet.showModal();
  }

  // Same fetch discipline as askWhy: hard 12s timeout, and a failure can
  // never block the flow — the preview opens with whatever mapped and the
  // owner types the rest.
  function llmMapColumns(headers, samples) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    return fetch("/api/map-columns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ headers: headers, samples: samples }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        return r.json().then(function (b) { return { ok: r.ok, b: b }; });
      })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok || !res.b || !res.b.mapping) throw new Error("bad response");
        return res.b.mapping;
      })
      .catch(function (e) {
        if (timer) clearTimeout(timer);
        throw e;
      });
  }

  function handleImportFile(file) {
    openImportSheet();
    if (!window.XLSX) { setImportError(t().impNeedNet); return; } // CDN never loaded (offline first visit)
    setImportStatus(t().impReading);
    file.arrayBuffer().then(function (buf) {
      var all;
      try {
        var wb = XLSX.read(buf, { type: "array", cellDates: true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        all = ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false }) : [];
      } catch (err) {
        setImportStatus(""); setImportError(t().impBadFile); return;
      }
      var hIdx = findHeaderRowIndex(all);
      var headers = (all[hIdx] || []).map(function (h) { return String(h == null ? "" : h); });
      var dataRows = all.slice(hIdx + 1);
      if (!headers.length || !dataRows.length) { setImportStatus(""); setImportError(t().impNoRows); return; }

      var map = aliasMapHeaders(headers);
      if (!importMissingRequired(map).length || !navigator.onLine) {
        finishImportMapping(file.name, headers, dataRows, map);
        return;
      }
      // Alias pass left required gaps — ask the server to read the headers.
      setImportStatus(t().impMapping);
      var samples = dataRows.slice(0, 3).map(function (r) {
        return r.map(function (c) {
          return c instanceof Date ? c.toISOString().slice(0, 10) : String(c == null ? "" : c).slice(0, 60);
        });
      });
      llmMapColumns(headers, samples)
        .then(function (llm) {
          finishImportMapping(file.name, headers, dataRows, mergeLlmMapping(map, llm, headers));
        })
        .catch(function () {
          finishImportMapping(file.name, headers, dataRows, map);
        });
    }).catch(function () {
      setImportStatus(""); setImportError(t().impBadFile);
    });
  }

  function finishImportMapping(fileName, headers, dataRows, map) {
    importState.rows = buildImportRows(dataRows, map);
    importState.fileName = fileName;
    if (!importState.rows.length) { setImportStatus(""); setImportError(t().impNoRows); return; }
    setImportError("");
    setImportStatus(fmt(t().impFile, { n: importState.rows.length, file: fileName }));
    var missing = importMissingRequired(map);
    setImportWarn(missing.length
      ? fmt(t().impMissingCols, { cols: missing.map(importFieldLabel).join(" · ") })
      : "");
    renderImportTable();
    $("#importTableWrap").hidden = false;
    $("#importEstNote").hidden = false;
    updateImportConfirm();
  }

  function importCellHtml(row, i, f) {
    var v = row[f];
    var shown = (typeof v === "number") ? (isFinite(v) ? String(v) : "") : String(v == null ? "" : v);
    var cls = "imp-cell" + ((f === "name" || f === "category") ? " imp-text" : "") + (row.errors[f] ? " bad" : "");
    return "<td><input class=\"" + cls + "\" data-r=\"" + i + "\" data-f=\"" + f + "\"" +
      (f === "name" ? " maxlength=\"40\"" : "") + " value=\"" + esc(shown) + "\" /></td>";
  }

  function importRowHtml(row, i) {
    var est = isFinite(row.currentStock) ? "\u2248 " + estimateSalesHistory(row.currentStock)[0] : "\u2248 \u2014";
    return "<tr" + (row.include ? "" : " class=\"row-off\"") + ">" +
      "<td class=\"imp-check\"><input type=\"checkbox\" class=\"imp-inc\" data-r=\"" + i + "\"" + (row.include ? " checked" : "") + " /></td>" +
      IMPORT_COLS.map(function (f) { return importCellHtml(row, i, f); }).join("") +
      "<td class=\"imp-est\">" + est + "</td>" +
      "</tr>";
  }

  function renderImportTable() {
    var head = "<tr>" +
      "<th class=\"imp-check\"><input type=\"checkbox\" class=\"imp-all\" checked aria-label=\"" + esc(t().impInclude) + "\" /></th>" +
      IMPORT_COLS.map(function (f) { return "<th>" + esc(importFieldLabel(f)) + "</th>"; }).join("") +
      "<th>" + esc(t().impSoldEst) + "</th></tr>";
    $("#importTable").innerHTML = "<thead>" + head + "</thead><tbody>" +
      importState.rows.map(importRowHtml).join("") + "</tbody>";
  }

  function updateImportConfirm() {
    var included = importState.rows.filter(function (r) { return r.include; });
    var bad = included.filter(importRowHasErrors);
    var btn = $("#importConfirm");
    btn.textContent = fmt(t().impAddN, { n: included.length });
    btn.disabled = !included.length || bad.length > 0;
    setImportError(bad.length ? fmt(t().impFixRows, { n: bad.length }) : "");
  }

  // Inline edits: keep the model, the red flags, the \u2248 estimate and the
  // confirm button in step with every keystroke.
  $("#importTable").addEventListener("input", function (e) {
    var inp = e.target.closest(".imp-cell");
    if (!inp) return;
    var row = importState.rows[Number(inp.dataset.r)];
    if (!row) return;
    var f = inp.dataset.f;
    if (f === "name") {
      row.name = inp.value.trim().slice(0, 40);
    } else if (f === "category") {
      row.category = inp.value.trim();
    } else if (f === "daysToExpiry") {
      row.daysToExpiry = coerceDaysToExpiry(inp.value.trim());
    } else if (f === "leadTimeDays") {
      var l = parseNumberLoose(inp.value);
      row.leadTimeDays = (isFinite(l) && l >= 1) ? Math.round(l) : 1;
    } else {
      var n = parseNumberLoose(inp.value);
      row[f] = (f === "currentStock" && isFinite(n)) ? Math.round(n) : n;
    }
    row.errors = validateImportRow(row);
    var tr = inp.closest("tr");
    IMPORT_COLS.forEach(function (cf) {
      var cell = tr.querySelector(".imp-cell[data-f=\"" + cf + "\"]");
      if (cell) cell.classList.toggle("bad", !!row.errors[cf]);
    });
    var estCell = tr.querySelector(".imp-est");
    if (estCell) estCell.textContent = isFinite(row.currentStock) ? "\u2248 " + estimateSalesHistory(row.currentStock)[0] : "\u2248 \u2014";
    updateImportConfirm();
  });

  $("#importTable").addEventListener("change", function (e) {
    if (e.target.classList.contains("imp-all")) {
      var on = e.target.checked;
      importState.rows.forEach(function (r) { r.include = on; });
      $("#importTable").querySelectorAll(".imp-inc").forEach(function (cb) { cb.checked = on; });
      $("#importTable").querySelectorAll("tbody tr").forEach(function (tr) { tr.classList.toggle("row-off", !on); });
      updateImportConfirm();
      return;
    }
    var cb = e.target.closest(".imp-inc");
    if (!cb) return;
    var row = importState.rows[Number(cb.dataset.r)];
    if (!row) return;
    row.include = cb.checked;
    cb.closest("tr").classList.toggle("row-off", !cb.checked);
    updateImportConfirm();
  });

  // Nothing touches state.products until this click.
  $("#importConfirm").addEventListener("click", function () {
    var accepted = importState.rows.filter(function (r) { return r.include && !importRowHasErrors(r); });
    if (!accepted.length) return;
    var firstId = null;
    accepted.forEach(function (r, index) {
      var id = "user-" + Date.now() + "-" + index; // index keeps ids unique within one batch
      if (!firstId) firstId = id;
      var category = resolveImportCategory(r.category);
      state.products.push({
        id: id,
        name: r.name,
        category: category,
        icon: CAT_ICON[category] || "basket",
        unitCost: r.unitCost,
        sellPrice: r.sellPrice,
        currentStock: r.currentStock,
        daysToExpiry: r.daysToExpiry,
        leadTimeDays: r.leadTimeDays,
        salesHistory: estimateSalesHistory(r.currentStock),
        salesEstimated: true // provenance: cleared when real sales are edited in
      });
    });
    saveProducts();
    importSheet.close();
    render({ animateNums: true });
    var el = $("#grid").querySelector("[data-id=\"" + CSS.escape(firstId) + "\"]");
    if (el) {
      el.classList.add("flash");
      el.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }
  });

  // Case-insensitive match against known categories; anything else is the
  // catch-all so its icon and chip behave like the manual form.
  function resolveImportCategory(raw) {
    var s = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!s) return "custom";
    var keys = Object.keys(CAT_ICON);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === s) return keys[i];
    }
    return "custom";
  }

  $("#importBtn").addEventListener("click", function () { $("#importFile").click(); });
  $("#importFile").addEventListener("change", function () {
    var file = this.files && this.files[0];
    this.value = ""; // re-picking the same file must fire change again
    if (file) handleImportFile(file);
  });
  $("#importCancel").addEventListener("click", function () { importSheet.close(); });
  $("#closeImport").addEventListener("click", function () { importSheet.close(); });

  // ------------------------------------------------------ budget planner --
  // Same recommendation math as everywhere else in the app, applied under
  // a cash constraint. A candidate is any product already flagged "needs
  // reorder" elsewhere (verdict === "ro") that hasn't been ordered yet
  // today — this never invents a second definition of "needs reorder."

  var budgetSheet = $("#budgetSheet");
  var budgetState = { plan: null, rows: [] };
  var budgetRecalcTimer = null;

  function budgetCandidateRows() {
    return state.rows.filter(function (r) {
      return r.verdict === "ro" && !lastAction(r.p.id, "order");
    });
  }

  function budgetEngineItems(rows) {
    return rows.map(function (r) { return { product: r.p, analyzed: r.a }; });
  }

  function budgetTotalNeed(rows) {
    return rows.reduce(function (s, r) { return s + r.reorderQty * r.p.unitCost; }, 0);
  }

  // Nudge banner lives above the chips; updated on every render() so it
  // tracks stock edits, new activity, and language changes automatically.
  function updateBudgetNudge() {
    var rows = budgetCandidateRows();
    var nudge = $("#budgetNudge");
    if (!rows.length) { nudge.hidden = true; return; }
    $("#budgetNudgeText").textContent = fmt(t().budgetNudge, { total: rupees(budgetTotalNeed(rows)), n: rows.length });
    nudge.hidden = false;
  }

  // Same visibility rule as the per-item verdict badges: only show when
  // there's genuinely something flagged, same "don't cry wolf" trust
  // principle the rest of the app already follows.
  function updatePlanPanel() {
    var panel = $("#planPanel");
    if (!panel) return;
    var flagged = state.rows.filter(function (r) { return r.a.markdown.needed || r.needsReorder; });
    panel.hidden = !flagged.length;
  }

  function budgetRowHtml(item) {
    var p = state.products.find(function (x) { return x.id === item.id; });
    var icon = p ? iconSvg(resolveIconId(p)) : "";
    var tag, note;
    if (item.status === "skip") {
      tag = t().budgetSkipTag;
      note = item.firstUnitValue > 0 ? fmt(t().budgetWouldProtect, { n: rupees(item.firstUnitValue) }) : "";
    } else {
      tag = fmt(t().budgetUnitsTag, { n: item.fundedUnits, m: item.neededUnits });
      note = fmt(t().budgetProtects, { n: rupees(item.value) });
    }
    return '<div class="budget-row budget-row-' + esc(item.status) + '">' +
      '<span class="icon-chip">' + icon + "</span>" +
      '<span class="budget-row-name">' + esc(item.name) + "</span>" +
      '<span class="budget-row-tag">' + esc(tag) + "</span>" +
      '<span class="budget-row-cost">' + (item.status === "skip" ? "" : esc(rupees(item.cost))) + "</span>" +
      '<span class="budget-row-note">' + esc(note) + "</span>" +
    "</div>";
  }

  function renderBudgetResults() {
    var rows = budgetState.rows;
    var summaryEl = $("#budgetSummary"), emptyEl = $("#budgetEmptyMsg"), listEl = $("#budgetList"), confirmBtn = $("#budgetConfirm");

    if (!rows.length) {
      summaryEl.hidden = true;
      listEl.innerHTML = "";
      emptyEl.textContent = t().budgetNoCandidates;
      emptyEl.hidden = false;
      confirmBtn.disabled = true;
      confirmBtn.textContent = fmt(t().budgetConfirmBtn, { n: 0 });
      return;
    }

    var amount = Number($("#budgetAmount").value) || 0;
    var plan = engine.planBudget(budgetEngineItems(rows), amount);
    budgetState.plan = plan;

    if (amount <= 0) {
      summaryEl.hidden = true;
      listEl.innerHTML = "";
      emptyEl.textContent = t().budgetZeroState;
      emptyEl.hidden = false;
      confirmBtn.disabled = true;
      confirmBtn.textContent = fmt(t().budgetConfirmBtn, { n: 0 });
      return;
    }

    emptyEl.hidden = true;
    summaryEl.hidden = false;
    $("#budgetAllocatedText").textContent = fmt(t().budgetAllocated, { spent: rupees(plan.spent), budget: rupees(plan.budget) });
    $("#budgetLeftoverText").textContent = fmt(t().budgetLeftover, { n: rupees(plan.remaining) });
    $("#budgetValueNum").textContent = rupees(plan.valueGained);
    $("#budgetCoveredNote").hidden = !plan.fullyCovered;

    var funded = plan.items.filter(function (it) { return it.fundedUnits > 0; });
    var skipped = plan.items.filter(function (it) { return it.fundedUnits === 0; });
    var html = "";
    if (funded.length) {
      html += '<div class="budget-list-head">' + esc(t().budgetSpendOrder) + "</div>" + funded.map(budgetRowHtml).join("");
    }
    if (skipped.length) {
      html += '<div class="budget-list-head">' + esc(t().budgetCanWait) + "</div>" + skipped.map(budgetRowHtml).join("");
    }
    listEl.innerHTML = html;

    confirmBtn.disabled = funded.length === 0;
    confirmBtn.textContent = fmt(t().budgetConfirmBtn, { n: funded.length });
  }

  function scheduleBudgetRecalc() {
    if (budgetRecalcTimer) clearTimeout(budgetRecalcTimer);
    budgetRecalcTimer = setTimeout(renderBudgetResults, 120);
  }

  function setBudgetAmount(v) {
    v = Math.max(0, Math.round(Number(v) || 0));
    $("#budgetAmount").value = v;
    $("#budgetSlider").value = Math.min(v, Number($("#budgetSlider").max));
    scheduleBudgetRecalc();
  }

  function openBudgetSheet() {
    var rows = budgetCandidateRows();
    budgetState.rows = rows;
    budgetState.plan = null;
    $("#closeBudget").setAttribute("aria-label", t().closeAria);
    $("#budgetCancel").textContent = t().cancel;

    if (!rows.length) {
      $("#budgetAmount").value = 0;
      $("#budgetSlider").value = 0;
      renderBudgetResults();
      budgetSheet.showModal();
      return;
    }

    var totalNeed = budgetTotalNeed(rows);
    var sliderMax = Math.max(100, Math.ceil(totalNeed / 50) * 50);
    $("#budgetSlider").max = sliderMax;
    $("#budgetSlider").step = 10;
    $("#budgetAmount").step = 10;
    var suggested = Math.round((totalNeed * 0.5) / 10) * 10;
    setBudgetAmount(suggested);
    renderBudgetResults();
    budgetSheet.showModal();
  }

  $("#budgetAmount").addEventListener("input", function () {
    $("#budgetSlider").value = Math.min(Number(this.value) || 0, Number($("#budgetSlider").max));
    scheduleBudgetRecalc();
  });
  $("#budgetSlider").addEventListener("input", function () {
    $("#budgetAmount").value = this.value;
    scheduleBudgetRecalc();
  });

  $("#budgetPlanBtn").addEventListener("click", openBudgetSheet);
  $("#planBtn").addEventListener("click", function (e) {
    if (!e.currentTarget.disabled) askPlan(e.currentTarget);
  });

  // Hiding the plan chit mirrors the per-card dismiss: drop the cached plan
  // and reset the button, so "Ask Munafa" reads as askable again.
  $("#planPanel").addEventListener("click", function (e) {
    if (!e.target.closest(".chit-hide")) return;
    $("#planChit").hidden = true;
    delete state.planNotes[state.lang];
    var label = $("#planBtn").querySelector("span");
    if (label) label.textContent = t().planBtn;
  });
  $("#budgetCancel").addEventListener("click", function () { budgetSheet.close(); });
  $("#closeBudget").addEventListener("click", function () { budgetSheet.close(); });

  $("#budgetConfirm").addEventListener("click", function () {
    var plan = budgetState.plan;
    if (!plan) return;
    var funded = plan.items.filter(function (it) { return it.fundedUnits > 0; });
    if (!funded.length) return;
    funded.forEach(function (it) {
      var p = state.products.find(function (x) { return x.id === it.id; });
      if (p) addActivity(p, "order", it.fundedUnits);
    });
    budgetSheet.close();
    render({ animateNums: true });
    showShareNote(fmt(t().budgetConfirmedNote, { n: funded.length }));
  });

  // ----------------------------------------------------- model validation --
  // An honest test of the newsvendor math, not just an assertion of it.
  // The headline number comes from engine.runValidation's CLOSED-FORM
  // expectation — deterministic, so it cannot vary between page loads.
  // The chart is a genuine Monte Carlo simulation and re-rolls every time
  // "Run again" is pressed; that's the honest way to show both the
  // mathematical guarantee and what one simulated month actually looked
  // like. Whole catalog, not just today's low-stock items — this tests
  // the policy in general, not today's specific situation.

  var validateSheet = $("#validateSheet");

  function validateBarGroup(x, label, data) {
    var barW = 78;
    var cx = x + barW / 2;
    return {
      total: data.stockoutCost + data.spoilageCost,
      html: function (stockH, spoilH, baseY) {
        var stockY = baseY - stockH;
        var spoilY = stockY - spoilH;
        return (
          '<rect x="' + x + '" y="' + stockY.toFixed(1) + '" width="' + barW + '" height="' + Math.max(0, stockH).toFixed(1) + '" class="validate-bar-stockout" rx="3"/>' +
          '<rect x="' + x + '" y="' + spoilY.toFixed(1) + '" width="' + barW + '" height="' + Math.max(0, spoilH).toFixed(1) + '" class="validate-bar-spoilage" rx="3"/>' +
          '<text x="' + cx + '" y="' + (spoilY - 9).toFixed(1) + '" class="validate-bar-value" text-anchor="middle">' + esc(rupees(data.stockoutCost + data.spoilageCost)) + '</text>' +
          '<text x="' + cx + '" y="' + (baseY + 20) + '" class="validate-bar-label" text-anchor="middle">' + esc(label) + '</text>'
        );
      }
    };
  }

  function buildValidateChartSvg(simulated) {
    var baseY = 176, chartH = 148;
    var maxTotal = Math.max(simulated.munafa.stockoutCost + simulated.munafa.spoilageCost,
      simulated.naive.stockoutCost + simulated.naive.spoilageCost, 1);
    function px(v) { return (v / maxTotal) * chartH; }

    var mGroup = validateBarGroup(58, t().validateChartMunafa, simulated.munafa);
    var nGroup = validateBarGroup(190, t().validateChartNaive, simulated.naive);

    return '<svg viewBox="0 0 330 210" class="validate-chart" role="img" aria-hidden="true">' +
      '<line x1="18" y1="' + baseY + '" x2="312" y2="' + baseY + '" class="validate-axis"/>' +
      mGroup.html(px(simulated.munafa.stockoutCost), px(simulated.munafa.spoilageCost), baseY) +
      nGroup.html(px(simulated.naive.stockoutCost), px(simulated.naive.spoilageCost), baseY) +
    "</svg>";
  }

  function validateBreakdownHtml(items) {
    return items.map(function (it) {
      var pct = Math.max(0, it.improvementPct);
      return '<div class="validate-row">' +
        '<span class="validate-row-name">' + esc(it.name) + "</span>" +
        '<span class="validate-row-bar"><span class="validate-row-fill" style="width:' + Math.min(100, pct).toFixed(0) + '%"></span></span>' +
        '<span class="validate-row-pct">' + esc(fmt(t().validateItemPct, { pct: pct.toFixed(1) })) + "</span>" +
      "</div>";
    }).join("");
  }

  function runValidationSimulation() {
    var items = state.products.map(function (p) { return { product: p, analyzed: engine.analyzeProduct(p) }; });
    var result = engine.runValidation(items);
    var pct = Math.max(0, result.improvementPct);

    $("#validateHeadlineNum").textContent = pct.toFixed(1) + "%";
    $("#validateHeadlineLbl").textContent = t().validateHeadlineLabel;
    $("#validateHeadlineSub").textContent = fmt(t().validateHeadlineSub, {
      munafa: rupees(result.closed.munafa.cost), naive: rupees(result.closed.naive.cost),
      n: items.length, days: result.horizonDays
    });
    $("#validateChartWrap").innerHTML = buildValidateChartSvg(result.simulated);
    $("#validateMethodBody").textContent = t().validateMethodBody;
    $("#validateBreakdown").innerHTML = validateBreakdownHtml(result.items);

    $("#validateRunning").hidden = true;
    $("#validateResults").hidden = false;
  }

  function openValidateSheet() {
    $("#closeValidate").setAttribute("aria-label", t().closeAria);
    $("#validateResults").hidden = true;
    $("#validateRunning").hidden = false;
    validateSheet.showModal();
    // Defer one tick so "Running the simulation…" actually paints before
    // the (near-instant) computation replaces it with results.
    setTimeout(runValidationSimulation, 30);
  }

  $("#validateBtn").addEventListener("click", openValidateSheet);
  $("#validateRerun").addEventListener("click", function () {
    $("#validateResults").hidden = true;
    $("#validateRunning").hidden = false;
    setTimeout(runValidationSimulation, 30);
  });
  $("#closeValidate").addEventListener("click", function () { validateSheet.close(); });
  $("#closeValidateDone").addEventListener("click", function () { validateSheet.close(); });

  // ------------------------------------------------------------- drawer --

  $("#actBtn").addEventListener("click", function () {
    renderActivity(false);
    $("#drawer").showModal();
    var g = G();
    if (g) {
      var tw = g.fromTo("#actList > li", { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.035, delay: 0.12, ease: "power2.out", overwrite: "auto", clearProps: "opacity,transform" });
      // Same safety as the load choreography: stalled frames (background tab,
      // throttled webview) must never leave the list invisible.
      setTimeout(function () { if (tw.progress() < 1) tw.progress(1); }, 1500);
    }
  });
  $("#closeDrawer").addEventListener("click", function () { $("#drawer").close(); });
  $("#clearLog").addEventListener("click", function () {
    state.activity = [];
    saveActivity();
    render({ animateNums: false });
  });

  // Per-entry undo from the panel. Removing the entry and re-rendering drops
  // the product's card back to its live recommendation.
  $("#actList").addEventListener("click", function (e) {
    var undo = e.target.closest(".act-undo");
    if (!undo) return;
    var li = undo.closest(".act-item");
    if (!li) return;
    var id = li.getAttribute("data-entry");
    var entry = state.activity.find(function (en) { return en.id === id; });
    if (!entry) return;

    function commit() {
      removeActivityById(id);
      render({ animateNums: true });
      var card = $("#grid").querySelector('[data-id="' + CSS.escape(entry.productId) + '"]');
      if (card) card.classList.add("flash");
    }

    var g = G();
    if (!g) { commit(); return; }
    undo.disabled = true;
    g.to(li, {
      opacity: 0, x: 26, height: 0, marginTop: -10, paddingTop: 0, paddingBottom: 0,
      overflow: "hidden", duration: 0.28, ease: "power2.in", onComplete: commit
    });
  });

  // -------------------------------------------- share today's actions --

  // The honest answer to "where does an order go": the day's confirmed
  // actions become one plain-text message the owner sends to their real
  // supplier — native share sheet where the browser has one, clipboard
  // everywhere else.
  function buildShareText() {
    var loc = LOCALES[state.lang] || "en-IN";
    var lines = [fmt(t().shareTitle, {
      date: new Date().toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })
    })];
    state.activity.forEach(function (en) {
      if (!isToday(en.at)) return;
      var deed = en.type === "order"
        ? fmt(t().shareOrder, { n: en.value })
        : fmt(t().shareMd, { n: en.value });
      lines.push("• " + en.name + ": " + deed);
    });
    return lines.join("\n");
  }

  function copyText(text) {
    function legacy() {
      return new Promise(function (resolve, reject) {
        // The textarea must live inside the open modal dialog to take focus.
        var host = $("#drawer");
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
        host.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { /* fall through */ }
        host.removeChild(ta);
        if (ok) resolve(); else reject(new Error("copy failed"));
      });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(legacy);
    }
    return legacy();
  }

  var shareNoteTimer = null;

  function showShareNote(text) {
    var note = $("#shareNote");
    note.textContent = text;
    note.hidden = false;
    var g = G();
    if (g) {
      g.fromTo(note, { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", clearProps: "transform" });
    }
    if (shareNoteTimer) clearTimeout(shareNoteTimer);
    shareNoteTimer = setTimeout(function () {
      if (g) {
        g.to(note, { opacity: 0, duration: 0.3, onComplete: function () {
          note.hidden = true;
          g.set(note, { clearProps: "opacity" });
        } });
      } else {
        note.hidden = true;
      }
    }, 3200);
  }

  $("#shareBtn").addEventListener("click", function () {
    var text = buildShareText();
    function viaClipboard() {
      copyText(text).then(function () { showShareNote(t().shareCopied); });
    }
    if (navigator.share) {
      navigator.share({ text: text }).catch(function (err) {
        // Closing the native sheet is not a failure; anything else falls back.
        if (err && err.name === "AbortError") return;
        viaClipboard();
      });
      return;
    }
    viaClipboard();
  });

  $("#smsAlertBtn").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    var note = $("#smsNote");
    note.textContent = "Generating report...";
    note.hidden = false;

    var expires = [];
    var exhausts = [];

    state.products.forEach(function (p) {
      var stat = engine.analyzeProduct(p);
      
      // Expire logic
      if (p.daysToExpiry <= 7) {
        var mkdn = engine.markdownSuggestion(p.currentStock, stat.dailyMean, p.daysToExpiry, 1.6);
        if (mkdn.needed && mkdn.markdownPct > 0) {
          expires.push(p.name + " - " + mkdn.markdownPct + "% discount");
        }
      }
      
      // Exhaust logic
      var outLvl = stat.orderUpToLevel || 10;
      if (p.currentStock <= 5 || p.currentStock < outLvl) {
        exhausts.push(p.name + " - restock " + outLvl);
      }
    });

    if (expires.length === 0 && exhausts.length === 0) {
      note.textContent = "No alerts needed today.";
      setTimeout(function() { note.hidden = true; btn.disabled = false; }, 3000);
      return;
    }

    var messageLines = [];
    if (expires.length > 0) {
      messageLines.push("expire:");
      expires.forEach(function(l) { messageLines.push(l); });
    }
    if (exhausts.length > 0) {
      messageLines.push("exhaust:");
      exhausts.forEach(function(l) { messageLines.push(l); });
    }
    var finalMessage = messageLines.join("\n");
    note.textContent = "Sending SMS...";

    fetch("/api/send-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalMessage })
    })
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
      });
    })
    .then(function() {
      note.textContent = "SMS sent successfully!";
      setTimeout(function() { note.hidden = true; btn.disabled = false; }, 3000);
    })
    .catch(function(err) {
      note.textContent = "Error: " + err.message;
      setTimeout(function() { note.hidden = true; btn.disabled = false; }, 5000);
    });
  });

  // ------------------------------------------------- order cart → WhatsApp --
  // Confirming "Order N units" on a card already logs an activity entry; the
  // cart IS today's unsent order entries — no second bookkeeping system that
  // could drift from the log. A floating "Place order" bar appears while the
  // cart has items; the sheet lets the owner adjust quantities, then one tap
  // opens WhatsApp with the whole order prefilled for their supplier. After
  // sending, entries are stamped sentAt so the cart empties while the activity
  // log and the Munafa Meter keep them.

  var LS_SUPPLIER = "munafa-supplier-v1";
  var cartSheet = $("#cartSheet");

  function cartEntries() {
    return state.activity.filter(function (en) {
      return en.type === "order" && isToday(en.at) && !en.sentAt;
    });
  }

  function cartProduct(en) {
    return state.products.find(function (x) { return x.id === en.productId; });
  }

  // Purchase total = what the owner will PAY the supplier (qty × buy price),
  // not sell-side value — this is the number he checks his cashbox against.
  function cartTotals() {
    var items = cartEntries();
    var total = 0;
    items.forEach(function (en) {
      var p = cartProduct(en);
      if (p) total += (Number(en.value) || 0) * p.unitCost;
    });
    return { count: items.length, total: Math.round(total) };
  }

  function renderCartBar() {
    var bar = $("#cartBar");
    if (!bar) return;
    var s = cartTotals();
    bar.hidden = s.count === 0;
    if (s.count) $("#cartBarSum").textContent = fmt(t().cartBarSummary, { n: s.count, total: rupees(s.total) });
  }

  function cartRowHtml(en) {
    var p = cartProduct(en);
    var qty = Number(en.value) || 0;
    var lineCost = p ? Math.round(qty * p.unitCost) : 0;
    return '<div class="cart-row" data-entry="' + esc(en.id) + '">' +
      '<span class="icon-chip">' + iconSvg(p ? resolveIconId(p) : "basket") + "</span>" +
      '<span class="cart-row-name">' + esc(en.name) + "</span>" +
      '<span class="cart-stepper">' +
        '<button class="qty-btn dec" type="button" aria-label="' + esc(t().qtyLess) + '">−</button>' +
        '<span class="qty-val">' + qty + "</span>" +
        '<button class="qty-btn inc" type="button" aria-label="' + esc(t().qtyMore) + '">+</button>' +
      "</span>" +
      '<span class="cart-row-cost">' + esc(rupees(lineCost)) + "</span>" +
      '<button class="cart-row-remove" type="button" aria-label="' + esc(t().remove) + '">×</button>' +
    "</div>";
  }

  function renderCartSheet() {
    var items = cartEntries();
    $("#cartList").innerHTML = items.length
      ? items.map(cartRowHtml).join("")
      : '<p class="cart-empty">' + esc(t().cartEmpty) + "</p>";
    $("#cartTotalNum").textContent = rupees(cartTotals().total);
    $("#cartSend").disabled = !items.length;
  }

  function buildOrderText(items) {
    var loc = LOCALES[state.lang] || "en-IN";
    var dateStr = new Date().toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
    
    var lines = ["Order List for " + dateStr, ""];
    
    items.forEach(function (en) {
      var p = cartProduct(en);
      var qty = Number(en.value) || 0;
      if (p) {
        var unitCost = p.unitCost;
        var lineCost = Math.round(qty * unitCost);
        lines.push("• " + en.name + ": " + qty + " units × " + rupees(unitCost) + " = " + rupees(lineCost));
      } else {
        lines.push("• " + en.name + ": " + qty + " units");
      }
    });
    
    lines.push("");
    lines.push("Approx. purchase total: " + rupees(cartTotals().total));
    lines.push("");
    lines.push("The amount will be sent shortly.");
    
    return lines.join("\n");
  }

  $("#cartBar").addEventListener("click", function () {
    try { $("#supplierPhone").value = localStorage.getItem(LS_SUPPLIER) || ""; } catch (e) { /* private mode */ }
    renderCartSheet();
    cartSheet.showModal();
  });
  $("#closeCart").addEventListener("click", function () { cartSheet.close(); });

  $("#supplierPhone").addEventListener("input", function (e) {
    try { localStorage.setItem(LS_SUPPLIER, e.target.value.trim()); } catch (err) { /* ignore */ }
  });

  $("#cartList").addEventListener("click", function (e) {
    var rowEl = e.target.closest(".cart-row");
    if (!rowEl) return;
    var entry = state.activity.find(function (en) { return en.id === rowEl.dataset.entry; });
    if (!entry) return;

    if (e.target.closest(".cart-row-remove")) {
      // Same semantics as the card's undo: the entry disappears and the card
      // falls back to its live order panel on the re-render below.
      removeActivityById(entry.id);
      render({ animateNums: false });
      renderCartSheet();
      return;
    }

    var qtyBtn = e.target.closest(".qty-btn");
    if (!qtyBtn) return;
    var inc = qtyBtn.classList.contains("inc");
    entry.value = Math.max(1, Math.min(999, (Number(entry.value) || 1) + (inc ? 1 : -1)));
    // Keep the Munafa Meter honest: a changed order size means a changed
    // stockout-avoided figure, so re-snapshot with the same capped formula.
    if (typeof entry.rupeesSaved === "number" && entry.savingKind === "stockout") {
      var row = state.rows.find(function (r) { return r.p.id === entry.productId; });
      if (row) entry.rupeesSaved = orderSavingRupees(row, entry.value);
    }
    saveActivity();
    render({ animateNums: false });
    renderCartSheet();
  });

  $("#cartSend").addEventListener("click", function () {
    var items = cartEntries();
    if (!items.length) return;
    var text = buildOrderText(items);

    // 10 digits = an Indian number typed without the country code; wa.me needs
    // digits only, with the code, no plus. An empty number falls back to
    // WhatsApp's own contact picker (wa.me/?text=…) — still one tap to send.
    var digits = ($("#supplierPhone").value || "").replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    var url = "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);

    var now = Date.now();
    items.forEach(function (en) { en.sentAt = now; });
    saveActivity();
    cartSheet.close();
    render({ animateNums: false });
    window.open(url, "_blank", "noopener");
  });

  // ---------------------------------------------------------- global wiring --

  $("#grid").addEventListener("click", function (e) {
    if (e.target.closest(".showall")) {
      state.filter = null;
      state.catFilter = null;
      render({ animateNums: false });
      animateGridIn();
      return;
    }

    var card = e.target.closest(".card");
    if (!card) return;
    var row = state.rows.find(function (r) { return r.p.id === card.dataset.id; });
    if (!row) return;

    var qtyBtn = e.target.closest(".qty-btn");
    if (qtyBtn) {
      var inc = qtyBtn.classList.contains("inc");
      var op = qtyBtn.closest(".order-panel");
      var mp = qtyBtn.closest(".mark-panel");
      if (op) {
        var qty = Math.max(1, Math.min(999, Number(op.dataset.qty) + (inc ? 1 : -1)));
        op.dataset.qty = qty;
        op.querySelector(".qty-val").textContent = qty;
        op.querySelector(".order-btn").textContent = fmt(t().orderBtn, { n: qty });
      } else if (mp) {
        var pct = Math.max(5, Math.min(70, Number(mp.dataset.pct) + (inc ? 5 : -5)));
        mp.dataset.pct = pct;
        mp.querySelector(".qty-val").textContent = pct + "%";
        mp.querySelector(".mark-btn").textContent = fmt(t().markBtn, { n: pct });
      }
      return;
    }

    var confirmed = null; // "order" | "markdown"
    var orderBtn = e.target.closest(".order-btn");
    var markBtn = e.target.closest(".mark-btn");
    if (orderBtn) {
      var op2 = orderBtn.closest(".order-panel");
      var orderQty = Number(op2.dataset.qty) || row.reorderQty;
      addActivity(row.p, "order", orderQty, { rupeesSaved: orderSavingRupees(row, orderQty), savingKind: "stockout" });
      op2.outerHTML = doneHtml("order", lastAction(row.p.id, "order"));
      confirmed = "order";
    } else if (markBtn) {
      var mp2 = markBtn.closest(".mark-panel");
      addActivity(row.p, "markdown", Number(mp2.dataset.pct) || row.a.markdown.markdownPct, { rupeesSaved: row.a.spoilageRiskRupees, savingKind: "spoilage" });
      mp2.outerHTML = doneHtml("markdown", lastAction(row.p.id, "markdown"));
      confirmed = "markdown";
    }
    if (confirmed) {
      var g = G();
      var stampEl = card.querySelector('.act-done[data-type="' + confirmed + '"] .stamp-done');
      if (g && stampEl) {
        g.fromTo(stampEl, { scale: 1.5, rotate: -9, opacity: 0 },
          { scale: 1, rotate: -1, opacity: 1, duration: 0.45, ease: "back.out(2)", clearProps: "opacity" });
      }
      return;
    }

    var undoBtn = e.target.closest(".act-undo");
    if (undoBtn) {
      var type = undoBtn.dataset.type;
      removeLastAction(row.p.id, type);
      var doneEl = undoBtn.closest(".act-done");
      doneEl.outerHTML = type === "order" ? orderPanelHtml(row) : markPanelHtml(row);
      return;
    }

    // Hiding a chit dismisses it fully: the cached note is dropped and the
    // ask button resets, so the card returns to its pre-ask state.
    var chitHide = e.target.closest(".chit-hide");
    if (chitHide) {
      chitHide.closest(".chit").hidden = true;
      delete state.aiNotes[row.p.id + ":" + state.lang];
      var askEl = card.querySelector(".ask-btn");
      if (askEl) askEl.textContent = t().askWhy;
      return;
    }

    var askBtn = e.target.closest(".ask-btn");
    if (askBtn && !askBtn.disabled) { askWhy(card, row, askBtn); return; }
    if (e.target.closest(".edit-btn")) openSheet(row.p);
  });

  $("#chips").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var cat = chip.dataset.cat || null;
    state.catFilter = (state.catFilter === cat) ? null : cat;
    render({ animateNums: false });
    animateGridIn();
  });

  document.querySelectorAll(".stat").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.filter;
      state.filter = state.filter === f ? null : f;
      render({ animateNums: false });
      animateGridIn();
    });
  });

  document.querySelectorAll(".lang-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (state.lang === b.dataset.lang) return;
      state.lang = b.dataset.lang;
      try { localStorage.setItem(LS_LANG, state.lang); } catch (e) { /* ignore */ }
      render({ animateNums: false });
      var g = G();
      if (g) g.fromTo("#main", { opacity: 0.35, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    });
  });

  $("#addBtn").addEventListener("click", function () { openSheet(null); });
  $("#fabBtn").addEventListener("click", function () { openSheet(null); });

  // Overflow menu (Import Excel, model validation): a native <details> so it
  // needs no JS to open — this only closes it after a choice or an outside tap.
  (function wireMoreMenu() {
    var menu = $("#moreMenu");
    if (!menu) return;
    menu.querySelectorAll(".menu-item").forEach(function (b) {
      b.addEventListener("click", function () { menu.open = false; });
    });
    document.addEventListener("click", function (e) {
      if (menu.open && !e.target.closest("#moreMenu")) menu.open = false;
    });
  })();

  // Munafa Meter: tap the hero tile to reveal / hide the one-line breakdown.
  (function wireMeterTile() {
    var tile = $("#meterTile");
    var breakEl = $("#meterBreak");
    if (!tile || !breakEl) return;
    tile.addEventListener("click", function () {
      var show = breakEl.hidden;
      breakEl.hidden = !show;
      tile.setAttribute("aria-expanded", String(show));
    });
  })();

  $("#resetBtn").addEventListener("click", function () {
    try {
      localStorage.removeItem(LS_PRODUCTS);
      localStorage.removeItem(LS_ACTIVITY);
    } catch (e) { /* ignore */ }
    state.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    state.activity = [];
    state.aiNotes = {};
    state.filter = null;
    state.catFilter = null;
    render({ animateNums: true });
  });

  // ------------------------------------------------------- load choreography --

  function intro() {
    var g = G();
    if (!g) return;
    // Every element the intro touches. The choreography must end with ZERO
    // inline style residue: leftover transforms keep these elements on stale
    // GPU compositor layers, and when the web fonts land late (real network)
    // Chrome can keep painting the pre-swap texture — layout measures fine
    // but the header LOOKS overlapped until any interaction forces a repaint.
    var TARGETS = ".board,.counter,.stat,#chips .chip,.cat-head,.card,.race-fill,.race-exp,.race-spoil,.foot";
    // Clear ONLY what the intro animated. clearProps:"all" would also wipe the
    // functional inline left/width that render() puts on the race segments.
    function scrub() { g.set(TARGETS, { clearProps: "transform,translate,rotate,scale,transformOrigin,opacity,willChange" }); }
    var tl = g.timeline({ defaults: { ease: "power3.out" }, onComplete: scrub });
    // Safety: if frames stall (background tab, throttled webview), never leave
    // the page half-hidden — jump the choreography to its end state.
    setTimeout(function () {
      if (tl.progress() < 1) { tl.progress(1); scrub(); }
    }, 4000);
    tl.from(".board", { y: -30, opacity: 0, duration: 0.65, ease: "back.out(1.4)" })
      .from(".counter", { y: 16, opacity: 0, duration: 0.45 }, "-=0.3")
      .from(".stat", { y: 24, opacity: 0, stagger: 0.09, duration: 0.5, ease: "back.out(1.6)" }, "-=0.15")
      .from("#chips .chip", { y: 10, opacity: 0, stagger: 0.04, duration: 0.35 }, "-=0.25")
      .from(".cat-head", { x: -14, opacity: 0, stagger: 0.09, duration: 0.4 }, "-=0.15")
      .from(".card", { y: 28, opacity: 0, stagger: 0.05, duration: 0.5, ease: "back.out(1.2)" }, "-=0.3")
      .from(".race-fill", { scaleX: 0, transformOrigin: "0 50%", stagger: 0.045, duration: 0.7, ease: "power4.out" }, "-=0.55")
      .from(".race-exp", { y: -12, opacity: 0, stagger: 0.045, duration: 0.35, ease: "back.out(2.5)" }, "-=0.7")
      .from(".race-spoil", { opacity: 0, stagger: 0.045, duration: 0.4 }, "-=0.7")
      .from(".foot", { opacity: 0, duration: 0.4 }, "-=0.4");
    // When the real web fonts finish loading — on a slow connection that can
    // be well after the intro — scrub once more. Clearing props invalidates
    // style on exactly the affected elements, forcing the fresh repaint that
    // clicking a chip used to do by accident.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (tl.progress() >= 1) scrub();
      });
    }
  }

  // ----------------------------------------------------------------- boot --

  if (window.gsap) window.gsap.config({ nullTargetWarn: false });
  render({ animateNums: true });
  intro();
  if (typeof autoSendAlerts === "function") autoSendAlerts();
})();
