// ==========================================
// App Bootstrap (NO BUSINESS LOGIC)
// ==========================================

import { loadAllData } from "./core/fetchData.js";

async function initApp() {
  try {
    const data = await loadAllData();

    // Expose globally (READ-ONLY usage)
    window.APP_DATA = data;

    console.log("🚀 Demand Planning App Ready");
  } catch (error) {
    console.error("❌ App failed to load:", error.message);
    alert("Data loading failed. Please check Google Sheet structure.");
  }
}

initApp();
