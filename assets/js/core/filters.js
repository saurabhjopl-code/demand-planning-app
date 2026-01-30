// ===================================================
// Global Filter Engine (LOCKED + FIXED)
// Filters apply to Summaries + Reports
// Style ID works as SEARCH override
// ===================================================

const FILTER_STATE = {
  Month: [],
  FC: [],
  Category: [],
  CompanyRemark: [],
  StyleSearch: ""
};

// -------------------------------
// Setters
// -------------------------------
export function setFilter(key, values) {
  FILTER_STATE[key] = Array.isArray(values) ? values : [];
}

export function setStyleSearch(value) {
  FILTER_STATE.StyleSearch = value ? value.trim() : "";
}

// -------------------------------
// Core Filter Application
// -------------------------------
export function applyFilters(rawData) {
  const {
    sale,
    stock,
    styleStatus,
    saleDays,
    sizeCount,       // ✅ PRESERVE
    totalSaleDays
  } = rawData;

  // -------------------------------
  // STYLE SEARCH OVERRIDE MODE
  // -------------------------------
  if (FILTER_STATE.StyleSearch) {
    const styleId = FILTER_STATE.StyleSearch;

    return {
      sale: sale.filter(r => r["Style ID"] === styleId),
      stock: stock.filter(r => r["Style ID"] === styleId),
      styleStatus: styleStatus.filter(r => r["Style ID"] === styleId),
      saleDays,
      sizeCount,     // ✅ PRESERVE
      totalSaleDays
    };
  }

  // -------------------------------
  // Build Style Lookups
  // -------------------------------
  const styleCategoryMap = {};
  const styleRemarkMap = {};

  styleStatus.forEach(r => {
    styleCategoryMap[r["Style ID"]] = r["Category"];
    styleRemarkMap[r["Style ID"]] = r["Company Remark"];
  });

  // -------------------------------
  // Apply Sale Filters
  // -------------------------------
  const filteredSale = sale.filter(r => {
    if (
      FILTER_STATE.Month.length &&
      !FILTER_STATE.Month.includes(r["Month"])
    ) return false;

    if (
      FILTER_STATE.FC.length &&
      !FILTER_STATE.FC.includes(r["FC"])
    ) return false;

    const style = r["Style ID"];

    if (
      FILTER_STATE.Category.length &&
      !FILTER_STATE.Category.includes(styleCategoryMap[style])
    ) return false;

    if (
      FILTER_STATE.CompanyRemark.length &&
      !FILTER_STATE.CompanyRemark.includes(styleRemarkMap[style])
    ) return false;

    return true;
  });

  // -------------------------------
  // Apply Stock Filters
  // -------------------------------
  const filteredStock = stock.filter(r => {
    if (
      FILTER_STATE.FC.length &&
      !FILTER_STATE.FC.includes(r["FC"])
    ) return false;

    const style = r["Style ID"];

    if (
      FILTER_STATE.Category.length &&
      !FILTER_STATE.Category.includes(styleCategoryMap[style])
    ) return false;

    if (
      FILTER_STATE.CompanyRemark.length &&
      !FILTER_STATE.CompanyRemark.includes(styleRemarkMap[style])
    ) return false;

    return true;
  });

  return {
    sale: filteredSale,
    stock: filteredStock,
    styleStatus,
    saleDays,
    sizeCount,     // ✅ PRESERVE
    totalSaleDays
  };
}
