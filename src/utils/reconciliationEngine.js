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
  
  const textStr = String(text).toLowerCase();
  const patternStr = typeof pattern === 'string' ? pattern : pattern.pattern;
  const matchType = typeof pattern === 'string' ? 'startsWith' : pattern.matchType;
  
  const patternLower = patternStr.toLowerCase();
  
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
    for (const pattern of patterns) {
      if (checkPatternMatch(searchValue, pattern)) {
        matches = true;
        if (classified.length < 3) {
          console.log(`  ✅ Match found! Pattern: "${typeof pattern === 'string' ? pattern : pattern.pattern}", Value: "${searchValue}"`);
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
 * Main Reconciliation Function
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
  
  // Step 1: Classify company data
  console.log('📋 Step 1: Classifying Company Data...');
  let classifiedCompanyRaw = classifyData(
    companyData,
    companyHeaders,
    rules.companyPatterns,
    rules.companySearchColumn,
    rules.companyFilters || null
  );
  
  let classifiedCompany = classifiedCompanyRaw;
  console.log('✅ Classified Company Rows:', classifiedCompany.length);
  
  // Debug: Check how many rows have values in matching columns
  const amountCol = rules.matchingColumns?.find(col => col.matchType === 'numeric');
  if (amountCol && amountCol.companyColumn) {
    const amountIdx = getColumnIndex(companyHeaders, amountCol.companyColumn);
    console.log(`  🔍 Looking for column "${amountCol.companyColumn}" in headers:`, companyHeaders);
    console.log(`  🔍 Found at index: ${amountIdx}`);
    
    // Check first 5 rows
    console.log(`  🔍 First 5 classified rows "${amountCol.companyColumn}" values:`);
    for (let i = 0; i < Math.min(5, classifiedCompany.length); i++) {
      console.log(`    Row ${i + 1}: [${amountIdx}] = "${classifiedCompany[i][amountIdx]}" (type: ${typeof classifiedCompany[i][amountIdx]})`);
    }
    
    const rowsWithAmount = classifiedCompany.filter(row => {
      const val = row[amountIdx];
      return val !== null && val !== undefined && val !== '';
    }).length;
    console.log(`  💰 Rows with "${amountCol.companyColumn}" values: ${rowsWithAmount} / ${classifiedCompany.length}`);
  }
  
  // Step 2: Classify bank data
  console.log('📋 Step 2: Classifying Bank Data...');
  let classifiedBankRaw = classifyData(
    bankData,
    bankHeaders,
    rules.bankPatterns,
    rules.bankSearchColumn,
    rules.bankFilters || null
  );
  
  let classifiedBank = classifiedBankRaw;
  console.log('✅ Classified Bank Rows:', classifiedBank.length);
  
  // Debug: Check how many rows have values in matching columns
  if (amountCol && amountCol.bankColumn) {
    const amountIdx = getColumnIndex(bankHeaders, amountCol.bankColumn);
    const rowsWithAmount = classifiedBank.filter(row => {
      const val = row[amountIdx];
      return val !== null && val !== undefined && val !== '';
    }).length;
    console.log(`  💰 Rows with "${amountCol.bankColumn}" values: ${rowsWithAmount} / ${classifiedBank.length}`);
  }
  
  // Step 3: Match classified rows based on matching columns
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
  let skippedDueToEmptyValues = 0;
  
  // For each company row, try to find matching bank rows
  for (const companyRow of classifiedCompany) {
    let foundMatch = false;
    
    for (let i = 0; i < classifiedBank.length; i++) {
      // Skip if this bank row already matched
      if (matchedBankIndices.has(i)) continue;
      
      const bankRow = classifiedBank[i];
      totalComparisons++;
      
      // Debug first 3 matching attempts
      if (debugMatchAttempts < 3) {
        console.log(`\n  🔍 Matching Attempt ${debugMatchAttempts + 1}:`);
        rules.matchingColumns.forEach(col => {
          const companyValue = getValueByColumnName(companyRow, companyHeaders, col.companyColumn);
          const bankValue = getValueByColumnName(bankRow, bankHeaders, col.bankColumn);
          console.log(`    ${col.label}: "${companyValue}" (${col.companyColumn}) ⟷ "${bankValue}" (${col.bankColumn})`);
        });
        debugMatchAttempts++;
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
        matchedCompany.push(companyRow);
        matchedBank.push(bankRow);
        matchedBankIndices.add(i);
        foundMatch = true;
        matchCount++;
        break; // Found match, move to next company row
      }
    }
    
    if (!foundMatch) {
      unmatchedCompany.push(companyRow);
    }
  }
  
  // Get unmatched bank rows
  const unmatchedBank = classifiedBank.filter((_, index) => !matchedBankIndices.has(index));
  
  console.log('✅ Reconciliation Complete!');
  console.log('📊 Results:');
  console.log('  - Total Comparisons:', totalComparisons);
  console.log('  - Skipped (empty values):', skippedDueToEmptyValues);
  console.log('  - Matched Pairs:', matchCount);
  console.log('  - Unmatched Company:', unmatchedCompany.length);
  console.log('  - Unmatched Bank:', unmatchedBank.length);
  
  return {
    // Classified data (before filtering - for debugging)
    classifiedCompanyRaw,
    classifiedBankRaw,
    
    // Classified data (after filtering)
    classifiedCompany,
    classifiedBank,
    
    // Matched data
    matchedCompany,
    matchedBank,
    
    // Unmatched data
    unmatchedCompany,
    unmatchedBank,
    
    // Statistics
    stats: {
      totalCompanyRows: companyData.length,
      totalBankRows: bankData.length,
      classifiedCompanyRowsRaw: classifiedCompanyRaw.length,
      classifiedBankRowsRaw: classifiedBankRaw.length,
      classifiedCompanyRows: classifiedCompany.length,
      classifiedBankRows: classifiedBank.length,
      matchedPairs: matchCount,
      unmatchedCompanyRows: unmatchedCompany.length,
      unmatchedBankRows: unmatchedBank.length,
      matchRate: classifiedCompany.length > 0 
        ? ((matchCount / classifiedCompany.length) * 100).toFixed(2) 
        : 0
    }
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

