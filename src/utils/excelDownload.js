/**
 * Excel Download Utility
 * Functions to export data as Excel files
 */

import * as XLSX from 'xlsx';

/**
 * Convert array of arrays (rows) to Excel worksheet
 * @param {Array[]} data - Array of rows, where each row is an array of values
 * @param {string[]} headers - Array of column headers
 * @returns {Object} - XLSX worksheet object
 */
export const createWorksheet = (data, headers) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data with headers as first row
  const worksheetData = [headers, ...data];
  
  // Convert to worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  return workbook;
};

/**
 * Download data as Excel file
 * @param {Array[]} data - Array of rows
 * @param {string[]} headers - Column headers
 * @param {string} filename - Name of the file (without extension)
 */
export const downloadExcel = (data, headers, filename) => {
  try {
    // Validate inputs
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('No data to export');
      return;
    }
    
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      console.warn('No headers provided');
      return;
    }
    
    // Create workbook
    const workbook = createWorksheet(data, headers);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    // Download the file
    XLSX.writeFile(workbook, fullFilename);
    
    console.log(`✅ Excel file downloaded: ${fullFilename}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error downloading Excel file:', error);
    return false;
  }
};


/**
 * Download reconciliation summary as Excel file
 * @param {Object} stats - Reconciliation statistics
 * @param {Object} results - Full reconciliation results
 * @param {string} filename - Name of the file
 */
export const downloadReconciliationSummary = (stats, results, filename) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create summary worksheet
    const summaryData = [
      ['Reconciliation Summary'],
      [''],
      ['Total Company Rows', stats.totalCompanyRows],
      ['Total Bank Rows', stats.totalBankRows],
      ['Total Rows', stats.totalCompanyRows + stats.totalBankRows],
      [''],
      ['Classified Company Rows', stats.classifiedCompanyRows],
      ['Classified Bank Rows', stats.classifiedBankRows],
      ['Total Classified', stats.classifiedCompanyRows + stats.classifiedBankRows],
      [''],
      ['Matched Pairs', stats.matchedPairs],
      ['Unmatched Company', stats.unmatchedCompanyRows],
      ['Unmatched Bank', stats.unmatchedBankRows],
      ['Total Unmatched', stats.unmatchedCompanyRows + stats.unmatchedBankRows],
      [''],
      ['Match Rate', `${stats.matchRate}%`],
      [''],
      ['Generated on', new Date().toLocaleString()],
    ];
    
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
    
    // Add detailed data sheets
    if (results.matchedCompany && results.matchedCompany.length > 0) {
      const matchedCompanyWorksheet = XLSX.utils.aoa_to_sheet([
        ['Matched Company Transactions'],
        [''],
        ...results.matchedCompany
      ]);
      XLSX.utils.book_append_sheet(workbook, matchedCompanyWorksheet, "Matched Company");
    }
    
    if (results.matchedBank && results.matchedBank.length > 0) {
      const matchedBankWorksheet = XLSX.utils.aoa_to_sheet([
        ['Matched Bank Transactions'],
        [''],
        ...results.matchedBank
      ]);
      XLSX.utils.book_append_sheet(workbook, matchedBankWorksheet, "Matched Bank");
    }
    
    if (results.unmatchedCompany && results.unmatchedCompany.length > 0) {
      const unmatchedCompanyWorksheet = XLSX.utils.aoa_to_sheet([
        ['Unmatched Company Transactions'],
        [''],
        ...results.unmatchedCompany
      ]);
      XLSX.utils.book_append_sheet(workbook, unmatchedCompanyWorksheet, "Unmatched Company");
    }
    
    if (results.unmatchedBank && results.unmatchedBank.length > 0) {
      const unmatchedBankWorksheet = XLSX.utils.aoa_to_sheet([
        ['Unmatched Bank Transactions'],
        [''],
        ...results.unmatchedBank
      ]);
      XLSX.utils.book_append_sheet(workbook, unmatchedBankWorksheet, "Unmatched Bank");
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    // Download the file
    XLSX.writeFile(workbook, fullFilename);
    
    console.log(`✅ Reconciliation summary Excel file downloaded: ${fullFilename}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error downloading reconciliation summary:', error);
    return false;
  }
};
