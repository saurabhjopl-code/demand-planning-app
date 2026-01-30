// ================================
// Global Configuration (LOCKED + EXTENDED SAFELY)
// ================================

export const CONFIG = {
  SHEET_ID: "1kGUn-Sdp16NJB9rLjijrYnnSl9Jjrom5ZpYiTXFBZ1E",

  SHEETS: {
    SALE: "Sale",
    STOCK: "Stock",
    STYLE_STATUS: "Style Status",
    SALE_DAYS: "Sale Days",
    SIZE_COUNT: "Size Count" // ✅ ADDED (SAFE)
  },

  EXPECTED_HEADERS: {
    SALE: [
      "Month",
      "MP",
      "Account",
      "FC",
      "MP SKU",
      "Uniware SKU",
      "Style ID",
      "Size",
      "Units"
    ],

    STOCK: [
      "FC",
      "MP SKU",
      "Uniware SKU",
      "Style ID",
      "Size",
      "Units"
    ],

    STYLE_STATUS: [
      "Style ID",
      "Category",
      "Company Remark"
    ],

    SALE_DAYS: [
      "Month",
      "Days"
    ],

    SIZE_COUNT: [
      "Style ID",
      "Size Count"
    ]
  }
};
