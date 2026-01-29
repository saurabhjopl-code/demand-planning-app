// ===================================================
// Google Sheets Data Loader – STABLE VERSION
// ===================================================

// 🔴 IMPORTANT:
// Make sure your Google Sheet is PUBLIC:
// Share → Anyone with link → Viewer

const SHEET_ID = "1kGUn-Sdp16NJB9rLjijrYnnSl9Jjrom5ZpYiTXFBZ1E";

// Sheet GIDs (DO NOT CHANGE)
const SHEETS = {
  sale: "0",
  stock: "1505539096",
  styleStatus: "2062234014",
  saleDays: "1957355061"
};

// Utility: CSV fetch
async function fetchCSV(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed CSV fetch for GID ${gid}`);
  }
  return await res.text();
}

// Utility: CSV → JSON
function csvToJSON(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());

  return lines.map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ? values[i].trim() : "";
    });
    return obj;
  });
}

// ===================================================
// LOAD ALL DATA
// ===================================================
export async function loadAllData() {
  console.log("📥 Loading Google Sheets data...");

  const [saleCSV, stockCSV, styleCSV, daysCSV] = await Promise.all([
    fetchCSV(SHEETS.sale),
    fetchCSV(SHEETS.stock),
    fetchCSV(SHEETS.styleStatus),
    fetchCSV(SHEETS.saleDays)
  ]);

  const sale = csvToJSON(saleCSV);
  const stock = csvToJSON(stockCSV);
  const styleStatus = csvToJSON(styleCSV);
  const saleDays = csvToJSON(daysCSV);

  // Calculate total sale days (GLOBAL)
  const totalSaleDays = saleDays.reduce(
    (sum, r) => sum + Number(r["Days"] || 0),
    0
  );

  const data = {
    sale,
    stock,
    styleStatus,
    saleDays,
    totalSaleDays
  };

  // 🔎 DEBUG PROOF
  console.log("✅ Data Loaded:");
  console.log("Sale rows:", sale.length);
  console.log("Stock rows:", stock.length);
  console.log("Style rows:", styleStatus.length);
  console.log("Total Sale Days:", totalSaleDays);

  return data;
}
