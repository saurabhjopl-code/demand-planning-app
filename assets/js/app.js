// ===================================================
// Demand Planning App – V1.2 (LOCKED RESET POINT)
// ===================================================

// -------- Core --------
import { loadAllData } from "./core/fetchData.js";
import { applyFilters, setFilter, setStyleSearch } from "./core/filters.js";

// -------- Summaries --------
import { renderSummarySale } from "./summary/summarySale.js";
import { renderSummaryStock } from "./summary/summaryStock.js";
import { renderSummarySCBand } from "./summary/summarySCBand.js";
import { renderSummarySize } from "./summary/summarySize.js";
import { renderSummaryRemark } from "./summary/summaryRemark.js";
import { renderSummaryCategory } from "./summary/summaryCategory.js";

// -------- Reports --------
import { renderDemandReport } from "./reports/demandReport.js";
// (Overstock, Size Curve, Broken Size will be added later)

// ===================================================
// GLOBAL STATE
// ===================================================
let RAW_DATA = null;

// ===================================================
// RENDER HELPERS
// ===================================================
function renderAllSummaries(filteredData) {
  renderSummarySale(filteredData);
  renderSummaryStock(filteredData);
  renderSummarySCBand(filteredData);
  renderSummarySize(filteredData);
  renderSummaryRemark(filteredData);
  renderSummaryCategory(filteredData);
}

function renderActiveReport(filteredData) {
  const activeTab = document.querySelector(".tabs button.active");
  if (!activeTab) return;

  const report = activeTab.dataset.report;

  if (report === "demand") {
    renderDemandReport(filteredData);
  }
}

// ===================================================
// FILTER DROPDOWNS (CHECKBOX STYLE)
// ===================================================
function setupDropdown(filterKey, values) {
  const dropdown = document.querySelector(`[data-filter="${filterKey}"]`);
  if (!dropdown) return;

  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(".dropdown-menu");

  menu.innerHTML = "";

  values
    .filter(v => v)
    .sort()
    .forEach(v => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${v}"> ${v}`;
      menu.appendChild(label);
    });

  toggle.onclick = () => {
    dropdown.classList.toggle("open");
  };

  menu.addEventListener("change", () => {
    const selected = [
      ...menu.querySelectorAll("input:checked")
    ].map(i => i.value);

    setFilter(filterKey, selected);
    rerender();
  });
}

// ===================================================
// RERENDER PIPELINE
// ===================================================
function rerender() {
  const filteredData = applyFilters(RAW_DATA);
  renderAllSummaries(filteredData);
  renderActiveReport(filteredData);
}

// ===================================================
// TAB HANDLING
// ===================================================
function setupTabs() {
  const tabs = document.querySelectorAll(".tabs button");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      rerender();
    });
  });

  // Default tab
  tabs[0].classList.add("active");
}

// ===================================================
// INIT APP
// ===================================================
async function initApp() {
  try {
    RAW_DATA = await loadAllData();

    // -------------------------------
    // Setup Filters
    // -------------------------------
    setupDropdown(
      "Month",
      [...new Set(RAW_DATA.sale.map(r => r["Month"]))]
    );

    setupDropdown(
      "FC",
      [...new Set(RAW_DATA.sale.map(r => r["FC"]))]
    );

    setupDropdown(
      "Category",
      [...new Set(RAW_DATA.styleStatus.map(r => r["Category"]))]
    );

    setupDropdown(
      "CompanyRemark",
      [...new Set(RAW_DATA.styleStatus.map(r => r["Company Remark"]))]
    );

    // -------------------------------
    // Style ID Search
    // -------------------------------
    const styleInput = document.getElementById("style-search");
    const clearBtn = document.getElementById("clear-style-search");

    styleInput.addEventListener("input", e => {
      setStyleSearch(e.target.value);
      rerender();
    });

    clearBtn.addEventListener("click", () => {
      styleInput.value = "";
      setStyleSearch("");
      rerender();
    });

    // -------------------------------
    // Tabs
    // -------------------------------
    setupTabs();

    // -------------------------------
    // Initial Render
    // -------------------------------
    rerender();

    console.log("✅ Demand Planning App V1.2 Loaded Successfully");
  } catch (error) {
    console.error("❌ App Init Failed:", error);
    alert("Failed to load data");
  }
}

// ===================================================
initApp();
