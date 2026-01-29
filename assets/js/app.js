// ==========================================
// App Bootstrap (NO BUSINESS LOGIC)
// ==========================================

import { loadAllData } from "./core/fetchData.js";
import { renderSummarySale } from "./summary/summarySale.js";
import { renderSummaryStock } from "./summary/summaryStock.js";
import { renderSummarySCBand } from "./summary/summarySCBand.js";

async function initApp() {
  try {
    const data = await loadAllData();

    // Expose globally (read-only)
    window.APP_DATA = data;

    // -------------------------------
    // Render Summaries
    // -------------------------------
    renderSummarySale(data);     // Summary 1
    renderSummaryStock(data);    // Summary 2
    renderSummarySCBand(data);   // Summary 3

    console.log("🚀 Demand Planning App Ready");
  } catch (error) {
    console.error("❌ App failed to load:", error.message);
    alert("Data loading failed. Please check Google Sheet structure.");
  }
}

initApp();
