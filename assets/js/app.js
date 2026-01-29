// ==========================================
// App Bootstrap + Filter Wiring
// ==========================================

import { loadAllData } from "./core/fetchData.js";
import { applyFilters } from "./core/filters.js";

import { renderSummarySale } from "./summary/summarySale.js";
import { renderSummaryStock } from "./summary/summaryStock.js";
import { renderSummarySCBand } from "./summary/summarySCBand.js";
import { renderSummarySize } from "./summary/summarySize.js";
import { renderSummaryRemark } from "./summary/summaryRemark.js";
import { renderSummaryCategory } from "./summary/summaryCategory.js";

let RAW_DATA = null;

function renderAll(filteredData) {
  renderSummarySale(filteredData);
  renderSummaryStock(filteredData);
  renderSummarySCBand(filteredData);
  renderSummarySize(filteredData);
  renderSummaryRemark(filteredData);
  renderSummaryCategory(filteredData);
}

async function initApp() {
  try {
    RAW_DATA = await loadAllData();

    const filteredData = applyFilters(RAW_DATA);
    renderAll(filteredData);

    console.log("🚀 Demand Planning App Ready with Filter Engine");
  } catch (err) {
    console.error(err);
    alert("Failed to load data");
  }
}

initApp();

// Expose for next step (UI wiring)
window.__APP__ = {
  rerender: () => {
    const filteredData = applyFilters(RAW_DATA);
    renderAll(filteredData);
  }
};
