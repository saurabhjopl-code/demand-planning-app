// ==========================================
// App Bootstrap + Filter UI Wiring
// ==========================================

import { loadAllData } from "./core/fetchData.js";
import {
  applyFilters,
  setFilter,
  setStyleSearch
} from "./core/filters.js";

import { renderSummarySale } from "./summary/summarySale.js";
import { renderSummaryStock } from "./summary/summaryStock.js";
import { renderSummarySCBand } from "./summary/summarySCBand.js";
import { renderSummarySize } from "./summary/summarySize.js";
import { renderSummaryRemark } from "./summary/summaryRemark.js";
import { renderSummaryCategory } from "./summary/summaryCategory.js";

let RAW_DATA = null;

// -------------------------------
// Render All Summaries
// -------------------------------
function renderAll(filteredData) {
  renderSummarySale(filteredData);
  renderSummaryStock(filteredData);
  renderSummarySCBand(filteredData);
  renderSummarySize(filteredData);
  renderSummaryRemark(filteredData);
  renderSummaryCategory(filteredData);
}

// -------------------------------
// Populate Filter Dropdowns
// -------------------------------
function populateFilters(data) {
  const monthSet = new Set();
  const fcSet = new Set();
  const categorySet = new Set();
  const remarkSet = new Set();
  const styleSet = new Set();

  data.sale.forEach(r => {
    monthSet.add(r["Month"]);
    fcSet.add(r["FC"]);
    styleSet.add(r["Style ID"]);
  });

  data.styleStatus.forEach(r => {
    categorySet.add(r["Category"]);
    remarkSet.add(r["Company Remark"]);
  });

  fillSelect("filter-month", [...monthSet]);
  fillSelect("filter-fc", [...fcSet]);
  fillSelect("filter-category", [...categorySet]);
  fillSelect("filter-remark", [...remarkSet]);

  window.__STYLE_IDS__ = [...styleSet];
}

function fillSelect(id, values) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = "";
  values.sort().forEach(v => {
    if (v) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      el.appendChild(opt);
    }
  });
}

// -------------------------------
// Attach UI Events
// -------------------------------
function attachFilterEvents() {
  const monthEl = document.getElementById("filter-month");
  const fcEl = document.getElementById("filter-fc");
  const catEl = document.getElementById("filter-category");
  const remarkEl = document.getElementById("filter-remark");
  const styleInput = document.getElementById("style-search");

  monthEl.addEventListener("change", () => {
    setFilter("Month", [...monthEl.selectedOptions].map(o => o.value));
    rerender();
  });

  fcEl.addEventListener("change", () => {
    setFilter("FC", [...fcEl.selectedOptions].map(o => o.value));
    rerender();
  });

  catEl.addEventListener("change", () => {
    setFilter("Category", [...catEl.selectedOptions].map(o => o.value));
    rerender();
  });

  remarkEl.addEventListener("change", () => {
    setFilter("CompanyRemark", [...remarkEl.selectedOptions].map(o => o.value));
    rerender();
  });

  styleInput.addEventListener("input", e => {
    setStyleSearch(e.target.value);
    rerender();
  });
}

// -------------------------------
// Re-render Pipeline
// -------------------------------
function rerender() {
  const filtered = applyFilters(RAW_DATA);
  renderAll(filtered);
}

// -------------------------------
// Init
// -------------------------------
async function initApp() {
  try {
    RAW_DATA = await loadAllData();

    populateFilters(RAW_DATA);
    attachFilterEvents();

    rerender();

    console.log("🚀 Filters wired successfully");
  } catch (err) {
    console.error(err);
    alert("Failed to load data");
  }
}

initApp();
