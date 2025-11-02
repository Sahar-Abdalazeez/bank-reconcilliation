/**
 * Reconciliation Engine
 * Matches company and bank transactions based on configured rules
 */

/**
 * Normalize text for matching
 */
export const normalizeText = (text) => {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/^0+/, '') // Remove leading zeros
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
};

/**
 * Normalize check number to 8 digits with leading zeros
 * If check number is 9 digits AND leftmost digit is zero, remove it to make 8 digits
 * All other lengths are padded to 8 digits
 * 
 * Example: "030000043" (9 digits, leftmost is 0) → "30000043" (8 digits)
 */
export const normalizeCheckNumber = (checkNumber) => {
  if (!checkNumber) return '';
  
  // Convert to string and remove all non-numeric characters
  const cleanNumber = String(checkNumber).replace(/[^0-9]/g, '');
  
  // If it's empty after cleaning, return empty
  if (!cleanNumber) return '';
  
  // If it's 9 digits AND the leftmost digit is zero, remove it to make it 8 digits
  // Example: "030000043" → "30000043"
  if (cleanNumber.length === 9 && cleanNumber[0] === '0') {
    return cleanNumber.substring(1); // Remove first character (leftmost zero)
  }
  
  // For all other lengths, pad with leading zeros to make it 8 digits
  return cleanNumber.padStart(8, '0');
};

/**
 * Check if a pattern matches text based on match type
 */
export const checkPatternMatch = (text, pattern) => {
  if (!text || !pattern) return false;
  
  // Normalize text: lowercase and normalize spaces (replace multiple spaces with single space)
  const textStr = String(text)
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();               // Remove leading/trailing spaces
  
  const patternStr = typeof pattern === 'string' ? pattern : pattern.pattern;
  const matchType = typeof pattern === 'string' ? 'startsWith' : pattern.matchType;
  
  // Normalize pattern: lowercase and normalize spaces
  const patternLower = patternStr
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();               // Remove leading/trailing spaces
  
  switch (matchType) {
    case 'startsWith':
      return textStr.startsWith(patternLower);
    case 'includes':
      return textStr.includes(patternLower);
    case 'both':
      return textStr.startsWith(patternLower) || textStr.includes(patternLower);
    default:
      return textStr.startsWith(patternLower);
  }
};

/**
 * Parse date from various formats (including Excel dates)
 */
export const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // If already a Date object
  if (dateValue instanceof Date) {
    if (!isNaN(dateValue.getTime())) {
      return dateValue;
    }
    return null;
  }
  
  // Handle Excel serial date numbers (if dateValue is a number)
  if (typeof dateValue === 'number') {
    // Excel dates start from January 1, 1900
    // Excel incorrectly treats 1900 as a leap year, so we adjust
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try parsing string date
  const dateStr = String(dateValue).trim();
  if (!dateStr) return null;
  
  // Try manual parsing first for more control
  const parts = dateStr.split(/[/.-\s]+/);
  if (parts.length === 3) {
    const part1 = parseInt(parts[0].trim(), 10);
    const part2 = parseInt(parts[1].trim(), 10);
    const part3 = parseInt(parts[2].trim(), 10);
    
    if (isNaN(part1) || isNaN(part2) || isNaN(part3)) {
      // Fall through to native parsing
    } else {
      // Check if it's a valid date in DD/MM/YYYY format
      if (part1 >= 1 && part1 <= 31 && part2 >= 1 && part2 <= 12 && part3 >= 1900 && part3 <= 2100) {
        const dateDDMM = new Date(part3, part2 - 1, part1);
        if (!isNaN(dateDDMM.getTime()) && 
            dateDDMM.getDate() === part1 && 
            dateDDMM.getMonth() === part2 - 1 && 
            dateDDMM.getFullYear() === part3) {
          return dateDDMM;
        }
      }
      
      // Check if it's a valid date in MM/DD/YYYY format
      if (part1 >= 1 && part1 <= 12 && part2 >= 1 && part2 <= 31 && part3 >= 1900 && part3 <= 2100) {
        const dateMMDD = new Date(part3, part1 - 1, part2);
        if (!isNaN(dateMMDD.getTime()) && 
            dateMMDD.getMonth() === part1 - 1 && 
            dateMMDD.getDate() === part2 && 
            dateMMDD.getFullYear() === part3) {
          return dateMMDD;
        }
      }
    }
  }
  
  // Try parsing YYYY-MM-DD format (ISO format)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Fallback to native Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    // Validate the parsed date is reasonable (not way off)
    const year = date.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return date;
    }
  }
  
  return null;
};

/**
 * Compare dates with tolerance
 * For reconciliation: allows dates to differ by up to toleranceDays in either direction
 * @param {*} companyDate - Company date
 * @param {*} bankDate - Bank date
 * @param {*} toleranceDays - Maximum days difference allowed (e.g., 4 days)
 */
export const compareDatesWithTolerance = (companyDate, bankDate, toleranceDays) => {
  const d1 = parseDate(companyDate);
  const d2 = parseDate(bankDate);
  
  if (!d1 || !d2) {
    // If parsing failed, return false
    return false;
  }
  
  // Calculate difference in milliseconds, then convert to days
  const diffMs = d2.getTime() - d1.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  // Allow dates to differ by up to toleranceDays in either direction (symmetric tolerance)
  return Math.abs(daysDiff) <= toleranceDays;
};

/**
 * Clean and parse numeric value, removing commas and formatting
 * Returns the cleaned numeric value, or null if not a valid number
 */
const cleanNumericValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  // Remove commas and other non-numeric characters (except decimal point and minus sign)
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num) ? num : null;
};

/**
 * Check if a single matching column matches between two rows
 */
export const checkColumnMatch = (companyRow, bankRow, columnConfig, companyHeaders, bankHeaders, rootDateTolerance = 0, useRootDateTolerance = false) => {
  // Get values using column names and headers
  const companyValue = getValueByColumnName(companyRow, companyHeaders, columnConfig.companyColumn);
  const bankValue = getValueByColumnName(bankRow, bankHeaders, columnConfig.bankColumn);
  
  // If columns not configured, skip
  if (!columnConfig.companyColumn || !columnConfig.bankColumn) {
    return true; // Don't fail on unconfigured columns
  }
  
  // Handle empty values - BOTH must have values to match
  if (!companyValue || !bankValue) {
    // Only log first few empty value cases to avoid spam
    return false;
  }
  
  switch (columnConfig.matchType) {
    case 'exact': {
      // Try to compare as numbers first (handles commas, decimals, etc.)
      const n1 = cleanNumericValue(companyValue);
      const n2 = cleanNumericValue(bankValue);
      
      // If both are valid numbers, compare numerically (ignoring commas and formatting)
      if (n1 !== null && n2 !== null) {
        return n1 === n2;
      }
      
      // Otherwise, compare as strings
      return String(companyValue).trim() === String(bankValue).trim();
    }
      
    case 'numeric': {
      // Remove commas and other non-numeric characters (except decimal point and minus sign)
      const n1 = cleanNumericValue(companyValue);
      const n2 = cleanNumericValue(bankValue);
      
      // Both must be valid numbers and equal
      return n1 !== null && n2 !== null && n1 === n2;
    }
      
    case 'date': {
      // Check for column-level date tolerance first
      if (columnConfig.useDateTolerance && columnConfig.dateTolerance !== undefined) {
        return compareDatesWithTolerance(
          companyValue,
          bankValue,
          columnConfig.dateTolerance
        );
      }
      
      // Then check for root-level date tolerance
      if (useRootDateTolerance) {
        return compareDatesWithTolerance(
          companyValue,
          bankValue,
          rootDateTolerance
        );
      }
      
      // Exact date match
      const d1 = parseDate(companyValue);
      const d2 = parseDate(bankValue);
      
      if (!d1 || !d2) {
        // If parsing failed, try to compare as strings (might be Excel serial dates or formatted strings)
        return String(companyValue).trim() === String(bankValue).trim();
      }
      
      return d1.getTime() === d2.getTime();
    }
      
    case 'text': {
      // Check if this is a check number column based on column name or label
      const isCheckNumberColumn = 
        columnConfig.label?.toLowerCase().includes('check') ||
        columnConfig.companyColumn?.toLowerCase().includes('شيك') ||
        columnConfig.bankColumn?.toLowerCase().includes('check') ||
        columnConfig.bankColumn?.toLowerCase().includes('doc');
      
      // Normalize check numbers (removes leading zero from 9-digit numbers to make 8 digits, pads shorter ones)
      if (isCheckNumberColumn) {
        const normalizedCompany = normalizeCheckNumber(companyValue);
        const normalizedBank = normalizeCheckNumber(bankValue);
        
        return normalizedCompany === normalizedBank;
      }
      
      // For text fields, first try numeric comparison if both values are numeric (ignoring commas)
      const n1 = cleanNumericValue(companyValue);
      const n2 = cleanNumericValue(bankValue);
      if (n1 !== null && n2 !== null) {
        // Both are numeric, compare as numbers (ignoring commas and formatting)
        return n1 === n2;
      }
      
      // For non-numeric text fields, use normalize flag
      if (columnConfig.normalize) {
        return normalizeText(companyValue) === normalizeText(bankValue);
      }
      
      return String(companyValue).trim() === String(bankValue).trim();
    }
      
    default: {
      // For unknown match types, try numeric comparison first (ignoring commas)
      const n1 = cleanNumericValue(companyValue);
      const n2 = cleanNumericValue(bankValue);
      if (n1 !== null && n2 !== null) {
        return n1 === n2;
      }
      // Otherwise, compare as strings
      return String(companyValue).trim() === String(bankValue).trim();
    }
  }
};

/**
 * Check if all matching columns match between two rows
 */
export const checkAllColumnsMatch = (companyRow, bankRow, matchingColumns, companyHeaders, bankHeaders, rootDateTolerance = 0, useRootDateTolerance = false) => {
  if (!matchingColumns || matchingColumns.length === 0) {
    return false; // No matching columns configured
  }
  
  // All columns must match
  for (const columnConfig of matchingColumns) {
    const isMatch = checkColumnMatch(companyRow, bankRow, columnConfig, companyHeaders, bankHeaders, rootDateTolerance, useRootDateTolerance);
    if (!isMatch) {
      return false; // One column didn't match
    }
  }
  
  return true; // All columns matched!
};

/**
 * Get column index by header name
 */
const getColumnIndex = (headers, columnName) => {
  if (!headers || !columnName) return -1;
  return headers.indexOf(columnName);
};

/**
 * Get value from row by column name
 */
const getValueByColumnName = (row, headers, columnName) => {
  const index = getColumnIndex(headers, columnName);
  if (index === -1) return undefined;
  return row[index];
};

/**
 * Classify rows based on patterns
 */
export const classifyData = (data, headers, patterns, searchColumn, additionalFilters = null) => {
  if (!data || !patterns || !searchColumn) {
    return [];
  }
  
  // Find the column index for search column
  const searchColumnIndex = getColumnIndex(headers, searchColumn);
  if (searchColumnIndex === -1) {
    return [];
  }
  
  const classified = [];
  let debugCount = 0;
  let patternMatchCount = 0;
  let filterRejectCount = 0;
  
  for (const row of data) {
    const searchValue = row[searchColumnIndex];
    
    if (!searchValue) continue;
    
    // Check if any pattern matches
    let matches = false;
    for (const pattern of patterns) {
      if (checkPatternMatch(searchValue, pattern)) {
        matches = true;
        patternMatchCount++;
        break;
      }
    }
    
    if (matches) {
      // Apply additional filters if specified
      let passesFilters = true;
      
      if (additionalFilters && additionalFilters.length > 0) {
        for (const filter of additionalFilters) {
          const filterColumnIndex = getColumnIndex(headers, filter.columnName);
          if (filterColumnIndex === -1) continue;
          
          const filterValue = row[filterColumnIndex];
          
          // Check filter condition
          switch (filter.condition) {
            case 'has8Digits': {
              // Extract only digits and check if exactly 8 digits
              const digits = String(filterValue || '').replace(/[^0-9]/g, '');
              if (digits.length !== 8) {
                passesFilters = false;
              }
              break;
            }
            case 'hasValue': {
              // Check if column has any value
              if (!filterValue || String(filterValue).trim() === '') {
                passesFilters = false;
              }
              break;
            }
            case 'isEmpty': {
              // Check if column is empty
              if (filterValue && String(filterValue).trim() !== '') {
                passesFilters = false;
              }
              break;
            }
            case 'not8Digits': {
              // Exclude rows with exactly 8 digits (for outgoing transfers without check numbers)
              const digits = String(filterValue || '').replace(/[^0-9]/g, '');
              if (digits.length === 8) {
                passesFilters = false;
                filterRejectCount++;
              }
              break;
            }
            default:
              break;
          }
          
          if (!passesFilters) break;
        }
      }
      
      if (passesFilters) {
        classified.push(row);
      } 
    }
  }
  
  return classified;
};

/**
 * Find rows that DON'T match ANY classification type
 * 
 * Purpose:
 *   Find "leftover" rows that haven't been classified by any type
 *   Uses a SINGLE search column and checks against ALL patterns from ALL types
 * 
 * Algorithm:
 *   1. Collect ALL patterns from all types (company or bank)
 *   2. For each row, check the search column value against ALL patterns
 *   3. If the row doesn't match ANY pattern → It's unclassified
 * 
 * @param {Array} data - All data rows
 * @param {Array} headers - Column headers
 * @param {Object} allOtherTypes - All classification type configurations
 * @param {string} dataType - 'company' or 'bank'
 * @param {string} searchColumn - The column to check (e.g., "البيان" or "NARRITIVE")
 * @returns {Array} - Rows that don't match any classification type
 */
const findUnclassifiedRowsAdvanced = (data, headers, allOtherTypes, dataType, searchColumn) => {
  if (!data || data.length === 0) {
    return [];
  }
  
  // If no search column provided, return all rows as unclassified
  if (!searchColumn) {
    return data;
  }
  
  // Get the search column index
  const searchColumnIndex = getColumnIndex(headers, searchColumn);
  if (searchColumnIndex === -1) {
    return data;
  }
  
  // Collect ALL patterns from ALL types
  const allPatterns = [];
  
  for (const typeKey in allOtherTypes) {
    if (typeKey === 'unclassified') continue; // Skip unclassified itself
    
    const type = allOtherTypes[typeKey];
    const patterns = dataType === 'company' ? type.companyPatterns : type.bankPatterns;
    
    if (patterns && patterns.length > 0) {
      allPatterns.push(...patterns);
    }
  }
    
  const unclassified = [];
  
  // Check each row
  for (const row of data) {
    const searchValue = row[searchColumnIndex];
    
    if (!searchValue) {
      // Include rows with empty search values as unclassified
      unclassified.push(row);
      continue;
    }
    
    // Check if this row matches ANY pattern
    let matchesAnyPattern = false;
    for (const pattern of allPatterns) {
      if (checkPatternMatch(searchValue, pattern)) {
        matchesAnyPattern = true;
        break;
      }
    }
    
    // If it doesn't match any pattern, it's unclassified
    if (!matchesAnyPattern) {
      unclassified.push(row);
    }
  }
  
  return unclassified;
};

/**
 * Group classified rows by which pattern they matched
 * 
 * Purpose:
 *   Organize classified rows into groups based on the pattern that matched them
 *   Useful for bank-only types like Charges to see different charge types separately
 *   Also calculates sum of amounts for each group
 * 
 * @param {Array} classifiedRows - Array of classified rows
 * @param {Array} headers - Column headers
 * @param {Array} patterns - Array of patterns used for classification
 * @param {string} searchColumn - Column that was searched
 * @param {string} amountColumn - Column to sum (optional, e.g., "DEBIT")
 * @returns {Array} - Array of groups with pattern name, rows, and total amount
 * 
 * @example
 * // Returns:
 * [
 *   { pattern: "BANK CHARGES", rows: [...], totalAmount: 1250.50, count: 12 },
 *   { pattern: "COMMISSION", rows: [...], totalAmount: 850.00, count: 8 }
 * ]
 */
export const groupByPattern = (classifiedRows, headers, patterns, searchColumn, amountColumn = null) => {
  const searchColumnIndex = getColumnIndex(headers, searchColumn);
  if (searchColumnIndex === -1) return [];
  
  const amountColumnIndex = amountColumn ? getColumnIndex(headers, amountColumn) : -1;
  
  const groups = {};
  
  // Initialize groups for each pattern
  patterns.forEach(pattern => {
    const patternStr = typeof pattern === 'string' ? pattern : pattern.pattern;
    groups[patternStr] = {
      pattern: patternStr,
      matchType: typeof pattern === 'string' ? 'startsWith' : pattern.matchType,
      rows: [],
      totalAmount: 0,
      count: 0
    };
  });
  
  // Assign each row to its matching pattern group
  classifiedRows.forEach(row => {
    const searchValue = row[searchColumnIndex];
    
    // Find which pattern matches this row
    for (const pattern of patterns) {
      if (checkPatternMatch(searchValue, pattern)) {
        const patternStr = typeof pattern === 'string' ? pattern : pattern.pattern;
        groups[patternStr].rows.push(row);
        groups[patternStr].count++;
        
        // Calculate sum if amount column is specified
        if (amountColumnIndex !== -1) {
          const amountValue = row[amountColumnIndex];
          const numericValue = parseFloat(String(amountValue || '0').replace(/[^0-9.-]/g, ''));
          if (!isNaN(numericValue)) {
            groups[patternStr].totalAmount += numericValue;
          }
        }
        
        break; // Stop at first match
      }
    }
  });
  
  // Convert to array and filter out empty groups
  return Object.values(groups).filter(group => group.rows.length > 0);
};

// ============================================
// MODULE: Filtering
// ============================================

/**
 * Filter rows to keep only those with values in ALL matching columns
 * This ensures we only reconcile rows that have the required data
 */
const filterRowsByMatchingColumns = (classifiedRows, headers, matchingColumns, dataType) => {
  if (!matchingColumns || matchingColumns.length === 0) {
    return classifiedRows;
  }
  
  const filtered = classifiedRows.filter(row => {
    // Check if ALL matching columns have values
    for (const columnConfig of matchingColumns) {
      const columnName = dataType === 'company' ? columnConfig.companyColumn : columnConfig.bankColumn;
      
      if (!columnName) continue; // Skip if column not configured
      
      const columnIndex = getColumnIndex(headers, columnName);
      if (columnIndex === -1) continue; // Skip if column not found
      
      const value = row[columnIndex];
      
      // Check if value is empty
      if (value === null || value === undefined || String(value).trim() === '') {
        return false; // Filter out this row (missing required column value)
      }
    }
    
    return true; // Keep this row (all matching columns have values)
  });
  
  // Log filtered rows for debugging
  const filteredCount = classifiedRows.length - filtered.length;
  return filtered;
};

// ============================================
// MODULE: Classification
// ============================================

/**
 * Classify company data based on patterns and filters
 */
const classifyCompanyData = (companyData, companyHeaders, rules) => {
  // Default to البيان if search column is not specified or empty
  const searchColumn = (rules.companySearchColumn && rules.companySearchColumn.trim() !== '') 
    ? rules.companySearchColumn 
    : 'البيان';
  const classifiedCompanyRaw = classifyData(
    companyData,
    companyHeaders,
    rules.companyPatterns,
    searchColumn,
    rules.companyFilters || null
  );
  
  
  // Filter: Only keep rows that have values in ALL matching columns
  const classifiedCompanyFiltered = filterRowsByMatchingColumns(
    classifiedCompanyRaw,
    companyHeaders,
    rules.matchingColumns,
    'company'
  );  
    
  // Debug: Check column values
  debugColumnValues(classifiedCompanyFiltered, companyHeaders, rules.matchingColumns, 'company');
  
  return classifiedCompanyFiltered;
};

/**
 * Classify bank data based on patterns and filters
 */
const classifyBankData = (bankData, bankHeaders, rules) => {
  // Default to NARRITIVE if search column is not specified
  const searchColumn = rules.bankSearchColumn || 'NARRITIVE';
  
  const classifiedBankRaw = classifyData(
    bankData,
    bankHeaders,
    rules.bankPatterns,
    searchColumn,
    rules.bankFilters || null
  );
  
  
  // Filter: Only keep rows that have values in ALL matching columns
  const classifiedBankFiltered = filterRowsByMatchingColumns(
    classifiedBankRaw,
    bankHeaders,
    rules.matchingColumns,
    'bank'
  );
    
  // Debug: Check column values
  debugColumnValues(classifiedBankFiltered, bankHeaders, rules.matchingColumns, 'bank');
  
  return classifiedBankFiltered;
};

/**
 * Debug helper to check column values in classified data
 */
const debugColumnValues = (classifiedData, headers, matchingColumns, dataType) => {
  const amountCol = matchingColumns?.find(col => col.matchType === 'numeric');
  const columnToCheck = dataType === 'company' ? amountCol?.companyColumn : amountCol?.bankColumn;
  
  if (columnToCheck) {
    const columnIdx = getColumnIndex(headers, columnToCheck);
    
    if (columnIdx !== -1 && classifiedData.length > 0) {
 
      
      
      const rowsWithValue = classifiedData.filter(row => {
        const val = row[columnIdx];
        return val !== null && val !== undefined && val !== '';
      }).length;
    }
  }
};

// ============================================
// MODULE: Matching
// ============================================

/**
 * Match classified company and bank rows based on matching columns
 */
const matchClassifiedRows = (classifiedCompany, classifiedBank, companyHeaders, bankHeaders, rules) => {
  const matchedCompany = [];
  const matchedBank = [];
  const unmatchedCompany = [];
  const matchedBankIndices = new Set();
  
  let matchCount = 0;
  let debugMatchAttempts = 0;
  let totalComparisons = 0;
  
  // For each company row, try to find matching bank rows
  for (const companyRow of classifiedCompany) {
    const matchResult = findMatchingBankRow(
      companyRow,
      classifiedBank,
      matchedBankIndices,
      companyHeaders,
      bankHeaders,
      rules,
      debugMatchAttempts,
      matchCount
    );
    
    if (matchResult.found) {
      matchedCompany.push(companyRow);
      matchedBank.push(matchResult.bankRow);
      matchedBankIndices.add(matchResult.bankIndex);
      matchCount++;
      
      if (matchResult.wasDebugged) {
        debugMatchAttempts++;
      }
    } else {
      unmatchedCompany.push(companyRow);
    }
    
    totalComparisons += matchResult.comparisons;
  }
  
  // Get unmatched bank rows
  const unmatchedBank = classifiedBank.filter((_, index) => !matchedBankIndices.has(index));

  return {
    matchedCompany,
    matchedBank,
    unmatchedCompany,
    unmatchedBank,
    matchCount,
    totalComparisons
  };
};

/**
 * Find a matching bank row for a given company row
 */
const findMatchingBankRow = (
  companyRow,
  classifiedBank,
  matchedBankIndices,
  companyHeaders,
  bankHeaders,
  rules,
  debugMatchAttempts,
  matchCount
) => {
  let comparisons = 0;
  let wasDebugged = false;
  
  for (let i = 0; i < classifiedBank.length; i++) {
    // Skip if this bank row already matched
    if (matchedBankIndices.has(i)) continue;
    
    const bankRow = classifiedBank[i];
    comparisons++;
      
    // Check if all matching columns match
    const allMatch = checkAllColumnsMatch(
      companyRow,
      bankRow,
      rules.matchingColumns,
      companyHeaders,
      bankHeaders,
      rules.dateTolerance || 0,
      rules.useDateTolerance || false
    );
    
    if (allMatch) {
      return {
        found: true,
        bankRow,
        bankIndex: i,
        comparisons,
        wasDebugged
      };
    }
  }
  
  return {
    found: false,
    comparisons,
    wasDebugged
  };
};

// ============================================
// MODULE: Statistics
// ============================================

/**
 * Generate reconciliation statistics
 */
const generateReconciliationStats = (
  companyDataLength,
  bankDataLength,
  classifiedCompanyLength,
  classifiedBankLength,
  matchCount,
  unmatchedCompanyLength,
  unmatchedBankLength
) => {
  return {
    totalCompanyRows: companyDataLength,
    totalBankRows: bankDataLength,
    classifiedCompanyRowsRaw: classifiedCompanyLength,
    classifiedBankRowsRaw: classifiedBankLength,
    classifiedCompanyRows: classifiedCompanyLength,
    classifiedBankRows: classifiedBankLength,
    matchedPairs: matchCount,
    unmatchedCompanyRows: unmatchedCompanyLength,
    unmatchedBankRows: unmatchedBankLength,
    matchRate: classifiedCompanyLength > 0 
      ? ((matchCount / classifiedCompanyLength) * 100).toFixed(2) 
      : 0
  };
};

// ============================================
// MAIN ORCHESTRATOR
// ============================================

/**
 * Main Reconciliation Function
 * Orchestrates the entire reconciliation process
 * Returns matched and unmatched rows from both company and bank data
 */
export const reconcileTransactions = (
  companyData,
  bankData,
  companyHeaders,
  bankHeaders,
  rules
) => {
  // ═══════════════════════════════════════════════════════════════════════
  // SPECIAL CASE: Unclassified (Show rows that didn't match any other type)
  // ═══════════════════════════════════════════════════════════════════════
  if (rules.isUnclassified) {
    
    // Get all other classification types
    const allOtherTypes = rules.allClassificationTypes || {};
    
    // Find unclassified rows by checking against ALL patterns
    // Use البيان for company and NARRITIVE for bank (standard search columns)
    const unclassifiedCompany = findUnclassifiedRowsAdvanced(
      companyData,
      companyHeaders,
      allOtherTypes,
      'company',
      'البيان'  // Check this column for company
    );
    
    const unclassifiedBank = findUnclassifiedRowsAdvanced(
      bankData,
      bankHeaders,
      allOtherTypes,
      'bank',
      'NARRITIVE'  // Check this column for bank
    );
    // Generate statistics
    const stats = {
      totalCompanyRows: companyData.length,
      totalBankRows: bankData.length,
      classifiedCompanyRowsRaw: unclassifiedCompany.length,
      classifiedBankRowsRaw: unclassifiedBank.length,
      classifiedCompanyRows: unclassifiedCompany.length,
      classifiedBankRows: unclassifiedBank.length,
      matchedPairs: 0,
      unmatchedCompanyRows: unclassifiedCompany.length,
      unmatchedBankRows: unclassifiedBank.length,
      matchRate: 0
    };
    
    return {
      classifiedCompanyRaw: unclassifiedCompany,
      classifiedBankRaw: unclassifiedBank,
      classifiedCompany: unclassifiedCompany,
      classifiedBank: unclassifiedBank,
      matchedCompany: [],
      matchedBank: [],
      unmatchedCompany: unclassifiedCompany,
      unmatchedBank: unclassifiedBank,
      stats
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SPECIAL CASE: Sum Comparison (e.g., Salary - many company rows = one bank row)
  // ═══════════════════════════════════════════════════════════════════════
  // Logic for Salary:
  // 1. Find all rows where البيان column starts with "وذلك عن قيمة صافي رواتب"
  // 2. Apply filters if any (e.g., exclude rows with 8-digit check numbers)
  // 3. Show ALL classified rows in the table (classifiedCompanyRaw)
  // 4. Calculate the sum of دائن column for all classified rows
  // ═══════════════════════════════════════════════════════════════════════
  if (rules.isSumComparison) {
    // Step 1: Find all rows where البيان starts with "وذلك عن قيمة صافي رواتب"
    const companySearchColumn = (rules.companySearchColumn && rules.companySearchColumn.trim() !== '') 
      ? rules.companySearchColumn 
      : 'البيان';
    
    // Find the البيان column index
    const byanIndex = getColumnIndex(companyHeaders, companySearchColumn);
    
    // Classify company data: This finds all rows where البيان starts with "وذلك عن قيمة صافي رواتب"
    // For salary, we want ALL rows matching the pattern, so we don't apply filters
    // (The not8Digits filter would exclude salary rows that have 8-digit check numbers)
    const classifiedCompanyRaw = classifyData(
      companyData,
      companyHeaders,
      rules.companyPatterns,
      companySearchColumn,
      null  // Don't apply filters for salary - we want all matching rows
    );
    
    // Classify bank data
    const bankSearchColumn = (rules.bankSearchColumn && rules.bankSearchColumn.trim() !== '') 
      ? rules.bankSearchColumn 
      : 'NARRITIVE';
    
    const classifiedBankRaw = classifyData(
      bankData,
      bankHeaders,
      rules.bankPatterns,
      bankSearchColumn,
      rules.bankFilters || null
    );
    
    
    // Step 2: Calculate sum of دائن column for all classified rows
    let companyTotal = 0;
    
    if (rules.companyAmountColumn) {
      const companyAmountIndex = getColumnIndex(companyHeaders, rules.companyAmountColumn);
      if (companyAmountIndex !== -1) {
        if (classifiedCompanyRaw.length === 0) {
          console.warn('[reconcileTransactions] No classified rows found, cannot calculate sum');
        } else {
          classifiedCompanyRaw.forEach((row, index) => {
            const value = row[companyAmountIndex];
            // Remove commas and parse as number
            const numericValue = parseFloat(String(value || '0').replace(/[^0-9.-]/g, ''));
            
            if (!isNaN(numericValue)) {
              companyTotal += numericValue;
            } else {
              console.warn(`[reconcileTransactions] Row ${index + 1}: Invalid numeric value:`, value);
            }
          });
        }
      } else {
        console.error('[reconcileTransactions] Available headers:', companyHeaders);
      }
    } else {
      console.error('[reconcileTransactions] ❌ ERROR: companyAmountColumn not configured!');
    }
    
    // Calculate sum of bank amount column
    let bankTotal = 0;
    if (rules.bankAmountColumn) {
      const bankAmountIndex = getColumnIndex(bankHeaders, rules.bankAmountColumn);
      if (bankAmountIndex !== -1) {
        classifiedBankRaw.forEach(row => {
          const value = row[bankAmountIndex];
          const numericValue = parseFloat(String(value || '0').replace(/[^0-9.-]/g, ''));
          if (!isNaN(numericValue)) {
            bankTotal += numericValue;
          }
        });
      }
    }
    // Generate statistics
    const stats = {
      totalCompanyRows: companyData.length,
      totalBankRows: bankData.length,
      classifiedCompanyRowsRaw: classifiedCompanyRaw.length,
      classifiedBankRowsRaw: classifiedBankRaw.length,
      classifiedCompanyRows: classifiedCompanyRaw.length,
      classifiedBankRows: classifiedBankRaw.length,
      matchedPairs: 0,
      unmatchedCompanyRows: classifiedCompanyRaw.length,
      unmatchedBankRows: classifiedBankRaw.length,
      matchRate: 0,
      companyTotal,  // Add company total
      bankTotal,     // Add bank total
      totalsDifference: Math.abs(companyTotal - bankTotal),
      totalsMatch: companyTotal === bankTotal
    };
    return {
      classifiedCompanyRaw,  // This will be shown in the table
      classifiedBankRaw,
      classifiedCompany: classifiedCompanyRaw,  // Also set this for compatibility
      classifiedBank: classifiedBankRaw,
      matchedCompany: [],
      matchedBank: [],
      unmatchedCompany: classifiedCompanyRaw,
      unmatchedBank: classifiedBankRaw,
      stats
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SPECIAL CASE: Bank-Only Classification (e.g., Charges, Commissions)
  // ═══════════════════════════════════════════════════════════════════════
  if (rules.isBankOnly) {
    
    // Only classify bank data
    const classifiedBankRaw = classifyBankData(bankData, bankHeaders, rules);
    
    // Group classified rows by pattern
    const groupedByPattern = groupByPattern(
      classifiedBankRaw,
      bankHeaders,
      rules.bankPatterns,
      rules.bankSearchColumn,
      rules.bankAmountColumn || null  // Pass amount column for sum calculation
    );
    
    // Generate statistics for bank-only
    const stats = {
      totalCompanyRows: 0,
      totalBankRows: bankData.length,
      classifiedCompanyRowsRaw: 0,
      classifiedBankRowsRaw: classifiedBankRaw.length,
      classifiedCompanyRows: 0,
      classifiedBankRows: classifiedBankRaw.length,
      matchedPairs: 0,
      unmatchedCompanyRows: 0,
      unmatchedBankRows: classifiedBankRaw.length,
      matchRate: 0
    };
    
    return {
      classifiedCompanyRaw: [],
      classifiedBankRaw,
      classifiedCompany: [],
      classifiedBank: classifiedBankRaw,
      groupedByPattern,  // Include grouped data
      matchedCompany: [],
      matchedBank: [],
      unmatchedCompany: [],
      unmatchedBank: classifiedBankRaw,  // All classified rows are "unmatched" (no company data)
      stats
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // NORMAL FLOW: Company-Bank Matching
  // ═══════════════════════════════════════════════════════════════════════
  
  // Step 1: Classify data

  const classifiedCompanyRaw = classifyCompanyData(companyData, companyHeaders, rules);
  
  const classifiedBankRaw = classifyBankData(bankData, bankHeaders, rules);
  
  // Step 2: Match classified rows
  const matchingResults = matchClassifiedRows(
    classifiedCompanyRaw,
    classifiedBankRaw,
    companyHeaders,
    bankHeaders,
    rules
  );
  
  // Step 3: Generate statistics
  const stats = generateReconciliationStats(
    companyData.length,
    bankData.length,
    classifiedCompanyRaw.length,
    classifiedBankRaw.length,
    matchingResults.matchCount,
    matchingResults.unmatchedCompany.length,
    matchingResults.unmatchedBank.length
  );
  
  // Step 4: Return complete results

  
  return {
    // Classified data (before filtering - for debugging)
    classifiedCompanyRaw,
    classifiedBankRaw,
    
    // Classified data (after filtering)
    classifiedCompany: classifiedCompanyRaw,
    classifiedBank: classifiedBankRaw,
    
    // Matched data
    matchedCompany: matchingResults.matchedCompany,
    matchedBank: matchingResults.matchedBank,
    
    // Unmatched data
    unmatchedCompany: matchingResults.unmatchedCompany,
    unmatchedBank: matchingResults.unmatchedBank,
    
    // Statistics
    stats
  };
};

/**
 * Validate reconciliation configuration
 */
export const validateReconciliationConfig = (rules) => {
  const errors = [];
  
  if (!rules) {
    errors.push('No rules provided');
    return { valid: false, errors };
  }
  
  // Special validation for bank-only types
  if (rules.isBankOnly) {
    // Only validate bank-related fields
    if (!rules.bankSearchColumn) {
      errors.push('Bank search column not configured');
    }
    
    if (!rules.bankPatterns || rules.bankPatterns.length === 0) {
      errors.push('No bank patterns configured');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Special validation for unclassified types
  if (rules.isUnclassified) {
    // For unclassified, search columns are optional
    // If not configured, we'll show all rows
    // No validation errors needed
    
    return {
      valid: true,
      errors: []
    };
  }
  
  // Special validation for sum comparison types (e.g., Salary)
  if (rules.isSumComparison) {
    // Validate search columns
    if (!rules.companySearchColumn) {
      errors.push('Company search column not configured');
    }
    
    if (!rules.bankSearchColumn) {
      errors.push('Bank search column not configured');
    }
    
    // Validate patterns
    if (!rules.companyPatterns || rules.companyPatterns.length === 0) {
      errors.push('No company patterns configured');
    }
    
    if (!rules.bankPatterns || rules.bankPatterns.length === 0) {
      errors.push('No bank patterns configured');
    }
    
    // Validate amount columns for sum calculation
    if (!rules.companyAmountColumn) {
      errors.push('Company amount column not configured (required for sum calculation)');
    }
    
    if (!rules.bankAmountColumn) {
      errors.push('Bank amount column not configured (required for sum calculation)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Normal validation for matching types
  
  // Check search columns
  if (!rules.companySearchColumn) {
    errors.push('Company search column not configured');
  }
  
  if (!rules.bankSearchColumn) {
    errors.push('Bank search column not configured');
  }
  
  // Check patterns
  if (!rules.companyPatterns || rules.companyPatterns.length === 0) {
    errors.push('No company patterns configured');
  }
  
  if (!rules.bankPatterns || rules.bankPatterns.length === 0) {
    errors.push('No bank patterns configured');
  }
  
  // Check matching columns
  if (!rules.matchingColumns || rules.matchingColumns.length === 0) {
    errors.push('No matching columns configured');
  } else {
    // Validate each matching column
    rules.matchingColumns.forEach((col, index) => {
      if (!col.companyColumn) {
        errors.push(`Matching column ${index + 1}: Company column not selected`);
      }
      if (!col.bankColumn) {
        errors.push(`Matching column ${index + 1}: Bank column not selected`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

