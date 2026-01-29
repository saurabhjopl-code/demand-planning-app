import { loadAllData } from "./core/fetchData.js";
import { applyFilters, setFilter, setStyleSearch } from "./core/filters.js";

import { renderSummarySale } from "./summary/summarySale.js";
import { renderSummaryStock } from "./summary/summaryStock.js";
import { renderSummarySCBand } from "./summary/summarySCBand.js";
import { renderSummarySize } from "./summary/summarySize.js";
import { renderSummaryRemark } from "./summary/summaryRemark.js";
import { renderSummaryCategory } from "./summary/summaryCategory.js";

let RAW_DATA;

function renderAll(data) {
  renderSummarySale(data);
  renderSummaryStock(data);
  renderSummarySCBand(data);
  renderSummarySize(data);
  renderSummaryRemark(data);
  renderSummaryCategory(data);
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
  renderAll(applyFilters(RAW_DATA));
}

async function init() {
  RAW_DATA = await loadAllData();

  setupDropdown("Month", [...new Set(RAW_DATA.sale.map(r => r["Month"]))]);
  setupDropdown("FC", [...new Set(RAW_DATA.sale.map(r => r["FC"]))]);
  setupDropdown("Category", [...new Set(RAW_DATA.styleStatus.map(r => r["Category"]))]);
  setupDropdown("CompanyRemark", [...new Set(RAW_DATA.styleStatus.map(r => r["Company Remark"]))]);

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

  rerender();
}

init();
