// ===================================================
// Demand Planning App – V1.2.1 (STABLE FIX)
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

// ===================================================
// REPORT RENDERER (SAFE, DYNAMIC)
// ===================================================
async function renderActiveReport(filteredData) {
  const activeTab = document.querySelector(".tabs button.active");
  if (!activeTab) return;

  const report = activeTab.dataset.report;
  if (!report) return;

  try {
    if (report === "demand") {
      const module = await import("./reports/demandReport.js");
      module.renderDemandReport(filteredData);
    }

    // Future reports (safe placeholders)
    // else if (report === "overstock") { ... }

  } catch (err) {
    console.warn(`⚠️ Report "${report}" not loaded:`, err.message);
    document.querySelector(".tab-content").innerHTML =
      `<p style="padding:12px;color:#6b7280">
        Report not available yet.
      </p>`;
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

  toggle.onclick = () => dropdown.classList.toggle("open");

  menu.addEventListener("change", () => {
    const selected = [...menu.querySelectorAll("input:checked")].map(
      i => i.value
    );
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

  // Default tab = Demand (only if exists)
  if (tabs.length) tabs[0].classList.add("active");
}

// ===================================================
// INIT APP
// ===================================================
async function initApp() {
  try {
    RAW_DATA = await loadAllData();

    // Filters
    setupDropdown("Month", [...new Set(RAW_DATA.sale.map(r => r["Month"]))]);
    setupDropdown("FC", [...new Set(RAW_DATA.sale.map(r => r["FC"]))]);
    setupDropdown(
      "Category",
      [...new Set(RAW_DATA.styleStatus.map(r => r["Category"]))]
    );
    setupDropdown(
      "CompanyRemark",
      [...new Set(RAW_DATA.styleStatus.map(r => r["Company Remark"]))]
    );

    // Style Search
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

    setupTabs();
    rerender();

    console.log("✅ Demand Planning App V1.2.1 Loaded (Stable)");
  } catch (error) {
    console.error("❌ Init failed:", error);
    alert("Failed to load data");
  }
}

// ===================================================
initApp();
