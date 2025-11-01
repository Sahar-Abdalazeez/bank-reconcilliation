/**
 * Extract check number from البيان text
 * Check numbers are maximum 8 digits
 */
export const extractCheckNumber = (byanText) => {
  if (!byanText) return '';
  
  const text = String(byanText);
  
  // Pattern 1: Look for "شيك رقم" followed by numbers (1-8 digits)
  let match = text.match(/شيك\s*رقم\s*[:\s]*(\d{1,8})/i);
  if (match) return match[1];
  
  // Pattern 2: Look for "ش.ر" or "ش ر" followed by numbers (1-8 digits)
  match = text.match(/ش\s*[.،]\s*ر\s*[:\s]*(\d{1,8})/i);
  if (match) return match[1];
  
  // Pattern 3: Look for "رقم الشيك" followed by numbers (1-8 digits)
  match = text.match(/رقم\s*الشيك\s*[:\s]*(\d{1,8})/i);
  if (match) return match[1];
  
  // Pattern 4: Look for "شيك" followed by numbers anywhere (1-8 digits)
  match = text.match(/شيك.*?(\d{1,8})/i);
  if (match) return match[1];
  
  // Pattern 5: Look for standalone numbers (4-8 digits, likely a check number)
  match = text.match(/\b(\d{4,8})\b/);
  if (match) return match[1];
  
  return '';
};

/**
 * Extract date from البيان text
 */
export const extractDate = (byanText) => {
  if (!byanText) return '';
  
  const text = String(byanText);
  
  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = text.match(/(\d{1,2})[\\/.+-](\d{1,2})[\\/.+-](\d{4})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  
  // Pattern 2: YYYY/MM/DD or YYYY-MM-DD
  match = text.match(/(\d{4})[\\/-](\d{1,2})[\\/-](\d{1,2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`; // Convert to DD/MM/YYYY
  }
  
  // Pattern 3: Look for "تاريخ" or "بتاريخ" followed by date
  match = text.match(/(?:تاريخ|بتاريخ)\s*[:\s]*(\d{1,2})[\\/.+-](\d{1,2})[\\/.+-](\d{4})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  
  return '';
};

/**
 * Process company data to extract check numbers and dates
 */
export const processCompanyData = (data, headers) => {
  if (!data || !headers) return { data, headers };
  
  // Find البيان column index
  const byanIndex = headers.findIndex(h => 
    h && (h.includes('البيان') || h.includes('بيان'))
  );
  
  if (byanIndex === -1) {
    return { data, headers };
  }
  
  // Check if extracted columns already exist
  const checkNumberHeader = 'رقم الشيك المستخرج';
  const dateHeader = 'التاريخ المستخرج';
  const hasCheckNumberColumn = headers.includes(checkNumberHeader);
  const hasDateColumn = headers.includes(dateHeader);
  
  // Add new column headers only if they don't already exist
  const newHeaders = [...headers];
  if (!hasCheckNumberColumn) {
    newHeaders.push(checkNumberHeader);
  }
  if (!hasDateColumn) {
    newHeaders.push(dateHeader);
  }
  
  // Process each row to extract data
  const processedData = data.map(row => {
    const byanValue = row[byanIndex];
    const checkNumber = extractCheckNumber(byanValue);
    const date = extractDate(byanValue);
    
    const newRow = [...row];
    
    // Only add extracted data if columns don't already exist
    if (!hasCheckNumberColumn) {
      newRow.push(checkNumber);
    }
    if (!hasDateColumn) {
      newRow.push(date);
    }
    
    return newRow;
  });
  
  return {
    data: processedData,
    headers: newHeaders
  };
};

