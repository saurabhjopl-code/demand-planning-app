// ===================================================
// Demand Planning App – V1.3.4 (BOOTSTRAP SAFE)
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
// VALIDATION
// ===================================================
function validateData(data) {
  if (!data) return false;
  if (!Array.isArray(data.sale)) return false;
  if (!Array.isArray(data.stock)) return false;
  if (!Array.isArray(data.styleStatus)) return false;
  if (typeof data.totalSaleDays !== "number") return false;
  return true;
}

// ===================================================
// SUMMARY RENDER
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
// REPORT RENDER
// ===================================================
function renderActiveReport(filteredData) {
  const activeTab = document.querySelector(".tabs button.active");
  const container = document.querySelector(".tab-content");
  if (!activeTab || !container) return;

  const report = activeTab.dataset.report;
  container.innerHTML = "";

  if (report === "demand") {
    renderDemandReport(filteredData);
  } else {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">
        Report not available yet.
      </p>`;
  }
}

// ===================================================
// FILTER DROPDOWNS
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
  if (!RAW_DATA) return;
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

  if (tabs.length) {
    tabs.forEach(t => t.classList.remove("active"));
    tabs[0].classList.add("active"); // Demand default
  }
}

// ===================================================
// INIT APP
// ===================================================
async function initApp() {
  try {
    const data = await loadAllData();

    if (!validateData(data)) {
      console.error("❌ Invalid data structure:", data);
      alert("Data structure error. Check console.");
      return;
    }

    RAW_DATA = data;

    // ---------------- Filters ----------------
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

    // ---------------- Style Search ----------------
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

    console.log("✅ Demand Planning App V1.3.4 Loaded Successfully");
  } catch (err) {
    console.error("❌ loadAllData failed:", err);
    alert("Failed to load data");
  }
}

// ===================================================
initApp();
