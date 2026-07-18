# 📈 Munafa — The Kirana Counter Copilot

> **Empowering small shop owners to know exactly what to reorder and what to mark down — before it spoils, not after.**

## 🔗 Live Demo

([Click Here to View Website](https://munafa-pevwps8gm-mrhumblewithafriend-6222s-projects.vercel.app/))

---

## 📌 The Problem

Small *kirana* (mom-and-pop grocery) shop owners in India lose a significant percentage of their working capital to inventory inefficiencies:
1. **Wastage:** Perishable stock spoils on shelves because it doesn't sell in time.
2. **Stockouts:** High-demand items run out of stock, causing lost sales and customer frustration.

Traditional ERPs and inventory software are too complex, expensive, and require a constant internet connection. **Munafa** resolves this with an offline-first, mobile-first copilot that does the optimization math right on the owner's phone.

---

## ✨ Key Features

- **🎯 Intelligent Reordering (Newsvendor Model):** Calculates optimal order quantities using margin-aware probability curves rather than simple historical averages.
- **🏷️ Smart Markdowns (Elasticity-based):** Projects sales trajectory against expiration dates and calculates the exact discount percentage needed to move stock before it spoils.
- **💰 Budget Allocator (Knapsack Solver):** When cash is tight, enter your exact budget (e.g. ₹5,000) and the built-in Knapsack algorithm prioritizes restocking the highest-value items first.
- **🎤 Evening Voice Tally:** Allows busy shop owners to speak their daily sales ("milk ten, bread five") to update stock counts, powered by Gemini API.
- **💬 One-Tap WhatsApp Ordering:** Generates itemized order details and launches WhatsApp to send them directly to suppliers with one tap.
- **🌐 Offline-First & Multi-Lingual:** Runs entirely locally on device memory (`localStorage`). Supports English, Hindi (हिन्दी), Telugu (తెలుగు), and Tamil (தமிழ்).

---

## 🛠️ Technical Architecture

### 1. Reorder Logic (Newsvendor Optimization)
Instead of restocking to flat averages, Munafa uses a standard **Single-Period Inventory Model**. It computes underage cost ($C_u = \text{Price} - \text{Cost}$) and overage cost ($C_o = \text{Cost} - \text{SalvageValue}$) to establish a critical ratio:
$$\text{Critical Ratio} = \frac{C_u}{C_u + C_o}$$
Using a rational approximation of the inverse normal CDF (Acklam’s Algorithm) implemented in vanilla JS, it calculates the exact safety stock buffer size matching the shop's actual risk of lost sales.

### 2. Budget Allocation (0/1 Knapsack)
If a shop's aggregate optimal reorder cost exceeds the owner's cash-on-hand, Munafa models every single unit of stock as a candidate in a 0/1 knapsack. It runs a dynamic programming solver (falling back to a greedy heuristic for huge catalogs) to maximize the expected value protected under the budget constraints.

---

## 🌐 Production Deployment (Vercel)

The project is structured to deploy directly as a serverless application on Vercel:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Run deployment from the `munafa` directory:
   ```bash
   vercel --prod
   ```
3. Set your environment variables in the Vercel Dashboard Settings under **Environment Variables**.

---

### ⚡ One-Click Deploy Placeholder

You can set up a direct deployment button to allow anyone to deploy this app to their Vercel account instantly. Swap out `YOUR_GITHUB_USERNAME` in the link below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_GITHUB_USERNAME%2FMunafa&root-directory=munafa&env=GEMINI_API_KEY,TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN,TWILIO_FROM_NUMBER)
