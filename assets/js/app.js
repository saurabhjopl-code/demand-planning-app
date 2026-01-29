// ===================================================
// Demand Planning App – STABLE RECOVERY VERSION
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

// ===================================================
let RAW_DATA = null;

// ===================================================
// ALWAYS RENDER SUMMARIES FROM RAW DATA (LOCKED)
// ===================================================
function renderAllSummaries() {
  renderSummarySale(RAW_DATA);
  renderSummaryStock(RAW_DATA);
  renderSummarySCBand(RAW_DATA);
  renderSummarySize(RAW_DATA);
  renderSummaryRemark(RAW_DATA);
  renderSummaryCategory(RAW_DATA);
}

// ===================================================
// REPORT RENDER (FILTERED DATA ONLY)
// ===================================================
function renderActiveReport() {
  const activeTab = document.querySelector(".tabs button.active");
  const container = document.querySelector(".tab-content");
  if (!activeTab || !container) return;

  const filteredData = applyFilters(RAW_DATA);
  container.innerHTML = "";

  if (activeTab.dataset.report === "demand") {
    renderDemandReport(filteredData);
  } else {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">
        Report not available yet.
      </p>`;
  }
}

// ===================================================
// FILTER DROPDOWNS (NON-BLOCKING)
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
    setFilter(filterKey, selected.length ? selected : null);
    renderActiveReport();
  });
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
      renderActiveReport();
    });
  });

  if (tabs.length) {
    tabs.forEach(t => t.classList.remove("active"));
    tabs[0].classList.add("active");
  }
}

// ===================================================
// INIT APP
// ===================================================
async function initApp() {
  try {
    RAW_DATA = await loadAllData();

    // ---------- FILTERS ----------
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

    // ---------- STYLE SEARCH ----------
    const styleInput = document.getElementById("style-search");
    const clearBtn = document.getElementById("clear-style-search");

    styleInput.addEventListener("input", e => {
      setStyleSearch(e.target.value || null);
      renderActiveReport();
    });

    clearBtn.addEventListener("click", () => {
      styleInput.value = "";
      setStyleSearch(null);
      renderActiveReport();
    });

    setupTabs();

    // 🔒 ALWAYS SHOW SUMMARIES
    renderAllSummaries();
    renderActiveReport();

    console.log("✅ Demand Planning App – RECOVERED & STABLE");
  } catch (err) {
    console.error("❌ App init failed:", err);
    alert("Failed to load data");
  }
}

initApp();
