// ==========================================
// Google Sheet Fetch + Header Validation
// ==========================================

import { CONFIG } from "../config.js";

const BASE_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=`;

// -------------------------------
// Utility: CSV → JSON
// -------------------------------
function parseCSV(csvText) {
  const rows = csvText.trim().split("\n").map(r =>
    r.split(",").map(v => v.replace(/^"|"$/g, "").trim())
  );

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return { headers, dataRows };
}

// -------------------------------
// Utility: Header Validation
// -------------------------------
function validateHeaders(sheetName, actual, expected) {
  const mismatch =
    actual.length !== expected.length ||
    actual.some((h, i) => h !== expected[i]);

  if (mismatch) {
    console.error(`❌ Header mismatch in ${sheetName}`);
    console.error("Expected:", expected);
    console.error("Found:", actual);
    throw new Error(`Header validation failed for sheet: ${sheetName}`);
  }
}

// -------------------------------
// Fetch Single Sheet
// -------------------------------
async function fetchSheet(sheetKey, expectedHeaders) {
  const sheetName = CONFIG.SHEETS[sheetKey];
  const url = BASE_URL + encodeURIComponent(sheetName);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${sheetName}`);
  }

  const csvText = await response.text();
  const { headers, dataRows } = parseCSV(csvText);

  validateHeaders(sheetName, headers, expectedHeaders);

  const records = dataRows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });

  return records;
}

// -------------------------------
// MAIN DATA FETCH (GLOBAL)
// -------------------------------
export async function loadAllData() {
  console.log("📥 Loading Google Sheet data...");

  const [
    saleData,
    stockData,
    styleStatusData,
    saleDaysData
  ] = await Promise.all([
    fetchSheet("SALE", CONFIG.EXPECTED_HEADERS.SALE),
    fetchSheet("STOCK", CONFIG.EXPECTED_HEADERS.STOCK),
    fetchSheet("STYLE_STATUS", CONFIG.EXPECTED_HEADERS.STYLE_STATUS),
    fetchSheet("SALE_DAYS", CONFIG.EXPECTED_HEADERS.SALE_DAYS)
  ]);

  // -------------------------------
  // GLOBAL TOTAL SALE DAYS (LOCKED)
  // -------------------------------
  const totalSaleDays = saleDaysData.reduce(
    (sum, row) => sum + Number(row["Days"] || 0),
    0
  );

  console.log("✅ Data loaded successfully");
  console.log("🧮 Total Sale Days:", totalSaleDays);

  return {
    sale: saleData,
    stock: stockData,
    styleStatus: styleStatusData,
    saleDays: saleDaysData,
    totalSaleDays
  };
}
