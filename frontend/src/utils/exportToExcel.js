import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Load base64 logo helper (fetches /logo.jpg from public folder)
const getLogoBase64 = async () => {
  try {
    const response = await fetch('/logo.jpg');
    if (!response.ok) throw new Error('Logo fetch failed');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Logo fetch failed, continuing without logo:', error);
    return null;
  }
};

// Check if a column should be calculated/totaled
const isColumnCalculable = (key, colIdx, numericColumns) => {
  if (!numericColumns[colIdx]) return false;
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes('id') ||
    lowerKey.includes('phone') ||
    lowerKey.includes('contact') ||
    lowerKey.includes('date') ||
    lowerKey.includes('code') ||
    lowerKey.includes('index') ||
    lowerKey.includes('mobile') ||
    lowerKey.includes('number')
  ) {
    return false;
  }
  return true;
};

// Helper to check and parse numeric values
const getNumericColumns = (keys, data) => {
  const numericColumns = [];
  keys.forEach((key) => {
    let isNumeric = true;
    let hasNumbers = false;
    data.forEach((row) => {
      const val = row[key];
      if (val !== null && val !== undefined && val !== '') {
        hasNumbers = true;
        const cleanStr = String(val).replace(/[₹,%\s]/g, '').trim();
        const num = Number(cleanStr);
        if (isNaN(num)) {
          isNumeric = false;
        }
      }
    });
    numericColumns.push(isNumeric && hasNumbers);
  });
  return numericColumns;
};

// Dynamic summary data generator based on filename and data
const getSummaryData = (data, fileName) => {
  const name = fileName.toLowerCase();
  const summary = [];

  // Site Income Report
  if (name.includes('site_income') || name.includes('income_report')) {
    let totalIncome = 0;
    const sites = {};
    data.forEach(row => {
      const amt = Number(String(row['Amount Received (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalIncome += amt;
      const site = row['Site / Project'];
      if (site) sites[site] = (sites[site] || 0) + amt;
    });
    summary.push(['Total Entries', data.length]);
    summary.push(['Total Income Received', 'Rs. ' + totalIncome.toLocaleString('en-IN')]);
    summary.push(['Unique Projects', Object.keys(sites).length]);
    Object.entries(sites).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([site, amt]) => {
      summary.push([site, 'Rs. ' + amt.toLocaleString('en-IN')]);
    });
  }
  // Labour Finance Summary
  else if (name.includes('labour_finance')) {
    let totalWage = 0, totalPaid = 0, totalPending = 0, cleared = 0;
    data.forEach(row => {
      totalWage    += Number(String(row['Total Wage Incurred (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPaid    += Number(String(row['Amount Paid (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPending += Number(String(row['Amount Pending (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      if (String(row['Status'] || '').toLowerCase() === 'clear') cleared++;
    });
    summary.push(['Total Workers', data.length]);
    summary.push(['Cleared Workers', cleared]);
    summary.push(['Pending Workers', data.length - cleared]);
    summary.push(['Total Wage Incurred', 'Rs. ' + totalWage.toLocaleString('en-IN')]);
    summary.push(['Total Paid', 'Rs. ' + totalPaid.toLocaleString('en-IN')]);
    summary.push(['Total Pending', 'Rs. ' + totalPending.toLocaleString('en-IN')]);
  }
  // Material Finance Overview
  else if (name.includes('material_finance')) {
    let totalPurchaseCost = 0, totalDistValue = 0, totalProfit = 0;
    const materialTotals = {};
    data.forEach(row => {
      const matName = String(row['Material Name'] || '');
      const purchaseCost = Number(String(row['Total Purchase Cost (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      const distValue = Number(String(row['Distributed Value (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      const profit = Number(String(row['Profit / Difference (Rs.)'] || 0).replace(/[^\d.-]/g, '')) || 0;
      totalPurchaseCost += purchaseCost;
      totalDistValue += distValue;
      totalProfit += profit;
      if (matName) {
        if (!materialTotals[matName]) materialTotals[matName] = { purchaseCost: 0, distValue: 0 };
        materialTotals[matName].purchaseCost += purchaseCost;
        materialTotals[matName].distValue += distValue;
      }
    });
    summary.push(['Total Materials', Object.keys(materialTotals).length]);
    summary.push(['Total Batches/Entries', data.length]);
    summary.push(['Total Purchase Cost', 'Rs. ' + totalPurchaseCost.toLocaleString('en-IN')]);
    summary.push(['Total Distributed Value', 'Rs. ' + totalDistValue.toLocaleString('en-IN')]);
    summary.push(['Net Profit / Difference', 'Rs. ' + totalProfit.toLocaleString('en-IN')]);
    Object.entries(materialTotals).forEach(([mat, vals]) => {
      summary.push([mat + ' - Purchase Cost', 'Rs. ' + vals.purchaseCost.toLocaleString('en-IN')]);
      summary.push([mat + ' - Distributed', 'Rs. ' + vals.distValue.toLocaleString('en-IN')]);
    });
  }
  // Projects Report
  else if (name.includes('projects_report')) {
    let totalBudget = 0, totalCollected = 0, totalToReceive = 0, totalSpent = 0;
    let activeCount = 0, completedCount = 0;
    data.forEach(row => {
      totalBudget    += Number(String(row['Total Budget (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalCollected += Number(String(row['Amount Collected (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalToReceive += Number(String(row['Amount to Receive (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalSpent     += Number(String(row['Amount Spent (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      const status = String(row['Status'] || '').toLowerCase();
      if (status === 'active') activeCount++;
      if (status === 'completed') completedCount++;
    });
    summary.push(['Total Projects', data.length]);
    summary.push(['Active Projects', activeCount]);
    summary.push(['Completed Projects', completedCount]);
    summary.push(['Total Budget', 'Rs. ' + totalBudget.toLocaleString('en-IN')]);
    summary.push(['Total Collected', 'Rs. ' + totalCollected.toLocaleString('en-IN')]);
    summary.push(['Total to Receive', 'Rs. ' + totalToReceive.toLocaleString('en-IN')]);
    summary.push(['Total Spent', 'Rs. ' + totalSpent.toLocaleString('en-IN')]);
  }
  // Daily Attendance Logs
  else if (name.includes('daily_attendance') || name.includes('attendance_log')) {
    let totalDays = 0, totalWage = 0, totalPaid = 0, totalPending = 0;
    const uniqueWorkers = new Set();
    const sites = new Set();
    data.forEach(row => {
      const status = String(row['Attendance Status'] || '');
      const workTime = String(row['Work Time'] || '');
      if (status === 'Present') {
        totalDays += workTime === 'Full Day' ? 1 : workTime === 'Half Day' ? 0.5 : workTime === 'Overtime' ? 1.5 : (parseFloat(workTime) || 0);
      }
      totalWage    += Number(String(row['Calculated Wage (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPaid    += Number(String(row['Paid (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPending += Number(String(row['Pending (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      if (row['Worker Name']) uniqueWorkers.add(row['Worker Name']);
      if (row['Site / Project'] && row['Site / Project'] !== '-') sites.add(row['Site / Project']);
    });
    summary.push(['Total Records', data.length]);
    summary.push(['Unique Workers', uniqueWorkers.size]);
    if (sites.size > 0 && sites.size <= 3) summary.push(['Site(s)', Array.from(sites).join(', ')]);
    summary.push(['Total Days Worked', totalDays]);
    summary.push(['Total Wage Incurred', 'Rs. ' + totalWage.toLocaleString('en-IN')]);
    summary.push(['Total Paid', 'Rs. ' + totalPaid.toLocaleString('en-IN')]);
    summary.push(['Total Pending', 'Rs. ' + totalPending.toLocaleString('en-IN')]);
  }
  // Monthly Labour Summary
  else if (name.includes('monthly_summary') || (name.includes('labour') && name.includes('summary'))) {
    let periodLabel = '';
    const rangeMatch = fileName.match(/(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})/);
    const monthMatch = fileName.match(/(\d{4}-\d{2})(?!-\d{2})/);
    if (rangeMatch) {
      periodLabel = rangeMatch[1] + '  to  ' + rangeMatch[2];
    } else if (monthMatch) {
      const parts = monthMatch[1].split('-');
      periodLabel = new Date(Number(parts[0]), Number(parts[1]) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    }
    let totalWage = 0, totalPaid = 0, totalPending = 0;
    const roles = {};
    data.forEach(row => {
      totalWage    += Number(String(row['Total Earned (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPaid    += Number(String(row['Paid (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPending += Number(String(row['Pending (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      const role = String(row['Role'] || '').trim();
      if (role && role !== '-') roles[role] = (roles[role] || 0) + 1;
    });
    if (periodLabel) summary.push(['Report Period', periodLabel]);
    summary.push(['Total Workers', data.length]);
    summary.push(['Total Wage Incurred', 'Rs. ' + totalWage.toLocaleString('en-IN')]);
    summary.push(['Total Paid', 'Rs. ' + totalPaid.toLocaleString('en-IN')]);
    summary.push(['Total Pending', 'Rs. ' + totalPending.toLocaleString('en-IN')]);
    Object.keys(roles).forEach(r => summary.push([r + 's', roles[r]]));
  }
  // Workers Master Report
  else if (name.includes('workers_master') || name.includes('labour_report')) {
    let active = 0;
    const roles = {};
    let totalDailyWage = 0;
    data.forEach(row => {
      if (String(row['Status'] || '').toLowerCase() === 'active') active++;
      const role = String(row['Role'] || '').trim();
      if (role) roles[role] = (roles[role] || 0) + 1;
      totalDailyWage += Number(String(row['Daily Rate (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
    });
    summary.push(['Total Labours', data.length]);
    summary.push(['Active Labours', active]);
    summary.push(['Inactive Labours', data.length - active]);
    if (totalDailyWage > 0 && data.length > 0) summary.push(['Avg Daily Rate', 'Rs. ' + Math.round(totalDailyWage / data.length).toLocaleString('en-IN')]);
    Object.keys(roles).forEach(r => summary.push([r + 's', roles[r]]));
  }
  // Project Labour Cost filter
  else if (name.includes('project_labour')) {
    let totalWage = 0, totalPaid = 0, totalPending = 0, totalDays = 0;
    const uniqueWorkers = new Set();
    let siteName = '';
    data.forEach(row => {
      totalWage    += Number(String(row['Wage Incurred (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPaid    += Number(String(row['Paid (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalPending += Number(String(row['Pending (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      const wt = String(row['Work Time'] || '');
      totalDays += wt === 'Full Day' ? 1 : wt === 'Half Day' ? 0.5 : wt === 'Overtime' ? 1.5 : 0;
      if (row['Worker Name']) uniqueWorkers.add(row['Worker Name']);
      if (row['Site / Project'] && !siteName) siteName = row['Site / Project'];
    });
    if (siteName) summary.push(['Site / Project', siteName]);
    summary.push(['Total Entries', data.length]);
    summary.push(['Unique Workers', uniqueWorkers.size]);
    summary.push(['Total Days Logged', totalDays]);
    summary.push(['Total Wage Incurred', 'Rs. ' + totalWage.toLocaleString('en-IN')]);
    summary.push(['Total Paid', 'Rs. ' + totalPaid.toLocaleString('en-IN')]);
    summary.push(['Total Pending', 'Rs. ' + totalPending.toLocaleString('en-IN')]);
  }
  // Material Stock / Detailed
  else if (name.includes('material') && (name.includes('stock') || name.includes('detailed'))) {
    let totalAvailable = 0, totalPurchased = 0, totalPurchaseValue = 0, totalCurrentValue = 0;
    let lowStockCount = 0, outOfStockCount = 0;
    const materialBatchCounts = {};
    const materialAvailable = {};
    data.forEach(row => {
      const available = Number(String(row['Available Stock'] || row['Stock Available'] || 0).replace(/[^\d.]/g, '')) || 0;
      const purchased = Number(String(row['Purchased Qty'] || 0).replace(/[^\d.]/g, '')) || 0;
      const rate = Number(String(row['Purchase Rate (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      const matName = String(row['Material Name'] || '').split('(')[0].trim();
      totalAvailable += available;
      totalPurchased += purchased;
      totalPurchaseValue += purchased * rate;
      totalCurrentValue  += available * rate;
      if (available <= 0) outOfStockCount++;
      else if (available < 50) lowStockCount++;
      if (matName) {
        materialBatchCounts[matName] = (materialBatchCounts[matName] || 0) + 1;
        materialAvailable[matName] = (materialAvailable[matName] || 0) + available;
      }
    });
    summary.push(['Total Material Types', Object.keys(materialBatchCounts).length]);
    summary.push(['Total Batches', data.length]);
    summary.push(['Total Purchased Qty', totalPurchased]);
    summary.push(['Total Available Stock', totalAvailable]);
    summary.push(['Total Purchase Value', 'Rs. ' + totalPurchaseValue.toLocaleString('en-IN')]);
    summary.push(['Current Stock Value', 'Rs. ' + totalCurrentValue.toLocaleString('en-IN')]);
    if (lowStockCount > 0) summary.push(['Low Stock Batches', lowStockCount]);
    if (outOfStockCount > 0) summary.push(['Out of Stock Batches', outOfStockCount]);
    Object.entries(materialAvailable).forEach(function(e) {
      summary.push([e[0] + ' - Available', e[1]]);
    });
    Object.entries(materialBatchCounts).filter(function(e) { return e[1] > 1; })
      .forEach(function(e) { summary.push([e[0] + ' - Batches', e[1]]); });
  }
  // Material Usage Logs
  else if (name.includes('material') && name.includes('usage')) {
    let totalQty = 0, totalValue = 0;
    const sites = new Set(), materials = {};
    data.forEach(row => {
      totalQty   += Number(String(row['Quantity Distributed'] || row['Quantity Used'] || 0).replace(/[^\d.]/g, '')) || 0;
      totalValue += Number(String(row['Total Distributed Amount (Rs.)'] || 0).replace(/[^\d.]/g, '')) || 0;
      if (row['Project / Site'] && row['Project / Site'] !== '-') sites.add(row['Project / Site']);
      const mat = row['Material Name'];
      if (mat) materials[mat] = (materials[mat] || 0) + (Number(String(row['Quantity Distributed'] || 0).replace(/[^\d.]/g, '')) || 0);
    });
    summary.push(['Total Entries', data.length]);
    summary.push(['Unique Materials', Object.keys(materials).length]);
    summary.push(['Unique Sites', sites.size]);
    summary.push(['Total Qty Distributed', totalQty]);
    if (totalValue > 0) summary.push(['Total Distribution Value', 'Rs. ' + totalValue.toLocaleString('en-IN')]);
    Object.entries(materials).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([mat, qty]) => {
      summary.push([mat + ' - Qty Used', qty]);
    });
  }
  // Finance / Income / Expense (generic)
  else if (name.includes('finance') || name.includes('income') || name.includes('expense') || name.includes('spent')) {
    let totalInflow = 0, totalOutflow = 0;
    data.forEach(row => {
      const amount = Number(
        String(row['Amount Received (Rs.)'] || row['Total Amount (Rs.)'] || row['Total Purchase Cost (Rs.)'] || row['amount'] || 0).replace(/[^\d.]/g, '')
      ) || 0;
      if (name.includes('income')) totalInflow += amount;
      else totalOutflow += amount;
    });
    if (totalInflow > 0) summary.push(['Total Income', 'Rs. ' + totalInflow.toLocaleString('en-IN')]);
    if (totalOutflow > 0) summary.push(['Total Expenses', 'Rs. ' + totalOutflow.toLocaleString('en-IN')]);
    if (totalInflow > 0 && totalOutflow > 0) {
      summary.push(['Net Balance', 'Rs. ' + (totalInflow - totalOutflow).toLocaleString('en-IN')]);
    }
  }

  return summary;
};
// Inject CSS styles for the export modal
const injectModalStyles = () => {
  if (document.getElementById('export-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'export-modal-styles';
  style.innerHTML = `
    .export-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(31, 27, 24, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 99999;
      animation: exportFadeIn 0.2s ease-out;
    }
    .export-modal-card {
      background-color: #ffffff;
      border-radius: 16px;
      width: 90%;
      max-width: 460px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
      padding: 1.5rem;
      border: 1px solid #e4dec8;
      box-sizing: border-box;
      animation: exportScaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .export-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .export-modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #2b231f;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }
    .export-modal-subtitle {
      font-size: 0.85rem;
      color: #786c66;
      margin: 0 0 1.25rem 0;
      font-family: 'Inter', sans-serif;
    }
    .export-options-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .export-option-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 1.1rem;
      border: 2px solid #e4dec8;
      border-radius: 12px;
      background-color: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;
    }
    .export-option-btn:hover {
      border-color: #f4511e;
      background-color: #fbe9e7;
      transform: translateY(-1px);
    }
    .export-option-icon {
      background-color: #fcfbfa;
      border-radius: 8px;
      width: 44px;
      height: 44px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      box-shadow: inset 0 0 0 1px #e4dec8;
      transition: all 0.2s ease;
    }
    .export-option-btn:hover .export-option-icon {
      background-color: #ffffff;
      box-shadow: inset 0 0 0 1px #ffab91;
    }
    .export-option-text {
      flex: 1;
    }
    .export-option-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #2b231f;
      margin: 0 0 0.15rem 0;
    }
    .export-option-desc {
      font-size: 0.75rem;
      color: #786c66;
      margin: 0;
    }
    .export-modal-actions {
      display: flex;
      justify-content: flex-end;
    }
    .export-cancel-btn {
      padding: 0.65rem 1.25rem;
      background-color: #f6f3ee;
      border: 1px solid #e4dec8;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      color: #4e342e;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: 'Inter', sans-serif;
    }
    .export-cancel-btn:hover {
      background-color: #efebe9;
      border-color: #d7ccc8;
    }
    @keyframes exportFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes exportScaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
};

// Generate Beautiful Excel report via ExcelJS
const generateExcelReport = async (data, fileName, keys, headers, logoBase64) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Display gridlines
  worksheet.views = [{ showGridLines: true }];

  // Add brand logo
  if (logoBase64) {
    try {
      // Strip the data: prefix, ExcelJS needs raw base64
      const rawB64 = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
      const imageId = workbook.addImage({
        base64: rawB64,
        extension: 'jpeg',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.1, row: 0.2 },
        ext: { width: 72, height: 72 },
        editAs: 'absolute'
      });
    } catch (e) {
      console.warn('Logo attach to Excel failed:', e);
    }
  }

  // Branding text
  worksheet.getRow(2).getCell(3).value = 'SHREERAM';
  worksheet.getRow(2).getCell(3).font = { name: 'Inter', size: 16, bold: true, color: { argb: 'FFF4511E' } }; // Saffron

  worksheet.getRow(3).getCell(3).value = 'GOVT. CONTRACTOR & BUILDER';
  worksheet.getRow(3).getCell(3).font = { name: 'Inter', size: 9, italic: true, bold: true, color: { argb: 'FF4E342E' } }; // Brown

  worksheet.getRow(4).getCell(3).value = `${fileName.replace(/_/g, ' ')}`;
  worksheet.getRow(4).getCell(3).font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FF2B231F' } };

  worksheet.getRow(5).getCell(3).value = `Report Date: ${new Date().toLocaleDateString('en-IN')}`;
  worksheet.getRow(5).getCell(3).font = { name: 'Inter', size: 9, color: { argb: 'FF786C66' } };

  // Generate and render summary tables
  const summaryData = getSummaryData(data, fileName);
  let tableHeaderRowIndex = 8;
  
  if (summaryData.length > 0) {
    const titleRow = worksheet.getRow(8);
    titleRow.getCell(1).value = 'SUMMARY OVERVIEW';
    titleRow.getCell(1).font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FF4E342E' } };
    worksheet.mergeCells('A8:B8');
    
    summaryData.forEach((item, idx) => {
      const rowIdx = 9 + idx;
      const sRow = worksheet.getRow(rowIdx);
      sRow.getCell(1).value = item[0];
      sRow.getCell(2).value = item[1];
      
      sRow.getCell(1).font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FF786C66' } };
      sRow.getCell(2).font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FF2B231F' } };
      
      sRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F6F0' } };
      sRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F6F0' } };
      
      sRow.getCell(1).border = { left: { style: 'thin', color: { argb: 'FFE4DEC8' } }, top: { style: 'thin', color: { argb: 'FFE4DEC8' } }, bottom: { style: 'thin', color: { argb: 'FFE4DEC8' } } };
      sRow.getCell(2).border = { right: { style: 'thin', color: { argb: 'FFE4DEC8' } }, top: { style: 'thin', color: { argb: 'FFE4DEC8' } }, bottom: { style: 'thin', color: { argb: 'FFE4DEC8' } } };
    });
    
    tableHeaderRowIndex = 9 + summaryData.length + 2; // Add spacer row
  }

  // Setup Column Widths
  const colWidths = headers.map((h, i) => {
    let maxLength = h.length;
    data.forEach((row) => {
      const val = row[keys[i]];
      if (val !== null && val !== undefined) {
        const len = String(val).length;
        if (len > maxLength) maxLength = len;
      }
    });
    return Math.max(maxLength + 4, 13);
  });

  colWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  // Table Headers
  const headerRow = worksheet.getRow(tableHeaderRowIndex);
  headerRow.values = headers;
  headerRow.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF4511E' }, // Saffron Header
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 26;

  // Header Border
  headers.forEach((_, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF4E342E' } },
      bottom: { style: 'medium', color: { argb: 'FF4E342E' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  // Numerical column array
  const numericColumns = getNumericColumns(keys, data);

  // Table Data Rows
  let currentRowIndex = tableHeaderRowIndex + 1;
  data.forEach((row, dataIdx) => {
    const rowData = keys.map((key) => row[key]);
    const excelRow = worksheet.getRow(currentRowIndex);
    excelRow.values = rowData;
    excelRow.height = 20;

    keys.forEach((key, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      const val = rowData[colIdx];

      cell.font = { name: 'Inter', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE4DEC8' } },
        bottom: { style: 'thin', color: { argb: 'FFE4DEC8' } },
        left: { style: 'thin', color: { argb: 'FFE4DEC8' } },
        right: { style: 'thin', color: { argb: 'FFE4DEC8' } }
      };

      // Zebra striping
      if (dataIdx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F6F0' } // Light warm gray
        };
      }

      // Auto styling based on data type
      if (typeof val === 'number') {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        const header = headers[colIdx];
        if (
          header.includes('₹') ||
          header.toLowerCase().includes('cost') ||
          header.toLowerCase().includes('wage') ||
          header.toLowerCase().includes('amount') ||
          header.toLowerCase().includes('budget') ||
          header.toLowerCase().includes('rate') ||
          header.toLowerCase().includes('spent') ||
          header.toLowerCase().includes('profit')
        ) {
          cell.numFmt = '₹#,##0';
        } else {
          cell.numFmt = '#,##0.##';
        }
      } else if (val && String(val).match(/^\d{4}-\d{2}-\d{2}$/)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });

    currentRowIndex++;
  });

  // Calculation / Totals Row at the bottom
  const totalsRow = worksheet.getRow(currentRowIndex);
  totalsRow.height = 22;

  const totalsData = keys.map((key, colIdx) => {
    if (colIdx === 0) return 'Total';
    if (isColumnCalculable(key, colIdx, numericColumns)) {
      let sum = 0;
      data.forEach((row) => {
        const val = row[key];
        if (val !== null && val !== undefined && val !== '') {
          const num = typeof val === 'number' ? val : Number(String(val).replace(/[₹,%\s]/g, '').trim());
          if (!isNaN(num)) sum += num;
        }
      });
      return sum;
    }
    return '';
  });

  totalsRow.values = totalsData;

  keys.forEach((key, colIdx) => {
    const cell = totalsRow.getCell(colIdx + 1);
    cell.font = { name: 'Inter', size: 10, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEBE7' } // Light Saffron Tint
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFF4511E' } },
      bottom: { style: 'double', color: { argb: 'FFF4511E' } },
      left: { style: 'thin', color: { argb: 'FFE4DEC8' } },
      right: { style: 'thin', color: { argb: 'FFE4DEC8' } }
    };

    if (colIdx === 0) {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    } else if (isColumnCalculable(key, colIdx, numericColumns)) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      const header = headers[colIdx];
      if (
        header.includes('₹') ||
        header.toLowerCase().includes('cost') ||
        header.toLowerCase().includes('wage') ||
        header.toLowerCase().includes('amount') ||
        header.toLowerCase().includes('budget') ||
        header.toLowerCase().includes('rate') ||
        header.toLowerCase().includes('spent') ||
        header.toLowerCase().includes('profit')
      ) {
        cell.numFmt = '₹#,##0';
      } else {
        cell.numFmt = '#,##0.##';
      }
    } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    }
  });

  // Save the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${fileName}_${dateStr}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate Beautiful PDF report via jsPDF & AutoTable
const generatePdfReport = async (data, fileName, keys, headers, logoBase64) => {
  const orientation = headers.length > 5 ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Draw corporate header — white background with logo
  const orange  = [245, 130, 32];
  const dark    = [25, 25, 35];

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 44, 'F');
  doc.setFillColor(...orange);
  doc.rect(0, 0, 5, 44, 'F');

  // Logo
  if (logoBase64) {
    try {
      // jsPDF needs raw base64 without the data: prefix
      const rawB64 = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
      doc.addImage(rawB64, 'JPEG', 8, 4, 36, 36);
    } catch (e) {
      console.warn('Logo attach to PDF failed:', e);
    }
  }

  // Company name & tagline
  const textStartX = logoBase64 ? 48 : 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...dark);
  doc.text('SHREERAM CONSTRUCTION', textStartX, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 70, 20);
  doc.text('Civil Construction & Government Contractor', textStartX, 20);

  // Report title below name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const cleanTitle = fileName.replace(/_/g, ' ');
  doc.text(cleanTitle, textStartX, 28);

  // Contact info — right side
  const rightX = pageWidth - 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 80);
  doc.text('Mob: +91 7720900336', rightX, 10, { align: 'right' });
  doc.text('GST: 27CZPPG0505C1ZR',  rightX, 15, { align: 'right' });
  doc.text('shreeramconstruction1111@gmail.com', rightX, 20, { align: 'right' });
  doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, rightX, 25, { align: 'right' });

  // Orange divider
  doc.setDrawColor(...orange);
  doc.setLineWidth(1);
  doc.line(0, 44, pageWidth, 44);

  // Summary logic
  const summaryData = getSummaryData(data, fileName);
  let tableStartY = 52;

  if (summaryData.length > 0) {
    // Clean currency symbol in summary box
    summaryData.forEach(item => {
      if (typeof item[1] === 'string' && item[1].includes('\u20b9')) {
        item[1] = item[1].replace(/\u20b9/g, 'Rs.');
      }
    });

    autoTable(doc, {
      startY: 52,
      head: [['Summary Metrics', 'Count / Value']],
      body: summaryData,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        font: 'helvetica',
        cellPadding: 1.5,
        lineColor: [228, 222, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 45, 80],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 45, halign: 'right' }
      },
      margin: { left: 10, right: 10 }
    });
    tableStartY = doc.lastAutoTable.finalY + 8;
  }

  // Clean headers for PDF to replace '₹' with 'Rs.'
  const pdfHeaders = headers.map(h => h.replace(/₹/g, 'Rs.'));

  // Prepare table data and clean/replace any currency symbols
  const tableRows = data.map((row) => {
    return keys.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return val.name || JSON.stringify(val);
      
      // Clean string values containing ₹
      if (typeof val === 'string' && val.includes('₹')) {
        return val.replace(/₹/g, 'Rs.');
      }
      return val;
    });
  });

  const numericColumns = getNumericColumns(keys, data);

  // Calculate totals
  const totalsRowData = keys.map((key, colIdx) => {
    if (colIdx === 0) return 'Total';
    if (isColumnCalculable(key, colIdx, numericColumns)) {
      let sum = 0;
      data.forEach((row) => {
        const val = row[key];
        if (val !== null && val !== undefined && val !== '') {
          const num = typeof val === 'number' ? val : Number(String(val).replace(/[₹,%\s]/g, '').trim());
          if (!isNaN(num)) sum += num;
        }
      });
      const header = headers[colIdx];
      if (
        header.includes('₹') ||
        header.toLowerCase().includes('cost') ||
        header.toLowerCase().includes('wage') ||
        header.toLowerCase().includes('amount') ||
        header.toLowerCase().includes('budget') ||
        header.toLowerCase().includes('rate') ||
        header.toLowerCase().includes('spent') ||
        header.toLowerCase().includes('profit')
      ) {
        return `Rs. ${sum.toLocaleString('en-IN')}`;
      }
      return sum.toLocaleString('en-IN');
    }
    return '';
  });

  // Format numeric columns in the body
  const formattedTableRows = tableRows.map((row, rIdx) => {
    return row.map((val, colIdx) => {
      const originalVal = data[rIdx][keys[colIdx]];
      if (typeof originalVal === 'number') {
        const header = headers[colIdx];
        if (
          header.includes('₹') ||
          header.toLowerCase().includes('cost') ||
          header.toLowerCase().includes('wage') ||
          header.toLowerCase().includes('amount') ||
          header.toLowerCase().includes('budget') ||
          header.toLowerCase().includes('rate') ||
          header.toLowerCase().includes('spent') ||
          header.toLowerCase().includes('profit')
        ) {
          return `Rs. ${originalVal.toLocaleString('en-IN')}`;
        }
        return originalVal.toLocaleString('en-IN');
      }
      return val;
    });
  });

  // Render main data table
  autoTable(doc, {
    startY: tableStartY,
    head: [pdfHeaders],
    body: formattedTableRows,
    foot: [totalsRowData],
    theme: 'striped',
    headStyles: {
      fillColor: [244, 81, 30], // Saffron header
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [255, 235, 231], // Light Saffron
      textColor: [43, 35, 31],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [43, 35, 31]
    },
    alternateRowStyles: {
      fillColor: [249, 246, 240] // Warm off-white
    },
    styles: {
      font: 'helvetica',
      cellPadding: 2.2,
      valign: 'middle',
      lineColor: [228, 222, 200],
      lineWidth: 0.1
    },
    columnStyles: keys.reduce((acc, key, colIdx) => {
      if (isColumnCalculable(key, colIdx, numericColumns)) {
        acc[colIdx] = { halign: 'right' };
      } else if (key.toLowerCase().includes('date')) {
        acc[colIdx] = { halign: 'center' };
      } else {
        acc[colIdx] = { halign: 'left' };
      }
      return acc;
    }, {}),
    margin: { left: 15, right: 15, bottom: 20 },
    didDrawPage: (drawData) => {
      // Footer page numbering
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 108, 102);
      const pageText = `Page ${doc.internal.getNumberOfPages()}`;
      doc.text(pageText, pageWidth - 15 - doc.getTextWidth(pageText), pageHeight - 10);
      doc.text('Shreeram Construction Management System', 15, pageHeight - 10);
    }
  });

  const dateFileStr = new Date().toISOString().split('T')[0];
  doc.save(`${fileName}_${dateFileStr}.pdf`);
};

/**
 * Universal export utility offering Excel and PDF formatting with branding,
 * proper widths, headers, colors, totals, and calculations.
 * 
 * @param {Array<Object>} data - The dataset to export.
 * @param {String} fileName - Desired base filename.
 * @param {Object} [columnMap] - Key-to-label column mapping.
 */
export const exportToExcel = (data, fileName = 'Export_Report', columnMap = null) => {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Setup keys and human readable headers
  const keys = columnMap ? Object.keys(columnMap) : Object.keys(data[0]);
  const headers = columnMap ? Object.values(columnMap) : keys;

  // Make sure CSS is injected
  injectModalStyles();

  // Create Modal Overlay
  const overlay = document.createElement('div');
  overlay.className = 'export-modal-overlay';

  // Modal Content Card
  const card = document.createElement('div');
  card.className = 'export-modal-card';

  // Modal Title Header
  const readableTitle = fileName.replace(/_/g, ' ');
  card.innerHTML = `
    <div class="export-modal-header">
      <h3 class="export-modal-title">Export Report</h3>
    </div>
    <p class="export-modal-subtitle">Select format to download the <strong>${readableTitle}</strong></p>
    <div class="export-options-list">
      <button class="export-option-btn" id="export-xlsx-btn">
        <div class="export-option-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f4511e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
            <line x1="10" y1="9" x2="9" y2="9"/>
          </svg>
        </div>
        <div class="export-option-text">
          <h4 class="export-option-name">Excel Spreadsheet (.xlsx)</h4>
          <p class="export-option-desc">Auto-fitted columns, totals, color-coded rows, and branded header.</p>
        </div>
      </button>
      <button class="export-option-btn" id="export-pdf-btn">
        <div class="export-option-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M12 18v-6"/>
            <path d="M8 15h8"/>
          </svg>
        </div>
        <div class="export-option-text">
          <h4 class="export-option-name">PDF Document (.pdf)</h4>
          <p class="export-option-desc">Print-ready page format with corporate logo, tables, and page numbers.</p>
        </div>
      </button>
    </div>
    <div class="export-modal-actions">
      <button class="export-cancel-btn" id="export-cancel-btn">Cancel</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Close helper
  const closeModal = () => {
    document.body.removeChild(overlay);
  };

  // Button Listeners
  document.getElementById('export-cancel-btn').addEventListener('click', closeModal);

  document.getElementById('export-xlsx-btn').addEventListener('click', async () => {
    closeModal();
    const logoBase64 = await getLogoBase64();
    await generateExcelReport(data, fileName, keys, headers, logoBase64);
  });

  document.getElementById('export-pdf-btn').addEventListener('click', async () => {
    closeModal();
    const logoBase64 = await getLogoBase64();
    await generatePdfReport(data, fileName, keys, headers, logoBase64);
  });
};
