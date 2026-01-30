import { loadAllData } from "./core/fetchData.js";
import { applyFilters, setFilter, setStyleSearch } from "./core/filters.js";

import { renderSummarySale } from "./summary/summarySale.js";
import { renderSummaryStock } from "./summary/summaryStock.js";
import { renderSummarySCBand } from "./summary/summarySCBand.js";
import { renderSummarySize } from "./summary/summarySize.js";
import { renderSummaryRemark } from "./summary/summaryRemark.js";
import { renderSummaryCategory } from "./summary/summaryCategory.js";

import { renderDemandReport } from "./reports/demandReport.js";
import { renderOverstockReport } from "./reports/overstockReport.js";
import { renderSizeCurveReport } from "./reports/sizeCurveReport.js";
import { renderBrokenSizeReport } from "./reports/brokenSizeReport.js";

let RAW_DATA;

function renderAll(data) {
  renderSummarySale(data);
  renderSummaryStock(data);
  renderSummarySCBand(data);
  renderSummarySize(data);
  renderSummaryRemark(data);
  renderSummaryCategory(data);
}

function getActiveReportButton() {
  let active = document.querySelector(".report-tabs button.active");

  // 🔑 FORCE DEFAULT ACTIVE TAB
  if (!active) {
    active = document.querySelector('.report-tabs button[data-report="demand"]');
    if (active) active.classList.add("active");
  }

  return active;
}

function renderReport(data) {
  const active = getActiveReportButton();
  const container = document.getElementById("report-content");
  if (!active || !container) return;

  container.innerHTML = "";

  const report = active.dataset.report;

  if (report === "demand") {
    renderDemandReport(data);
  } else if (report === "overstock") {
    renderOverstockReport(data);
  } else if (report === "sizecurve") {
    renderSizeCurveReport(data);
  } else if (report === "brokensize") {
    renderBrokenSizeReport(data);
  } else {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">Coming soon</p>`;
  }
}

function setupReportTabs() {
  const tabs = document.querySelectorAll(".report-tabs button");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderReport(applyFilters(RAW_DATA));
    });
  });
}

function setupDropdown(key, values) {
  const dropdown = document.querySelector(`[data-filter="${key}"]`);
  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(".dropdown-menu");

  menu.innerHTML = "";

  values.sort().forEach(v => {
    if (!v) return;
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${v}"> ${v}`;
    menu.appendChild(label);
  });

  toggle.onclick = () => dropdown.classList.toggle("open");

  menu.addEventListener("change", () => {
    const selected = [...menu.querySelectorAll("input:checked")].map(
      i => i.value
    );
    setFilter(key, selected);
    rerender();
  });
}

function rerender() {
  const filtered = applyFilters(RAW_DATA);
  renderAll(filtered);
  renderReport(filtered);
}

async function init() {
  RAW_DATA = await loadAllData();

  setupDropdown("Month", [...new Set(RAW_DATA.sale.map(r => r["Month"]))]);
  setupDropdown("FC", [...new Set(RAW_DATA.sale.map(r => r["FC"]))]);
  setupDropdown(
    "Category",
    [...new Set(RAW_DATA.styleStatus.map(r => r["Category"]))]
  );
  setupDropdown(
    "CompanyRemark",
    [...new Set(RAW_DATA.styleStatus.map(r => r["Company Remark"])))]
  );

  const styleInput = document.getElementById("style-search");
  const clearBtn = document.getElementById("clear-style-search");

  styleInput.addEventListener("input", e => {
    setStyleSearch(e.target.value);
    rerender();
  });

  clearBtn.onclick = () => {
    styleInput.value = "";
    setStyleSearch("");
    rerender();
  };

  setupReportTabs();

  // 🔑 GUARANTEED FIRST RENDER
  rerender();
}

init();
