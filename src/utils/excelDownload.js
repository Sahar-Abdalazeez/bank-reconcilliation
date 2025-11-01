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
      return;
    }
    
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return;
    }
    
    // Create workbook
    const workbook = createWorksheet(data, headers);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    // Download the file
    XLSX.writeFile(workbook, fullFilename);
    
    return true;
    
  } catch (error) {
    return false;
  }
};
