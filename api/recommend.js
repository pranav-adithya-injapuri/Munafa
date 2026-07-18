// api/recommend.js
// Vercel serverless function. Deployed automatically as POST /api/recommend
// alongside the static files — no separate backend service needed.
// Keeps GEMINI_API_KEY server-side only.
//
// This is the ONLY part of Munafa that touches the network. All reorder and
// markdown numbers are computed client-side in engine.js; this call just
// turns them into a plain-language recommendation, in the shop owner's
// chosen language.
//
// Uses Google's Gemini API free tier (no billing required) instead of a
// paid provider — same client contract as before (POST {product, analysis,
// language} -> { recommendation }), so nothing in app.js changes at all.

var LANGUAGES = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  te: "Telugu",
  ta: "Tamil"
};

var GEMINI_MODEL = "gemini-flash-lite-latest"; // rolling alias — Google points it at the current lite model, so retirements don't 404 us again

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  var body = req.body || {};
  var product = body.product;
  var analysis = body.analysis;
  var language = LANGUAGES[body.language] || "English";

  if (!product || !analysis) {
    res.status(400).json({ error: "Missing product or analysis in request body" });
    return;
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set on the server. Add it in Vercel → Project Settings → Environment Variables." });
    return;
  }

  var markdownLine = analysis.markdown && analysis.markdown.needed
    ? "Yes - suggested " + analysis.markdown.markdownPct + "% off. At the current sales pace only about " +
      analysis.markdown.projectedSales + " of the " + product.currentStock + " units on hand will sell before expiry, " +
      "risking roughly Rs." + analysis.spoilageRiskRupees + " in spoilage."
    : "No, current stock is on pace to sell through before expiry.";

  var prompt =
    "You are Munafa, an inventory decision copilot for a small Indian kirana/grocery shop owner.\n" +
    "Given the numbers below for ONE product, write a short, plain-language recommendation (2-4 sentences) " +
    "the owner can act on right now. Use rupees and units. If a markdown is suggested, state the exact % and why " +
    "(spoilage risk). If a reorder is due, state the quantity. Avoid technical terms like \"newsvendor\" or " +
    "\"critical ratio\" - explain the trade-off in plain business terms (money lost to spoilage vs money lost to " +
    "running out).\n\n" +
    "Product: " + product.name + "\n" +
    "Current stock: " + product.currentStock + " units\n" +
    "Days until expiry: " + product.daysToExpiry + "\n" +
    "Average daily sales (last 14 days): " + Number(analysis.dailyMean).toFixed(1) + " units\n" +
    "Cost per unit: Rs." + product.unitCost + ", Sell price per unit: Rs." + product.sellPrice + "\n" +
    "Suggested next reorder-up-to level: " + analysis.orderUpToLevel + " units\n" +
    "Markdown needed: " + markdownLine + "\n\n" +
    "Write the recommendation in " + language + ". Use simple, everyday words a shopkeeper would use. " +
    "Keep all amounts as digits with the ₹ sign (e.g. ₹120) and quantities as digits.\n" +
    "Reply with ONLY the recommendation text. No preamble, no headers, no markdown formatting.";

  try {
    var apiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!apiRes.ok) {
      var errText = await apiRes.text();
      res.status(apiRes.status).json({ error: "Gemini API error", detail: errText });
      return;
    }

    var data = await apiRes.json();
    var candidate = (data.candidates || [])[0];
    var part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    var text = part && typeof part.text === "string" ? part.text.trim() : "";
    res.status(200).json({ recommendation: text || "No recommendation returned." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reach Gemini API", detail: String((err && err.message) || err) });
  }
};
