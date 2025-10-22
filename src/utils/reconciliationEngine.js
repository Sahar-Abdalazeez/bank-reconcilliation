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
 */
export const normalizeCheckNumber = (checkNumber) => {
  if (!checkNumber) return '';
  
  // Convert to string and remove all non-numeric characters
  const cleanNumber = String(checkNumber).replace(/[^0-9]/g, '');
  
  // If it's empty after cleaning, return empty
  if (!cleanNumber) return '';
  
  // Pad with leading zeros to make it 8 digits
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
 * Parse date from various formats
 */
export const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // If already a Date object
  if (dateValue instanceof Date) return dateValue;
  
  // Try parsing string date
  const dateStr = String(dateValue).trim();
  
  // Try manual parsing first for more control
  const parts = dateStr.split(/[/.+-]/);
  if (parts.length === 3) {
    const [part1, part2, part3] = parts.map(p => parseInt(p.trim()));
    
    // Check if it's a valid date in DD/MM/YYYY format
    if (part1 >= 1 && part1 <= 31 && part2 >= 1 && part2 <= 12 && part3 >= 1900) {
      const dateDDMM = new Date(part3, part2 - 1, part1);
      if (!isNaN(dateDDMM.getTime()) && 
          dateDDMM.getDate() === part1 && 
          dateDDMM.getMonth() === part2 - 1 && 
          dateDDMM.getFullYear() === part3) {
        return dateDDMM;
      }
    }
    
    // Check if it's a valid date in MM/DD/YYYY format
    if (part1 >= 1 && part1 <= 12 && part2 >= 1 && part2 <= 31 && part3 >= 1900) {
      const dateMMDD = new Date(part3, part1 - 1, part2);
      if (!isNaN(dateMMDD.getTime()) && 
          dateMMDD.getMonth() === part1 - 1 && 
          dateMMDD.getDate() === part2 && 
          dateMMDD.getFullYear() === part3) {
        return dateMMDD;
      }
    }
  }
  
  // Fallback to native Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
};

/**
 * Compare dates with tolerance
 * For reconciliation: bankDate must be SAME or UP TO toleranceDays AFTER companyDate
 * @param {*} companyDate - Company date (earlier)
 * @param {*} bankDate - Bank date (same or later)
 * @param {*} toleranceDays - Maximum days bank can be after company (e.g., 4 days)
 */
export const compareDatesWithTolerance = (companyDate, bankDate, toleranceDays) => {
  const d1 = parseDate(companyDate);
  const d2 = parseDate(bankDate);
  
  if (!d1 || !d2) return false;
  
  // Calculate difference: positive if bank is after company
  const daysDiff = (d2 - d1) / (1000 * 60 * 60 * 24);
  
  // Bank date must be same day (0) or up to toleranceDays AFTER company date
  return daysDiff >= 0 && daysDiff <= toleranceDays;
};

/**
 * Compare numbers with tolerance
 */
export const compareNumbersWithTolerance = (num1, num2, tolerance) => {
  const n1 = parseFloat(num1);
  const n2 = parseFloat(num2);
  
  if (isNaN(n1) || isNaN(n2)) return false;
  
  const diff = Math.abs(n1 - n2);
  return diff <= tolerance;
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
    console.warn(`  ⚠️ Column not configured: ${columnConfig.label}`);
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
      const n1 = parseFloat(String(companyValue).replace(/[^0-9.-]/g, ''));
      const n2 = parseFloat(String(bankValue).replace(/[^0-9.-]/g, ''));
      
      // If both are valid numbers, compare numerically
      if (!isNaN(n1) && !isNaN(n2)) {
        return n1 === n2;
      }
      
      // Otherwise, compare as strings
      return String(companyValue) === String(bankValue);
    }
      
    case 'numeric': {
      // Exact numeric match
      const n1 = parseFloat(companyValue);
      const n2 = parseFloat(bankValue);
      return !isNaN(n1) && !isNaN(n2) && n1 === n2;
    }
      
    case 'date': {
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
      return d1 && d2 && d1.getTime() === d2.getTime();
    }
      
    case 'text': {
      // Check if this is a check number column based on column name or label
      const isCheckNumberColumn = 
        columnConfig.label?.toLowerCase().includes('check') ||
        columnConfig.companyColumn?.toLowerCase().includes('شيك') ||
        columnConfig.bankColumn?.toLowerCase().includes('check') ||
        columnConfig.bankColumn?.toLowerCase().includes('doc');
      
      // ALWAYS normalize check numbers to 8 digits
      if (isCheckNumberColumn) {
        const normalizedCompany = normalizeCheckNumber(companyValue);
        const normalizedBank = normalizeCheckNumber(bankValue);
        
        // Debug logging for first few comparisons
        if (Math.random() < 0.01) { // Log ~1% of comparisons to avoid spam
          console.log(`🔢 Check Number Comparison:`, {
            company: companyValue,
            bank: bankValue,
            normalizedCompany,
            normalizedBank,
            match: normalizedCompany === normalizedBank
          });
        }
        
        return normalizedCompany === normalizedBank;
      }
      
      // For non-check-number text fields, use normalize flag
      if (columnConfig.normalize) {
        return normalizeText(companyValue) === normalizeText(bankValue);
      }
      
      return String(companyValue) === String(bankValue);
    }
      
    default:
      return String(companyValue) === String(bankValue);
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
    console.warn('⚠️ classifyData: Missing required parameters', {
      hasData: !!data,
      dataLength: data?.length,
      hasPatterns: !!patterns,
      patternsLength: patterns?.length,
      searchColumn
    });
    return [];
  }
  
  // Find the column index for search column
  const searchColumnIndex = getColumnIndex(headers, searchColumn);
  
  console.log('🔍 Classifying data:', {
    totalRows: data.length,
    patterns: patterns.length,
    searchColumn,
    searchColumnIndex
  });
  
  if (searchColumnIndex === -1) {
    console.error(`❌ Search column "${searchColumn}" not found in headers:`, headers);
    return [];
  }
  
  const classified = [];
  let debugCount = 0;
  
  for (const row of data) {
    const searchValue = row[searchColumnIndex];
    
    // Debug first 3 rows
    if (debugCount < 3) {
      console.log(`  Row ${debugCount + 1} - SearchColumn: "${searchColumn}" [index ${searchColumnIndex}], Value: "${searchValue}"`);
      debugCount++;
    }
    
    if (!searchValue) continue;
    
    // Check if any pattern matches
    let matches = false;
    let matchedPattern = null;
    for (const pattern of patterns) {
      if (checkPatternMatch(searchValue, pattern)) {
        matches = true;
        matchedPattern = typeof pattern === 'string' ? pattern : pattern.pattern;
        if (classified.length < 3) {
          console.log(`  ✅ Match found! Pattern: "${matchedPattern}", Value: "${searchValue}"`);
        }
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
  
  console.log(`  📊 Classified ${classified.length} rows out of ${data.length}`);
  
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
    console.log(`⚠️ No search column configured for ${dataType} - returning all rows as unclassified`);
    return data;
  }
  
  // Get the search column index
  const searchColumnIndex = getColumnIndex(headers, searchColumn);
  if (searchColumnIndex === -1) {
    console.warn(`⚠️ Search column "${searchColumn}" not found in ${dataType} headers - returning all rows as unclassified`);
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
  
  console.log(`📊 Checking ${dataType} rows against ${allPatterns.length} total patterns in column "${searchColumn}"`);
  
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
  if (filteredCount > 0) {
    console.log(`  🔍 Filtered out ${filteredCount} ${dataType} rows without values in matching columns`);
  }
  
  return filtered;
};

// ============================================
// MODULE: Classification
// ============================================

/**
 * Classify company data based on patterns and filters
 */
const classifyCompanyData = (companyData, companyHeaders, rules) => {
  console.log('📋 Step 1: Classifying Company Data...');
  
  const classifiedCompanyRaw = classifyData(
    companyData,
    companyHeaders,
    rules.companyPatterns,
    rules.companySearchColumn,
    rules.companyFilters || null
  );
  
  console.log('✅ Classified Company Rows (before filtering):', classifiedCompanyRaw.length);
  
  // Filter: Only keep rows that have values in ALL matching columns
  const classifiedCompanyFiltered = filterRowsByMatchingColumns(
    classifiedCompanyRaw,
    companyHeaders,
    rules.matchingColumns,
    'company'
  );
  
  console.log('✅ Classified Company Rows (after matching column filter):', classifiedCompanyFiltered.length);
  
  // Debug: Check column values
  debugColumnValues(classifiedCompanyFiltered, companyHeaders, rules.matchingColumns, 'company');
  
  return classifiedCompanyFiltered;
};

/**
 * Classify bank data based on patterns and filters
 */
const classifyBankData = (bankData, bankHeaders, rules) => {
  console.log('📋 Step 2: Classifying Bank Data...');
  
  const classifiedBankRaw = classifyData(
    bankData,
    bankHeaders,
    rules.bankPatterns,
    rules.bankSearchColumn,
    rules.bankFilters || null
  );
  
  console.log('✅ Classified Bank Rows (before filtering):', classifiedBankRaw.length);
  
  // Filter: Only keep rows that have values in ALL matching columns
  const classifiedBankFiltered = filterRowsByMatchingColumns(
    classifiedBankRaw,
    bankHeaders,
    rules.matchingColumns,
    'bank'
  );
  
  console.log('✅ Classified Bank Rows (after matching column filter):', classifiedBankFiltered.length);
  
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
      console.log(`  🔍 Looking for column "${columnToCheck}" in ${dataType} headers`);
      console.log(`  🔍 Found at index: ${columnIdx}`);
      
      // Check first 5 rows
      console.log(`  🔍 First 5 classified rows "${columnToCheck}" values:`);
      for (let i = 0; i < Math.min(5, classifiedData.length); i++) {
        console.log(`    Row ${i + 1}: [${columnIdx}] = "${classifiedData[i][columnIdx]}" (type: ${typeof classifiedData[i][columnIdx]})`);
      }
      
      const rowsWithValue = classifiedData.filter(row => {
        const val = row[columnIdx];
        return val !== null && val !== undefined && val !== '';
      }).length;
      console.log(`  💰 Rows with "${columnToCheck}" values: ${rowsWithValue} / ${classifiedData.length}`);
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
  console.log('🔗 Step 3: Matching Rows...');
  console.log('Matching Columns Configuration:', rules.matchingColumns);
  console.log(`Will attempt up to ${classifiedCompany.length} × ${classifiedBank.length} = ${classifiedCompany.length * classifiedBank.length} comparisons`);
  
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
  
  console.log('✅ Reconciliation Complete!');
  console.log('📊 Results:');
  console.log('  - Total Comparisons:', totalComparisons);
  console.log('  - Matched Pairs:', matchCount);
  console.log('  - Unmatched Company:', unmatchedCompany.length);
  console.log('  - Unmatched Bank:', unmatchedBank.length);
  
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
    
    // Debug first 3 matching attempts
    if (debugMatchAttempts < 3) {
      console.log(`\n  🔍 Matching Attempt ${debugMatchAttempts + 1}:`);
      rules.matchingColumns.forEach(col => {
        const companyValue = getValueByColumnName(companyRow, companyHeaders, col.companyColumn);
        const bankValue = getValueByColumnName(bankRow, bankHeaders, col.bankColumn);
        console.log(`    ${col.label}: "${companyValue}" (${col.companyColumn}) ⟷ "${bankValue}" (${col.bankColumn})`);
      });
      wasDebugged = true;
    }
    
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
      if (matchCount < 3) {
        console.log(`  ✅ MATCH FOUND! Pair #${matchCount + 1}`);
      }
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
  console.log('🚀 Starting Reconciliation Process...');
  console.log('Company Data Rows:', companyData?.length || 0);
  console.log('Bank Data Rows:', bankData?.length || 0);
  console.log('Rules:', rules);
  
  // ═══════════════════════════════════════════════════════════════════════
  // SPECIAL CASE: Unclassified (Show rows that didn't match any other type)
  // ═══════════════════════════════════════════════════════════════════════
  if (rules.isUnclassified) {
    console.log('❓ Unclassified Mode - Finding rows not matched by other types');
    
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
    
    console.log(`✅ Found ${unclassifiedCompany.length} unclassified company rows`);
    console.log(`✅ Found ${unclassifiedBank.length} unclassified bank rows`);
    
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
  if (rules.isSumComparison) {
    console.log('💰 Sum Comparison Mode (Many-to-One)');
    
    // Classify company and bank data
    const classifiedCompanyRaw = classifyCompanyData(companyData, companyHeaders, rules);
    const classifiedBankRaw = classifyBankData(bankData, bankHeaders, rules);
    
    // Calculate sum of company amount column
    let companyTotal = 0;
    if (rules.companyAmountColumn) {
      const companyAmountIndex = getColumnIndex(companyHeaders, rules.companyAmountColumn);
      if (companyAmountIndex !== -1) {
        classifiedCompanyRaw.forEach(row => {
          const value = row[companyAmountIndex];
          const numericValue = parseFloat(String(value || '0').replace(/[^0-9.-]/g, ''));
          if (!isNaN(numericValue)) {
            companyTotal += numericValue;
          }
        });
      }
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
    
    console.log(`💰 Company Total (${rules.companyAmountColumn}): ${companyTotal.toFixed(2)}`);
    console.log(`💰 Bank Total (${rules.bankAmountColumn}): ${bankTotal.toFixed(2)}`);
    console.log(`💰 Difference: ${Math.abs(companyTotal - bankTotal).toFixed(2)}`);
    console.log(`💰 Match: ${companyTotal === bankTotal ? '✅ YES' : '❌ NO'}`);
    
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
      classifiedCompanyRaw,
      classifiedBankRaw,
      classifiedCompany: classifiedCompanyRaw,
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
    console.log('📋 Bank-Only Classification Mode (No Matching)');
    
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
    
    console.log(`📊 Grouped into ${groupedByPattern.length} pattern groups`);
    groupedByPattern.forEach(group => {
      console.log(`  - ${group.pattern}: ${group.rows.length} rows`);
    });
    
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

