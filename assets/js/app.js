// ==========================================
// App Bootstrap (NO BUSINESS LOGIC)
// ==========================================

import { loadAllData } from "./core/fetchData.js";
import { renderSummarySale } from "./summary/summarySale.js";

async function initApp() {
  try {
    const data = await loadAllData();

    // Expose globally (read-only usage)
    window.APP_DATA = data;

    // -------------------------------
    // Render Summary 1 ONLY
    // -------------------------------
    renderSummarySale(data);

    console.log("🚀 Demand Planning App Ready");
  } catch (error) {
    console.error("❌ App failed to load:", error.message);
    alert("Data loading failed. Please check Google Sheet structure.");
  }
}

initApp();
