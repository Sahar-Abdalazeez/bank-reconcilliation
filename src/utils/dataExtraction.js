/**
 * Normalize check number to 8 digits
 * If check number is 9 digits AND leftmost digit is zero, remove it to make 8 digits
 * All other lengths are padded to 8 digits
 */
const normalizeCheckNumberForExtraction = (checkNumber) => {
  if (!checkNumber) {
    return "";
  }

  // Convert to string and remove all non-numeric characters
  const cleanNumber = String(checkNumber).replace(/[^0-9]/g, "");

  // If it's empty after cleaning, return empty
  if (!cleanNumber) {
    return "";
  }

  // If it's 9 digits AND the leftmost digit is zero, remove it to make it 8 digits
  // Example: "030000043" → "30000043"
  if (cleanNumber.length === 9 && cleanNumber[0] === "0") {
    const result = cleanNumber.substring(1);
    return result;
  }

  // If it's 9 digits without leading zero, remove first digit
  if (cleanNumber.length === 9) {
    const result = cleanNumber.substring(1);
    return result;
  }

  // For all other lengths, pad with leading zeros to make it 8 digits
  const result = cleanNumber.padStart(8, "0");
  return result;
};

/**
 * Extract check number from البيان text
 * Check numbers can be 1-9 digits (9-digit numbers starting with 0 will be normalized to 8 by removing leading zero)
 */
export const extractCheckNumber = (byanText) => {
  if (!byanText) {
    return "";
  }

  const text = String(byanText);

  // Pattern 1: Look for "شيك رقم" followed by numbers (prioritize 9 digits, then 8)
  let match = text.match(/شيك\s*رقم\s*[:\s]*(\d{8,9})/i);
  if (match) {
    const extracted = match[1];
    const normalized = normalizeCheckNumberForExtraction(extracted);
    return normalized;
  }

  // Pattern 2: Look for "رقم" after "شيك" with optional words in between (handles "شيك مقاصة رقم")
  // Prioritize 9 digits first
  match = text.match(/شيك[^0-9]*?رقم\s*[:\s]*(\d{8,9})/i);
  if (match) {
    const extracted = match[1];
    const normalized = normalizeCheckNumberForExtraction(extracted);
    return normalized;
  }

  // Pattern 3: Look for "ش.ر" or "ش ر" followed by numbers (prioritize 9 digits)
  match = text.match(/ش\s*[.،]\s*ر\s*[:\s]*(\d{8,9})/i);
  if (match) {
    const extracted = match[1];
    const normalized = normalizeCheckNumberForExtraction(extracted);
    return normalized;
  }

  // Pattern 4: Look for "رقم الشيك" followed by numbers (prioritize 9 digits)
  match = text.match(/رقم\s*الشيك\s*[:\s]*(\d{8,9})/i);
  if (match) {
    const extracted = match[1];
    const normalized = normalizeCheckNumberForExtraction(extracted);
    return normalized;
  }

  // Pattern 5: Look for "شيك" followed by numbers anywhere (prioritize 9 digits)
  // Use a more specific pattern to capture full number
  match = text.match(/شيك[^0-9]*?(\d{8,9})(?=\D|$)/i);
  if (match) {
    const extracted = match[1];
    const normalized = normalizeCheckNumberForExtraction(extracted);
    return normalized;
  }

  // Pattern 6: Look for standalone numbers (prioritize 9 digits first)
  // Try to match 9 digits first - this handles cases where Excel converted
  // "030000043" to "30000043" (9 digits without leading zero)
  match = text.match(/\b(\d{9})\b/);
  if (match) {
    const normalized = normalizeCheckNumberForExtraction(match[1]);
    return normalized;
  }

  // Pattern 7: Look for numbers near "رقم" or "شيك" that might have been converted
  // This catches "30000043" style 9-digit numbers
  match = text.match(/(?:رقم|شيك)[^0-9]*?(\d{9})(?=\D|$)/i);
  if (match) {
    const normalized = normalizeCheckNumberForExtraction(match[1]);
    return normalized;
  }

  // Fallback to 8-digit numbers
  match = text.match(/\b(\d{8})\b/);
  if (match) {
    const normalized = normalizeCheckNumberForExtraction(match[1]);
    return normalized;
  }

  // Last resort: any 4-7 digit number
  match = text.match(/\b(\d{4,7})\b/);
  if (match) {
    const normalized = normalizeCheckNumberForExtraction(match[1]);
    return normalized;
  }

  return "";
};

/**
 * Extract date from البيان text
 */
export const extractDate = (byanText) => {
  if (!byanText) return "";

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
  match = text.match(
    /(?:تاريخ|بتاريخ)\s*[:\s]*(\d{1,2})[\\/.+-](\d{1,2})[\\/.+-](\d{4})/
  );
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }

  return "";
};

/**
 * Process company data to extract check numbers and dates
 */
export const processCompanyData = (data, headers) => {
  if (!data || !headers) return { data, headers };

  // Find البيان column index
  const byanIndex = headers.findIndex(
    (h) => h && (h.includes("البيان") || h.includes("بيان"))
  );

  if (byanIndex === -1) {
    return { data, headers };
  }

  // Check if extracted columns already exist
  const checkNumberHeader = "رقم الشيك المستخرج";
  const dateHeader = "التاريخ المستخرج";
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
  const processedData = data.map((row, rowIndex) => {
    const byanValue = row[byanIndex];

    const checkNumber = extractCheckNumber(byanValue);

    const date = extractDate(byanValue);

    const newRow = [...row];

    // Always extract and overwrite, even if column exists (in case Excel has wrong values)
    if (hasCheckNumberColumn) {
      // Column exists, overwrite it at the correct index
      const checkNumberIndex = newHeaders.indexOf(checkNumberHeader);
      newRow[checkNumberIndex] = checkNumber;
    } else {
      // Column doesn't exist, add it
      newRow.push(checkNumber);
    }

    if (hasDateColumn) {
      // Column exists, overwrite it at the correct index
      const dateIndex = newHeaders.indexOf(dateHeader);
      newRow[dateIndex] = date;
    } else {
      // Column doesn't exist, add it
      newRow.push(date);
    }

    return newRow;
  });

  return {
    data: processedData,
    headers: newHeaders,
  };
};
