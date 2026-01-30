// ==========================================
// Google Sheet Fetch + Header Validation
// ==========================================

import { CONFIG } from "../config.js";

const BASE_URL =
  `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=`;

function parseCSV(csvText) {
  const rows = csvText.trim().split("\n").map(r =>
    r.split(",").map(v => v.replace(/^"|"$/g, "").trim())
  );

  return {
    headers: rows[0],
    dataRows: rows.slice(1)
  };
}

function validateHeaders(sheetName, actual, expected) {
  if (
    actual.length !== expected.length ||
    actual.some((h, i) => h !== expected[i])
  ) {
    throw new Error(`Header validation failed for sheet: ${sheetName}`);
  }
}

async function fetchSheet(sheetKey, expectedHeaders) {
  const sheetName = CONFIG.SHEETS[sheetKey];
  const response = await fetch(BASE_URL + encodeURIComponent(sheetName));
  const csvText = await response.text();

  const { headers, dataRows } = parseCSV(csvText);
  validateHeaders(sheetName, headers, expectedHeaders);

  return dataRows.map(row => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

export async function loadAllData() {
  const [
    sale,
    stock,
    styleStatus,
    saleDays,
    sizeCount
  ] = await Promise.all([
    fetchSheet("SALE", CONFIG.EXPECTED_HEADERS.SALE),
    fetchSheet("STOCK", CONFIG.EXPECTED_HEADERS.STOCK),
    fetchSheet("STYLE_STATUS", CONFIG.EXPECTED_HEADERS.STYLE_STATUS),
    fetchSheet("SALE_DAYS", CONFIG.EXPECTED_HEADERS.SALE_DAYS),
    fetchSheet("SIZE_COUNT", CONFIG.EXPECTED_HEADERS.SIZE_COUNT) // ✅ ADDED
  ]);

  const totalSaleDays = saleDays.reduce(
    (sum, r) => sum + Number(r["Days"] || 0),
    0
  );

  return {
    sale,
    stock,
    styleStatus,
    saleDays,
    sizeCount, // ✅ AVAILABLE TO REPORTS
    totalSaleDays
  };
}
