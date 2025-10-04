import { useState, useCallback, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import './App.css'
import './header-accordion.css'
import logoImage from './assets/al-mashreq-logo.png'
import paymentCheckImage from './assets/payment-check.png'
import returnedCheckImage from './assets/returned-check.png'
import cashInflowImage from './assets/money.png'
import visaPaymentImage from './assets/visa.png'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'

function App() {
  // Company data state
  const [companyData, setCompanyData] = useState([])
  const [companyHeaders, setCompanyHeaders] = useState([])
  const [companyFileName, setCompanyFileName] = useState('')
  const [companyError, setCompanyError] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)
  
  // Bank data state
  const [bankData, setBankData] = useState([])
  const [bankHeaders, setBankHeaders] = useState([])
  const [bankFileName, setBankFileName] = useState('')
  const [bankError, setBankError] = useState('')
  const [bankLoading, setBankLoading] = useState(false)
  
  // Preview limits for large files
  const PREVIEW_ROW_LIMIT = 500
  const LOAD_MORE_STEP = 1000
  
  // Classification types configuration
  const classificationTypes = {
      'checks-collection': {
        name: 'Checks Collection',
        icon: <img src={paymentCheckImage} alt="Returned Checks" width={40} height={40}/>,
        companyPatterns: [
          { pattern: 'اعادة ايداع شيك راجع', matchType: 'startsWith' },
          { pattern: 'ايداع شيكات مقاصة', matchType: 'startsWith' },
          { pattern: 'و ذلك عن تحصيل شيك', matchType: 'includes' }
        ],
        bankPatterns: [
          { pattern: 'CHECK DEPOSIT', matchType: 'startsWith' },
          { pattern: 'CLEAR. DEPO.', matchType: 'startsWith' },
          { pattern: 'INTERNAL CLEARING', matchType: 'includes' }
        ],
        dateTolerance: 4,
        useDateTolerance: true
      },
    'returned-checks': {
      name: 'Returned Checks',
      icon: <img src={returnedCheckImage} alt="Returned Checks"/>,
      companyPatterns: [
        { pattern: 'شيك راجع', matchType: 'startsWith' },
        { pattern: 'ارجاع شيك بعد اعادة ايداعه', matchType: 'includes' },
      ],
      bankPatterns: [
        { pattern: 'RETURN CHEQUE , TRANSIT', matchType: 'startsWith' },
        { pattern: 'RETURNED CHECK FROM OTHER BANK', matchType: 'includes' },
        { pattern: 'RETURNED POST DATED/INSTALLMENT CHEQUES', matchType: 'includes' }
      ],
      dateTolerance: 4,
      useDateTolerance: true
    },
    'disbursement': {
      name: 'Disbursement',
      icon: '💸',
        companyPatterns: [
          { pattern: 'سند صرف', matchType: 'startsWith' },
          { pattern: 'دفعة أدعاء', matchType: 'startsWith' }
        ],
        bankPatterns: [
          { pattern: 'CLEARING WITHDRAWAL', matchType: 'startsWith' },
          { pattern: 'SWIFT TRANSFER', matchType: 'startsWith' },
          { pattern: 'TRANSFER FROM AN ACCOUNT TO AN ACCOUNT', matchType: 'includes' }
        ],
      dateTolerance: 3,
      useDateTolerance: true
    },
    'cash-inflow': {
      name: 'Cash Inflow',
      icon: <img src={cashInflowImage} alt="Cash Inflow" />,
        companyPatterns: [
          { pattern: 'حوالة ', matchType: 'startsWith' },
          { pattern: 'نقل ختم', matchType: 'startsWith' },
          { pattern: 'ايداع نقدي', matchType: 'startsWith' }
        ],
      bankPatterns: [
        { pattern: 'CASH DEPOSIT', matchType: 'startsWith' },
        { pattern: 'Electronic Transfer', matchType: 'startsWith' },
        { pattern: 'TRANSFER FROM AN ACCOUNT TO AN ACCOUNT', matchType: 'includes' }
      ],
      dateTolerance: 3,
      useDateTolerance: true
    },
    "visa-payment": {
      name: 'Visa Payment',
      icon: <img src={visaPaymentImage} alt="Visa Payment" />,
      companyPatterns: [
        { pattern: 'ختم بوليصة سيارات', matchType: 'startsWith' },
        { pattern: '1112111102', matchType: 'startsWith' },
        { pattern: 'فيزا', matchType: 'startsWith' }

      ],
      bankPatterns: [
        { pattern: 'Purchase', matchType: 'startsWith' },
        { pattern: 'LOAN TRANS', matchType: 'includes' }
      ],
      dateTolerance: 3,
      useDateTolerance: true
    }
  }
  
  const [companyPreviewLimit, setCompanyPreviewLimit] = useState(PREVIEW_ROW_LIMIT)
  const [bankPreviewLimit, setBankPreviewLimit] = useState(PREVIEW_ROW_LIMIT)
  
  // Classification state
  const [companyClassifiedData, setCompanyClassifiedData] = useState([])
  const [bankClassifiedData, setBankClassifiedData] = useState([])
  const [selectedClassificationType, setSelectedClassificationType] = useState('returned-checks')

  // Checks Collection Reconciliation results
  const [checksCollectionResults, setChecksCollectionResults] = useState(null)
  const [reconciliationInProgress, setReconciliationInProgress] = useState(false)
  
  // Editable rules state
  const [editableRules, setEditableRules] = useState(classificationTypes)
  const [isEditingRules, setIsEditingRules] = useState(false)
  
  // Drag over states
  const [companyDragOver, setCompanyDragOver] = useState(false)
  const [bankDragOver, setBankDragOver] = useState(false)

  // Dynamic column mapping for reconciliation
  const [columnMapping, setColumnMapping] = useState({
    companyDateColumn: 'التاريخ',
    companyAmountColumn: 'مدين',
    companyCheckColumn: 'رقم الشيك المستخرج',
    bankDateColumn: '',
    bankAmountColumn: '',
    bankCheckColumn: ''
  })

  // Essential column mappings (editable)
  const [essentialMappings, setEssentialMappings] = useState([
    { id: 'amount', label: '💰 Amount Column', companyColumn: 'دائن', bankColumn: '', icon: '💰' },
    { id: 'check', label: '🧾 Check Column (Required for checks)', companyColumn: 'رقم الشيك المستخرج', bankColumn: '', icon: '🧾', optional: true },
    { id: 'date', label: '📅 Date Column (Optional)', companyColumn: 'التاريخ', bankColumn: '', icon: '📅', optional: true }
  ])

  // Custom column mappings (add/delete functionality)
  const [customMappings, setCustomMappings] = useState([])

  // Classification column configuration
  const [classificationColumns, setClassificationColumns] = useState({
    companyColumn: 'البيان',
    bankColumn: '' // Will be auto-detected
  })

  const [showColumnMapping, setShowColumnMapping] = useState(false)

  // Progress state for reconciliation
  const [reconciliationProgress, setReconciliationProgress] = useState({
    processed: 0,
    total: 0,
    percentage: 0
  })

  // Auto-detect bank columns when bank data loads
  useEffect(() => {
    if (bankHeaders.length > 0) {
      const detectedColumns = {
        bankDateColumn: bankHeaders.find(h => h && h.toString().toLowerCase().includes('post') && h.toString().toLowerCase().includes('date')) || '',
        bankAmountColumn: bankHeaders.find(h => h && h.toString().toLowerCase().includes('credit')) || '',
        bankCheckColumn: bankHeaders.find(h => h && h.toString().toLowerCase().includes('doc-num')) || ''
      }
      
      setColumnMapping(prev => ({
        ...prev,
        ...detectedColumns
      }))
      
      // Auto-detect bank classification column (NARRITIVE)
      const bankClassificationColumn = bankHeaders.find(h => h && 
        (h.toString().toLowerCase().includes('narrative') || 
         h.toString().toLowerCase().includes('narritive') ||
         h.toString().toLowerCase().includes('description') ||
         h.toString().toLowerCase().includes('details'))) || ''
      
      // Update bank classification column if detected
      if (bankClassificationColumn && !classificationColumns.bankColumn) {
        setClassificationColumns(prev => ({
          ...prev,
          bankColumn: bankClassificationColumn
        }))
        console.log('🎯 Auto-detected bank classification column:', bankClassificationColumn)
      }
    }
  }, [bankHeaders, classificationColumns.bankColumn])

  // Helpers and classification (defined before use)
  const getBankNarrativeIndex = useCallback((headers) => {
    const candidates = ['narrative', 'narritive', 'narr', 'description', 'details']
    return headers.findIndex(header => {
      if (!header) return false
      const h = header.toString().toLowerCase().trim()
      return candidates.some(key => h.includes(key))
    })
  }, [])

  // Helper function to check pattern matching with configurable match type
  const checkPatternMatch = useCallback((text, patternObj) => {
    const textStr = text.toString().trim()
    const patternValue = typeof patternObj === 'string' ? patternObj : patternObj.pattern
    const matchType = typeof patternObj === 'string' ? 'startsWith' : patternObj.matchType || 'startsWith'
    
    if (matchType === 'includes') {
      return textStr.includes(patternValue)
    } else if (matchType === 'both') {
      return textStr.startsWith(patternValue) || textStr.includes(patternValue)
    } else {
      return textStr.startsWith(patternValue)
    }
  }, [])

  const classifyCompanyData = useCallback((data, headers, classificationType = 'checks-collection') => {
    console.log('🔍 Company classification:', classificationType)
    const classificationColumnIndex = headers.findIndex(header => header === classificationColumns.companyColumn)
    if (classificationColumnIndex === -1) {
      console.log(`❌ Classification column '${classificationColumns.companyColumn}' not found`)
      return { classified: [], remaining: data }
    }

    const patterns = editableRules[classificationType]?.companyPatterns || []
    console.log('📋 Company patterns:', patterns)
    const classified = []
    const remaining = []

    data.forEach(row => {
      const classificationValue = row[classificationColumnIndex]
      const shouldClassify = classificationValue && patterns.some(pattern =>
        checkPatternMatch(classificationValue, pattern)
      )

      if (shouldClassify) {
        classified.push(row)
      } else {
        remaining.push(row)
      }
    })

    return { classified, remaining }
  }, [editableRules, classificationColumns, checkPatternMatch])

  const classifyBankData = useCallback((data, headers, classificationType = 'returned-checks') => {
    console.log('🔍 Bank classification:', classificationType)
    console.log('🎯 Using bank classification column:', classificationColumns.bankColumn)
    
    const bankClassificationColumnIndex = headers.findIndex(header => header === classificationColumns.bankColumn)
    if (bankClassificationColumnIndex === -1) {
      console.log(`❌ Bank classification column '${classificationColumns.bankColumn}' not found`)
      return { classified: [], remaining: data }
    }

    const patterns = editableRules[classificationType]?.bankPatterns || []
    console.log('📋 Bank patterns:', patterns)
    const normalizeText = (text) => text.toString().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()

    const classified = []
    const remaining = []

    data.forEach(row => {
      const classificationValue = row[bankClassificationColumnIndex]
      
      // Pattern matching using configurable match types
      const shouldClassify = patterns.some(pattern => 
        checkPatternMatch(classificationValue, pattern)
      )

      if (shouldClassify) {
        const matchedPatterns = patterns.filter(pattern => 
          checkPatternMatch(classificationValue, pattern)
        )
        console.log(`✅ Bank classified row: "${classificationValue}" matched patterns:`, matchedPatterns)
        classified.push(row)
      } else {
        remaining.push(row)
      }
    })

    return { classified, remaining }
  }, [editableRules, classificationColumns, checkPatternMatch])
  
  // Handle classification type change
  const handleClassificationTypeChange = useCallback((type) => {
    setSelectedClassificationType(type)
    
    // Re-classify data with new type
    if (companyData.length > 0) {
      const { classified } = classifyCompanyData(companyData, companyHeaders, type)
      setCompanyClassifiedData(classified)
    }
    
    if (bankData.length > 0) {
      const { classified } = classifyBankData(bankData, bankHeaders, type)
      setBankClassifiedData(classified)
    }
    
    // Clear reconciliation results when changing classification type
    setChecksCollectionResults(null)
  }, [companyData, companyHeaders, bankData, bankHeaders, classifyCompanyData, classifyBankData])

  // Helper function to get descriptions for classification types
  const getClassificationDescription = (key) => {
    const descriptions = {
      'returned-checks': 'Identifies returned checks based on specific Arabic patterns in transaction narratives',
      'disbursement': 'Recognizes disbursement transactions for payments, transfers, and withdrawals',
      'payment': 'Classifies general payment transactions and settlements',
      'exchange': 'Identifies currency exchange and foreign exchange operations'
    }
    return descriptions[key] || 'Classify transactions based on predefined patterns'
  }

  // Handle rule editing
  const updateRule = useCallback((classificationType, dataType, index, newValue) => {
    setEditableRules(prev => ({
      ...prev,
      [classificationType]: {
        ...prev[classificationType],
        [`${dataType}Patterns`]: prev[classificationType][`${dataType}Patterns`].map((pattern, i) => 
          i === index ? newValue : pattern
        )
      }
    }))
  }, [])

  const addRule = useCallback((classificationType, dataType) => {
    setEditableRules(prev => ({
      ...prev,
      [classificationType]: {
        ...prev[classificationType],
        [`${dataType}Patterns`]: [...prev[classificationType][`${dataType}Patterns`], { pattern: '', matchType: 'startsWith' }]
      }
    }))
  }, [])

  const removeRule = useCallback((classificationType, dataType, index) => {
    setEditableRules(prev => ({
      ...prev,
      [classificationType]: {
        ...prev[classificationType],
        [`${dataType}Patterns`]: prev[classificationType][`${dataType}Patterns`].filter((_, i) => i !== index)
      }
    }))
  }, [])

  const saveRules = useCallback(() => {
    console.log('🔧 SAVING RULES - Re-classifying data with updated patterns')
    console.log('Current type:', selectedClassificationType)
    console.log('Current patterns:', editableRules[selectedClassificationType])
    
    // Re-classify data with updated rules
    if (companyData.length > 0) {
      const { classified } = classifyCompanyData(companyData, companyHeaders, selectedClassificationType)
      console.log('✅ Company re-classification:', classified.length, 'rows')
      setCompanyClassifiedData(classified)
    }
    
    if (bankData.length > 0) {
      const { classified } = classifyBankData(bankData, bankHeaders, selectedClassificationType)
      console.log('✅ Bank re-classification:', classified.length, 'rows')
      setBankClassifiedData(classified)
    }
    
    setIsEditingRules(false)
    setChecksCollectionResults(null)
    console.log('🎉 Rules saved and data updated!')
  }, [companyData, companyHeaders, bankData, bankHeaders, selectedClassificationType, classifyCompanyData, classifyBankData, editableRules])

  const processFile = useCallback((file, type) => {
    const isCompany = type === 'company'
    const isLoading = isCompany ? companyLoading : bankLoading
    
    if (isLoading) return // Prevent multiple uploads
    
    // Set loading state
    if (isCompany) {
      setCompanyError('')
      setCompanyFileName(file.name)
      setCompanyLoading(true)
    } else {
      setBankError('')
      setBankFileName(file.name)
      setBankLoading(true)
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        
        if (jsonData.length === 0) {
          if (isCompany) {
            setCompanyError('The Excel file appears to be empty')
            setCompanyLoading(false)
          } else {
            setBankError('The Excel file appears to be empty')
            setBankLoading(false)
          }
          return
        }
        
        const [headerRow, ...rows] = jsonData
        if (isCompany) {
          setCompanyHeaders(headerRow || [])
          setCompanyData(rows)
          setCompanyPreviewLimit(PREVIEW_ROW_LIMIT)
          
          // Classify company data
          const companyClassification = classifyCompanyData(rows, headerRow || [], selectedClassificationType)
          setCompanyClassifiedData(companyClassification.classified)
          // Remaining data not displayed per request
          
          setCompanyLoading(false)
        } else {
          setBankHeaders(headerRow || [])
          setBankData(rows)
          setBankPreviewLimit(PREVIEW_ROW_LIMIT)
          
          // Classify bank data
          const bankClassification = classifyBankData(rows, headerRow || [], selectedClassificationType)
          setBankClassifiedData(bankClassification.classified)
          // Remaining data not displayed per request
          
          setBankLoading(false)
        }
      } catch (err) {
        const errorMsg = 'Error reading Excel file. Please make sure it\'s a valid Excel file.'
        if (isCompany) {
          setCompanyError(errorMsg)
          setCompanyLoading(false)
        } else {
          setBankError(errorMsg)
          setBankLoading(false)
        }
        console.error('Error processing file:', err)
      }
    }
    
    reader.onerror = () => {
      const errorMsg = 'Error reading the file'
      if (isCompany) {
        setCompanyError(errorMsg)
        setCompanyLoading(false)
      } else {
        setBankError(errorMsg)
        setBankLoading(false)
      }
    }
    
    reader.readAsArrayBuffer(file)
  }, [companyLoading, bankLoading, classifyCompanyData, classifyBankData, selectedClassificationType])

  const handleDrop = useCallback((e, type) => {
    e.preventDefault()
    if (type === 'company') {
      setCompanyDragOver(false)
    } else {
      setBankDragOver(false)
    }
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    )
    
    if (excelFile) {
      processFile(excelFile, type)
    } else {
      const errorMsg = 'Please upload a valid Excel file (.xlsx or .xls)'
      if (type === 'company') {
        setCompanyError(errorMsg)
      } else {
        setBankError(errorMsg)
      }
    }
  }, [processFile])

  const handleDragOver = useCallback((e, type) => {
    e.preventDefault()
    if (type === 'company') {
      setCompanyDragOver(true)
    } else {
      setBankDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault()
    if (type === 'company') {
      setCompanyDragOver(false)
    } else {
      setBankDragOver(false)
    }
  }, [])

  const handleFileInput = useCallback((e, type) => {
    const file = e.target.files[0]
    if (file) {
      processFile(file, type)
    }
  }, [processFile])

  const clearData = (type) => {
    if (type === 'company') {
      setCompanyData([])
      setCompanyHeaders([])
      setCompanyFileName('')
      setCompanyError('')
      setCompanyLoading(false)
      setCompanyClassifiedData([])
      // Remaining data not displayed per request
      setCompanyPreviewLimit(PREVIEW_ROW_LIMIT)
    } else {
      setBankData([])
      setBankHeaders([])
      setBankFileName('')
      setBankError('')
      setBankLoading(false)
      setBankClassifiedData([])
      // Remaining data not displayed per request
      setBankPreviewLimit(PREVIEW_ROW_LIMIT)
    }
  }

  const clearAllData = () => {
    clearData('company')
    clearData('bank')
    setChecksCollectionResults(null)
  }

  // Format date values
  const formatDateValue = (value) => {
    if (!value) return value
    
    // Check if it's an Excel serial date (number between 1 and 100000)
    if (typeof value === 'number' && value > 1 && value < 100000) {
      try {
        // Excel serial date to JavaScript Date
        const date = new Date((value - 25569) * 86400 * 1000)
        return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
      } catch {
        return value
      }
    }
    
    return value
  }

  // Format company data with proper date formatting
  const formatCompanyData = useCallback((data, headers) => {
    // Check for both possible date column names
    const تاريخIndex = headers.findIndex(header => 
      header === 'التاريخ' || header === 'تاريخ الادخال'
    )
    
    if (تاريخIndex === -1) return data
    
    return data.map(row => {
      const newRow = [...row]
      if (newRow[تاريخIndex]) {
        newRow[تاريخIndex] = formatDateValue(newRow[تاريخIndex])
      }
      return newRow
    })
  }, [])

  // Download data as Excel file
  const downloadAsExcel = (data, headers, filename) => {
    if (!data || data.length === 0) {
      alert('No data to download')
      return
    }

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet format
      const worksheetData = [headers, ...data]
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      // Generate and download file
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  // Format bank data: format any column with a header including "date"
  const formatBankData = useCallback((data, headers) => {
    if (!headers || headers.length === 0) return data
    const dateColumnIndexes = headers
      .map((header, idx) => ({ header, idx }))
      .filter(h => h.header && h.header.toString().toLowerCase().includes('date'))
      .map(h => h.idx)

    if (dateColumnIndexes.length === 0) return data

    return data.map(row => {
      const newRow = [...row]
      dateColumnIndexes.forEach(i => {
        if (newRow[i] !== undefined && newRow[i] !== null) {
          newRow[i] = formatDateValue(newRow[i])
        }
      })
      return newRow
    })
  }, [])

  // Extract check numbers from البيان column for all rows
  const extractCheckNumbers = useCallback((data, headers) => {
    const البيانIndex = headers.findIndex(header => header === 'البيان')
    
    if (البيانIndex === -1) return data

    return data.map((row) => {
      const البيانValue = row[البيانIndex]
      let checkNumber = ''

      if (البيانValue) {
        // Extract numbers up to 8 digits, excluding those that are part of date-like patterns
        const text = البيانValue.toString()
        const numbers = text.match(/\d{1,8}/g)

        if (numbers) {
          const validCheckNumber = numbers.find(num => 
            num.length <= 8 &&
            // exclude patterns like 12/3456 or 2025/08 or /123456/
            !text.includes(`${num}/`) && 
            !text.includes(`/${num}`)
          )
          checkNumber = validCheckNumber || ''
        }
      }

      // Add check number to a new column
      const newRow = [...row]
      newRow.push(checkNumber)
      return newRow
    })
  }, [])


  

  

  // Helper function to normalize check numbers (pad with leading zeros to 8 digits)
  const normalizeCheckNumber = useCallback((checkNumber) => {
    if (!checkNumber) return ''
    
    // Convert to string and remove any spaces
    const cleanNumber = checkNumber.toString().trim()
    
    // If empty after cleaning, return empty string
    if (!cleanNumber) return ''
    
    // Pad with leading zeros to make it 8 digits (minimum)
    const padded = cleanNumber.padStart(8, '0')
    
    console.log(`🔢 Check normalization: "${checkNumber}" → "${padded}"`)
    
    return padded
  }, [])

  // Helper function to parse date and check if bank date matches company date with configurable tolerance
  const isDateMatch = useCallback((companyDate, bankDate) => {
    if (!companyDate || !bankDate) return false
    
    // Get current classification type settings
    const currentType = editableRules[selectedClassificationType]
    const useTolerance = currentType?.useDateTolerance ?? true
    const toleranceDays = currentType?.dateTolerance ?? 4
    
    try {
      // Handle different date formats
      const parseDate = (dateStr) => {
        if (typeof dateStr === 'number') {
          // Excel serial date
          return new Date((dateStr - 25569) * 86400 * 1000)
        }
        if (typeof dateStr === 'string') {
          // Try DD/MM/YYYY format first
          const parts = dateStr.split('/')
          if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0])
          }
          // Try other formats
          return new Date(dateStr)
        }
        return new Date(dateStr)
      }
      
      const companyDateObj = parseDate(companyDate)
      const bankDateObj = parseDate(bankDate)
      
      if (isNaN(companyDateObj.getTime()) || isNaN(bankDateObj.getTime())) return false
      
      // If tolerance is disabled, require exact date match (same day)
      if (!useTolerance) {
        return companyDateObj.toDateString() === bankDateObj.toDateString()
      }
      
      // Check if dates are equal or bank date is within tolerance days after company date
      const diffTime = bankDateObj.getTime() - companyDateObj.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      console.log(`📅 Date matching: Company=${companyDate}, Bank=${bankDate}, Tolerance=${toleranceDays} days, diffDays=${diffDays.toFixed(2)}`)
      
      return diffDays >= 0 && diffDays <= toleranceDays
    } catch {
      return false
    }
  }, [editableRules, selectedClassificationType])

  // Test function for date tolerance (for debugging)
  const testDateTolerance = useCallback(() => {
    const currentType = editableRules[selectedClassificationType]
    const toleranceDays = currentType?.dateTolerance ?? 4
    const useTolerance = currentType?.useDateTolerance ?? true
    
    console.log(`🧪 Testing Date Tolerance for ${currentType?.name || selectedClassificationType}`)
    console.log(`📊 Settings: useTolerance=${useTolerance}, days=${toleranceDays}`)
    
    // Test cases
    const testCases = [
      { company: '15/01/2025', bank: '15/01/2025', expected: true, description: 'Same day' },
      { company: '15/01/2025', bank: '16/01/2025', expected: true, description: 'Next day (+1)' },
      { company: '15/01/2025', bank: '17/01/2025', expected: true, description: 'Two days (+2)' },
      { company: '15/01/2025', bank: '19/01/2025', expected: useTolerance ? true : false, description: `Four days (+4)${useTolerance ? ' within tolerance' : ' exact match required'}` },
      { company: '15/01/2025', bank: '20/01/2025', expected: false, description: 'Five days (+5) outside tolerance' },
      { company: '15/01/2025', bank: '14/01/2025', expected: false, description: 'Previous day (-1)' },
    ]
    
    testCases.forEach((testCase, index) => {
      const result = isDateMatch(testCase.company, testCase.bank)
      const emoji = result === testCase.expected ? '✅' : '❌'
      console.log(`${emoji} Test ${index + 1}: ${testCase.description} - Company: ${testCase.company}, Bank: ${testCase.bank}, Result: ${result}, Expected: ${testCase.expected}`)
    })
  }, [isDateMatch, editableRules, selectedClassificationType])

  // Test function for check number normalization (for debugging)
  const testCheckNumberNormalization = useCallback(() => {
    console.log(`🔢 Testing Check Number Normalization`)
    
    const testCases = [
      { original: '1234', description: '4 digits' },
      { original: '567890', description: '6 digits' },
      { original: '12345678', description: '8 digits (already normalized)' },
      { original: '123456789', description: '9 digits (longer than 8)' },
      { original: '0', description: 'Single zero' },
      { original: '00', description: 'Double zero' },
      { original: ' 1234 ', description: 'With spaces' },
      { original: '', description: 'Empty string' },
      { original: 'abc123', description: 'With letters' },
    ]
    
    console.log('Test cases for check number normalization:')
    testCases.forEach((testCase, index) => {
      const normalized = normalizeCheckNumber(testCase.original)
      console.log(`${index + 1}. "${testCase.original}" (${testCase.description}) → "${normalized}"`)
    })
    
    // Test matching scenarios
    console.log('\nMatching scenarios:')
    const companyChecks = ['1234', '056789', '1234567']
    const bankChecks = ['00001234', '00567890', '01234567']
    
    companyChecks.forEach((companyCheck, index) => {
      const bankCheck = bankChecks[index]
      const normalizedCompany = normalizeCheckNumber(companyCheck)
      const normalizedBank = normalizeCheckNumber(bankCheck)
      const match = normalizedCompany === normalizedBank
      console.log(`Company: "${companyCheck}" (${normalizedCompany}) ≈ Bank: "${bankCheck}" (${normalizedBank}) → ${match ? '✅ MATCH' : '❌ NO MATCH'}`)
    })
  }, [normalizeCheckNumber])

  // Legacy matchChecksCollection function replaced with performAsyncReconciliation for better performance

  // Perform async reconciliation in chunks
  const performAsyncReconciliation = useCallback(async () => {
    console.log('🔄 Starting async reconciliation process...')
    
    // Get formatted data with checks
    const formattedCompanyData = formatCompanyData(
      extractCheckNumbers(companyClassifiedData, companyHeaders), 
      [...companyHeaders, 'رقم الشيك المستخرج']
    )
    const formattedBankData = formatBankData(bankClassifiedData, bankHeaders)
    
    // Find column indices from Essential Columns configuration
    const getColumnIndices = () => {
      const companyHeadersWithChecks = [...companyHeaders, 'رقم الشيك المستخرج']
      
      // Get Essential Column mappings
      const amountMapping = essentialMappings.find(m => m.id === 'amount')
      const checkMapping = essentialMappings.find(m => m.id === 'check') 
      const dateMapping = essentialMappings.find(m => m.id === 'date')
      
      console.log('🔍 Essential Mappings:', { amountMapping, checkMapping, dateMapping })
      
      // Validate required mappings
      if (!amountMapping || !amountMapping.companyColumn || !amountMapping.bankColumn) {
        throw new Error('💰 Amount column mapping is required but not configured')
      }
      
      // Check mapping is only required for check-based payment types
      const requiresCheckMapping = ['checks-collection', 'returned-checks'].includes(selectedClassificationType)
      if (requiresCheckMapping && (!checkMapping || !checkMapping.companyColumn || !checkMapping.bankColumn)) {
        throw new Error('🧾 Check column mapping is required but not configured')
      }
      
      return {
        // Company column indices
        companyAmountIndex: companyHeadersWithChecks.indexOf(amountMapping.companyColumn),
        companyCheckIndex: checkMapping && checkMapping.companyColumn ? 
          companyHeadersWithChecks.indexOf(checkMapping.companyColumn) : -1,
        companyDateIndex: dateMapping && dateMapping.companyColumn ? 
          companyHeadersWithChecks.indexOf(dateMapping.companyColumn) : -1,
        
        // Bank column indices  
        bankAmountIndex: bankHeaders.indexOf(amountMapping.bankColumn),
        bankCheckIndex: checkMapping && checkMapping.bankColumn ? 
          bankHeaders.indexOf(checkMapping.bankColumn) : -1,
        bankDateIndex: dateMapping && dateMapping.bankColumn ? 
          bankHeaders.indexOf(dateMapping.bankColumn) : -1
      }
    }
    
    const indices = getColumnIndices()
    const { 
      companyAmountIndex,
      companyCheckIndex, 
      companyDateIndex,
      bankAmountIndex,
      bankCheckIndex,
      bankDateIndex 
    } = indices
    
    console.log('📍 Column indices:', indices)

    const matchedCompany = []
    const unmatchedCompany = []
    const matchedBank = []
    const unmatchedBank = []
    const reviewCompany = []
    const reviewBank = []

    // Process company data in chunks
    const chunkSize = 50 // Process 50 rows at a time
    const companyChunks = []
    for (let i = 0; i < formattedCompanyData.length; i += chunkSize) {
      companyChunks.push(formattedCompanyData.slice(i, i + chunkSize))
    }

    console.log(`📊 Processing ${formattedCompanyData.length} company rows in ${companyChunks.length} chunks of ${chunkSize}`)
    
    // Initialize progress
    setReconciliationProgress({
      processed: 0,
      total: formattedCompanyData.length,
      percentage: 0
    })
    
    for (let chunkIndex = 0; chunkIndex < companyChunks.length; chunkIndex++) {
      const chunk = companyChunks[chunkIndex]
      
      for (const companyRow of chunk) {
        const companyDate = companyDateIndex !== -1 ? companyRow[companyDateIndex] : null
        const companyCheckNumber = companyCheckIndex !== -1 ? companyRow[companyCheckIndex] : null
        const companyPremiumAmount = companyRow[companyAmountIndex]
        
        // For visa payments, we don't require check numbers
        const requiresCheckNumber = ['checks-collection', 'returned-checks'].includes(selectedClassificationType)
        
        if (!companyPremiumAmount) {
          console.log('⏭️ Skipping company row - missing amount:', { companyPremiumAmount })
          unmatchedCompany.push(companyRow)
          continue
        }
        
        if (requiresCheckNumber && !companyCheckNumber) {
          console.log('⏭️ Skipping company row - missing check number:', { companyCheckNumber })
          unmatchedCompany.push(companyRow)
          continue
        }

        // Find matching bank entry
        let matchingBank = formattedBankData.find(bankRow => {
          const bankPostDate = bankDateIndex !== -1 ? bankRow[bankDateIndex] : null
          const bankDocNum = bankCheckIndex !== -1 ? bankRow[bankCheckIndex] : null
          const bankCreditAmount = bankRow[bankAmountIndex]
          
          const dateMatch = companyDate && bankPostDate ? isDateMatch(companyDate, bankPostDate) : true
          const amountMatch = bankCreditAmount && companyPremiumAmount && 
                 Math.abs(parseFloat(companyPremiumAmount) - parseFloat(bankCreditAmount)) < 0.01
          
          // For check-based payments, require check number match
          if (requiresCheckNumber) {
            const normalizedBankCheck = normalizeCheckNumber(bankDocNum)
            const normalizedCompanyCheck = normalizeCheckNumber(companyCheckNumber)
            const checkMatch = normalizedBankCheck && normalizedCompanyCheck && normalizedBankCheck === normalizedCompanyCheck
            return dateMatch && checkMatch && amountMatch
          } else {
            // For visa payments and other non-check payments, match by amount and date only
            return dateMatch && amountMatch
          }
        })

        if (matchingBank) {
          matchedCompany.push(companyRow)
          if (!matchedBank.find(row => row === matchingBank)) {
            matchedBank.push(matchingBank)
          }
        } else {
          // Check for review match
          const reviewBankMatch = formattedBankData.find(bankRow => {
            const bankPostDate = bankDateIndex !== -1 ? bankRow[bankDateIndex] : null
            const bankDocNum = bankCheckIndex !== -1 ? bankRow[bankCheckIndex] : null
            const bankCreditAmount = bankRow[bankAmountIndex]
            
            const amountMatch = bankCreditAmount && companyPremiumAmount && 
                   Math.abs(parseFloat(companyPremiumAmount) - parseFloat(bankCreditAmount)) < 0.01
            
            const hasDates = companyDate && bankPostDate
            const dateMismatch = hasDates && !isDateMatch(companyDate, bankPostDate)
            
            // For check-based payments, require check number match
            if (requiresCheckNumber) {
              const normalizedBankCheck = normalizeCheckNumber(bankDocNum)
              const normalizedCompanyCheck = normalizeCheckNumber(companyCheckNumber)
              const checkMatch = normalizedBankCheck && normalizedCompanyCheck && normalizedBankCheck === normalizedCompanyCheck
              return checkMatch && amountMatch && dateMismatch
            } else {
              // For visa payments and other non-check payments, match by amount and date mismatch only
              return amountMatch && dateMismatch
            }
          })

          if (reviewBankMatch) {
            reviewCompany.push(companyRow)
            if (!reviewBank.find(row => row === reviewBankMatch)) {
              reviewBank.push(reviewBankMatch)
            }
          } else {
            unmatchedCompany.push(companyRow)
          }
        }
      }
      
      // Update progress
      const processed = Math.min((chunkIndex + 1) * chunkSize, formattedCompanyData.length)
      setReconciliationProgress({
        processed,
        total: formattedCompanyData.length,
        percentage: Math.round((processed / formattedCompanyData.length) * 100)
      })
      
      // Yield control after each chunk
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Add unmatched bank entries
    await new Promise(resolve => setTimeout(resolve, 10))
    formattedBankData.forEach(bankRow => {
      if (!matchedBank.find(row => row === bankRow) && !reviewBank.find(frame => frame === bankRow)) {
        unmatchedBank.push(bankRow)
      }
    })

    console.log(`✅ Reconciliation complete: ${matchedCompany.length} matched, ${unmatchedCompany.length} unmatched, ${reviewCompany.length} for review`)
    
    return {
      matchedCompany,
      unmatchedCompany,
      matchedBank,
      unmatchedBank,
      reviewCompany,
      reviewBank
    }
  }, [companyClassifiedData, companyHeaders, bankClassifiedData, bankHeaders, formatCompanyData, extractCheckNumbers, formatBankData, isDateMatch, essentialMappings, normalizeCheckNumber, setReconciliationProgress, selectedClassificationType])

  // Run reconciliation with progress indicator and chunked processing
  const runReconciliation = useCallback(async () => {
    setReconciliationInProgress(true)
    
    try {
      console.log('🚀 Starting reconciliation with async processing...')
      
      // Yield immediately to show loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const results = await performAsyncReconciliation()
      setChecksCollectionResults(results)
      
    } catch (error) {
      console.error('❌ Reconciliation error:', error)
      setChecksCollectionResults({
        matchedCompany: [],
        unmatchedCompany: [],
        matchedBank: [],
        unmatchedBank: [],
        reviewCompany: [],
        reviewBank: []
      })
    } finally {
      setReconciliationInProgress(false)
    }
  }, [performAsyncReconciliation])

  // Clear reconciliation results function
  const clearReconciliationResults = useCallback(() => {
    setChecksCollectionResults(null)
    setReconciliationInProgress(false)
    setReconciliationProgress({
      processed: 0,
      total: 0,
      percentage: 0
    })
  }, [])


  // Compute some derived data with memo to avoid heavy recalculations on each render

  // Get company data with extracted check numbers and formatted dates
  const companyDataWithChecks = useMemo(() => {
    if (companyData.length > 0 && companyHeaders.length > 0) {
      return formatCompanyData(
        extractCheckNumbers(companyData, companyHeaders),
        [...companyHeaders, 'رقم الشيك المستخرج']
      )
    }
    return []
  }, [companyData, companyHeaders, extractCheckNumbers, formatCompanyData])

  // Company classified with formatted dates and extracted check numbers column
  const formattedCompanyClassifiedWithChecks = useMemo(() => {
    if (companyClassifiedData.length === 0) return []
    const withChecks = extractCheckNumbers(companyClassifiedData, companyHeaders)
    return formatCompanyData(withChecks, [...companyHeaders, 'رقم الشيك المستخرج'])
  }, [companyClassifiedData, companyHeaders, extractCheckNumbers, formatCompanyData])

  // Bank previews and classified with formatted dates
  const bankDataFormatted = useMemo(() => {
    if (bankData.length === 0) return []
    return formatBankData(bankData, bankHeaders)
  }, [bankData, bankHeaders, formatBankData])

  const bankClassifiedDataFormatted = useMemo(() => {
    if (bankClassifiedData.length === 0) return []
    return formatBankData(bankClassifiedData, bankHeaders)
  }, [bankClassifiedData, bankHeaders, formatBankData])

  // Get headers with check number column
  const companyHeadersWithChecks = useMemo(() => {
    return companyHeaders.length > 0 ? [...companyHeaders, 'رقم الشيك المستخرج'] : []
  }, [companyHeaders])

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-section">
              <img src={logoImage} alt="AL-MASHREQ INSURANCE CO." className="logo-image" width={200} height={70} />
              <div className="logo-text">
                <h1>Bank Reconciliation Assistant</h1>
                <p>Advanced Excel Data Processing & Reconciliation</p>
              </div>
            </div>
            <nav className="header-nav">
              
              {/* <div className="nav-item">
                <span className="nav-icon">📊</span>
                <span>Data Processing</span>
              </div>
              <div className="nav-item">
                <span className="nav-icon">🔄</span>
                <span>Reconciliation</span>
              </div>
              <div className="nav-item">
                <span className="nav-icon">📈</span>
                <span>Analytics</span>
              </div> */}
            </nav>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="main-content">
          <div className="content-header">
            <h2>Upload & Process Your Data</h2>
            <p>Upload company and bank Excel files separately (.xlsx, .xls) for automated reconciliation</p>
          </div>

          {/* Classification Type Selector - Modern Redesign */}
          {companyData.length > 0 && bankData.length > 0 && (
            <div className="modern-classification-selector">
              <div className="classification-header">
                <h3>🎯 Select Classification Type</h3>
                <p className="classification-description">Choose how to classify transactions in your data for reconciliation</p>
              </div>
              
              <div className="modern-classification-cards">
                {Object.entries(editableRules).map(([key, type]) => (
                  <div
                    key={key}
                    className={`modern-classification-card ${selectedClassificationType === key ? 'selected' : ''}`}
                    onClick={() => handleClassificationTypeChange(key)}
                  >
                    <div className="card-header">
                      <div className="card-icon">{type.icon}</div>
                      <div className="card-status">
                        {selectedClassificationType === key && (
                          <span className="selected-badge">✓ Selected</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <h4 className="card-title">{type.name}</h4>
                      <p className="card-description">
                        {getClassificationDescription(key)}
                      </p>
                      
                     
                    </div>
                    
                  </div>
                ))}
              </div>
              <div className="modern-rules-section">
                <div className="rules-header">
                  <div className="rules-title-group">
                    <h4>⚙️ Classification Rules & Patterns</h4>
                    <p className="rules-subtitle">
                      Configure patterns for: <strong>{editableRules[selectedClassificationType].name}</strong>
                    </p>
                  </div>
                  
                  <div className="rules-controls">
                    <button 
                      className={`modern-toggle-btn ${isEditingRules ? 'editing' : 'viewing'}`}
                      onClick={() => setIsEditingRules(!isEditingRules)}
                    >
                      <span className="btn-icon">{isEditingRules ? '👁️' : '✏️'}</span>
                      <span className="btn-text">
                        {isEditingRules ? 'Preview Rules' : 'Edit Rules'}
                      </span>
                    </button>
                    
                    {isEditingRules && (
                      <button 
                        className="modern-save-btn"
                        onClick={saveRules}
                      >
                        <span className="btn-icon">💾</span>
                        <span className="btn-text">Save Changes</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {isEditingRules ? (
                  <div className="modern-rules-editor">
                    <div className="patterns-grid">
                      {/* Company Patterns Section */}
                      <div className="pattern-section company-patterns">
                        <div className="section-header">
                          <div className="section-icon">🏢</div>
                          <h5>Company Patterns</h5>
                          <span className="pattern-count">{editableRules[selectedClassificationType].companyPatterns.length} patterns</span>
                        </div>
                        
                        <div className="pattern-list">
            {editableRules[selectedClassificationType].companyPatterns.map((pattern, index) => {
              const patternValue = typeof pattern === 'string' ? pattern : pattern.pattern
              const matchType = typeof pattern === 'string' ? 'startsWith' : pattern.matchType || 'startsWith'
              
              return (
                <div key={index} className="modern-pattern-item">
                  <div className="pattern-number">{index + 1}</div>
                  <input
                    type="text"
                    value={patternValue}
                    onChange={(e) => {
                      const newPattern = typeof pattern === 'string' 
                        ? e.target.value 
                        : { pattern: e.target.value, matchType }
                      updateRule(selectedClassificationType, 'company', index, newPattern)
                    }}
                    className="modern-pattern-input"
                    placeholder="Enter company pattern..."
                  />
                  <select
                    value={matchType}
                    onChange={(e) => {
                      const newPattern = typeof pattern === 'string'
                        ? { pattern: patternValue, matchType: e.target.value }
                        : { pattern: patternValue, matchType: e.target.value }
                      updateRule(selectedClassificationType, 'company', index, newPattern)
                    }}
                    className="pattern-match-type-select"
                  >
                    <option value="startsWith">Starts with</option>
                    <option value="includes">Includes</option>
                    <option value="both">Both (Starts with OR Includes)</option>
                  </select>
                  <button 
                    className="modern-remove-pattern"
                    onClick={() => removeRule(selectedClassificationType, 'company', index)}
                    title="Remove this pattern"
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
                          
                          <button 
                            className="modern-add-pattern-btn"
                            onClick={() => addRule(selectedClassificationType, 'company')}
                          >
                            <span>➕</span> Add Company Pattern
                          </button>
                        </div>
                      
                      {/* Bank Patterns Section */}
                      <div className="pattern-section bank-patterns">
                        <div className="section-header">
                          <div className="section-icon">🏦</div>
                          <h5>Bank Patterns</h5>
                          <span className="pattern-count">{editableRules[selectedClassificationType].bankPatterns.length} patterns</span>
                        </div>
                        
                        <div className="pattern-list">
            {editableRules[selectedClassificationType].bankPatterns.map((pattern, index) => {
              const patternValue = typeof pattern === 'string' ? pattern : pattern.pattern
              const matchType = typeof pattern === 'string' ? 'startsWith' : pattern.matchType || 'startsWith'
              
              return (
                <div key={index} className="modern-pattern-item">
                  <div className="pattern-number">{index + 1}</div>
                  <input
                    type="text"
                    value={patternValue}
                    onChange={(e) => {
                      const newPattern = typeof pattern === 'string' 
                        ? e.target.value 
                        : { pattern: e.target.value, matchType }
                      updateRule(selectedClassificationType, 'bank', index, newPattern)
                    }}
                    className="modern-pattern-input"
                    placeholder="Enter bank pattern..."
                  />
                  <select
                    value={matchType}
                    onChange={(e) => {
                      const newPattern = typeof pattern === 'string'
                        ? { pattern: patternValue, matchType: e.target.value }
                        : { pattern: patternValue, matchType: e.target.value }
                      updateRule(selectedClassificationType, 'bank', index, newPattern)
                    }}
                    className="pattern-match-type-select"
                  >
                    <option value="startsWith">Starts with</option>
                    <option value="includes">Includes</option>
                    <option value="both">Both (Starts with OR Includes)</option>
                  </select>
                  <button 
                    className="modern-remove-pattern"
                    onClick={() => removeRule(selectedClassificationType, 'bank', index)}
                    title="Remove this pattern"
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
                          
                          <button 
                            className="modern-add-pattern-btn bank-add-btn"
                            onClick={() => addRule(selectedClassificationType, 'bank')}
                          >
                            <span>➕</span> Add Bank Pattern
                          </button>
                        </div>
                      
                      {/* Simple Date Tolerance Section */}
                      <div className="tolerance-section">
                        <div className="section-header">
                          <div className="section-icon">📅</div>
                          <h5>Date Tolerance</h5>
                          <span className="pattern-count">{editableRules[selectedClassificationType].useDateTolerance ? `${editableRules[selectedClassificationType].dateTolerance} days` : 'Exact match'}</span>
                        </div>
                        
                        <div className="tolerance-controls-simple">
                          <label className="tolerance-check">
                            <input
                              type="checkbox"
                              checked={editableRules[selectedClassificationType].useDateTolerance}
                              onChange={(e) => {
                                const newRules = { ...editableRules }
                                newRules[selectedClassificationType].useDateTolerance = e.target.checked
                                setEditableRules(newRules)
                              }}
                            />
                            <span>Enable date tolerance</span>
                          </label>
                          
                          {editableRules[selectedClassificationType].useDateTolerance && (
                            <div className="tolerance-select-simple">
                              <label>Tolerance:</label>
                              <select
                                value={editableRules[selectedClassificationType].dateTolerance}
                                onChange={(e) => {
                                  const newRules = { ...editableRules }
                                  newRules[selectedClassificationType].dateTolerance = parseInt(e.target.value)
                                  setEditableRules(newRules)
                                }}
                              >
                                <option value={1}>1 day</option>
                                <option value={2}>2 days</option>
                                <option value={3}>3 days</option>
                                <option value={4}>4 days</option>
                                <option value={5}>5 days</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                ) : (
                  <div className="modern-rules-display">
                    <div className="rules-summary">
                      <div className="summary-card company-summary">
                        <div className="summary-header">
                          <span className="summary-icon">🏢</span>
                          <h5>Company Patterns</h5>
                        </div>
                        <div className="patterns-preview">
                          {editableRules[selectedClassificationType].companyPatterns.length > 0 ? (
                            editableRules[selectedClassificationType].companyPatterns.map((pattern, index) => (
                              <span key={index} className="pattern-badge">{typeof pattern === 'string' ? pattern : pattern.pattern}</span>
                            ))
                          ) : (
                            <span className="no-patterns">No company patterns defined</span>
                          )}
                        </div>
                        <div className="summary-count">{editableRules[selectedClassificationType].companyPatterns.length} patterns</div>
                      </div>
                      
                      <div className="summary-card bank-summary">
                        <div className="summary-header">
                          <span className="summary-icon">🏦</span>
                          <h5>Bank Patterns</h5>
                        </div>
                        <div className="patterns-preview">
                          {editableRules[selectedClassificationType].bankPatterns.length > 0 ? (
                            editableRules[selectedClassificationType].bankPatterns.map((pattern, index) => (
                              <span key={index} className="pattern-badge">{typeof pattern === 'string' ? pattern : pattern.pattern}</span>
                            ))
                          ) : (
                            <span className="no-patterns">No bank patterns defined</span>
                          )}
                        </div>
                        <div className="summary-count">{editableRules[selectedClassificationType].bankPatterns.length} patterns</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Classification Column Configuration */}
              <div className="classification-columns-config">
                <h4>🔍 Classification Column Configuration</h4>
                <p>Choose which columns contain the text used for pattern matching:</p>
                <div className="classification-columns-grid">
                  <div className="classification-column-input">
                    <label>Company Classification Column:</label>
                    <select 
                      value={classificationColumns.companyColumn}
                      onChange={(e) => setClassificationColumns(prev => ({
                        ...prev,
                        companyColumn: e.target.value
                      }))}
                    >
                      {companyHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    <small>Column where company patterns are matched</small>
                  </div>
                  <div className="classification-column-input">
                    <label>Bank Classification Column:</label>
                    <select 
                      value={classificationColumns.bankColumn}
                      onChange={(e) => setClassificationColumns(prev => ({
                        ...prev,
                        bankColumn: e.target.value
                      }))}
                    >
                      <option value="">-- Select Bank Column --</option>
                      {bankHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    <small>Column where bank patterns are matched</small>
                  </div>
                </div>
              </div>

              {/* Column Mapping Section */}
              <div className="column-mapping-section">
                <div className="mapping-header">
                  <h4>🎯 Column Header Mapping</h4>
                  <button 
                    className="toggle-mapping-button"
                    onClick={() => setShowColumnMapping(!showColumnMapping)}
                  >
                    {showColumnMapping ? '📋 Hide Mapping' : '⚙️ Configure Columns'}
                  </button>
                </div>
                
                {showColumnMapping && (
                  <div className="column-mapping">
                    {/* Essential Columns (Required for matching) */}
                    {/* Essential Columns Section - Redesigned */}
                    <div className="modern-mapping-section">
                      <div className="mapping-header">
                        <h5>🔧 Essential Columns (Required for matching)</h5>
                        <p className="mapping-description">Configure the key columns used for reconciliation matching</p>
                      </div>
                      
                      {essentialMappings.map((mapping, index) => (
                        <div key={mapping.id} className="modern-mapping-card">
                          <div className="mapping-card-header">
                            <h6>{mapping.label || 'Unnamed Column'}</h6>
                            <button 
                              className="modern-remove-btn"
                              onClick={() => {
                                const newMappings = essentialMappings.filter((_, i) => i !== index)
                                setEssentialMappings(newMappings)
                              }}
                              title="Remove this mapping"
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <div className="mapping-card-body">
                            <div className="mapping-grid">
                              <div className="mapping-field">
                                <label className="field-label">📝 Label</label>
                                <input
                                  type="text"
                                  value={mapping.label}
                                  onChange={(e) => {
                                    const newMappings = [...essentialMappings]
                                    newMappings[index].label = e.target.value
                                    setEssentialMappings(newMappings)
                                  }}
                                  placeholder="e.g., Amount, Date, Check Number"
                                  className="modern-input"
                                />
                              </div>
                              
                              <div className="mapping-field">
                                <label className="field-label">🏢 Company Column</label>
                                <select
                                  value={mapping.companyColumn}
                                  onChange={(e) => {
                                    const newMappings = [...essentialMappings]
                                    newMappings[index].companyColumn = e.target.value
                                    setEssentialMappings(newMappings)
                                  }}
                                  className="modern-select"
                                >
                                  <option value="">-- Select Company Column --</option>
                                  {[...companyHeaders, 'رقم الشيك المستخرج', 'التاريخ المستخرج'].map(header => (
                                    <option key={header} value={header}>{header}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="mapping-visual-link">⟷</div>
                              
                              <div className="mapping-field">
                                <label className="field-label">🏦 Bank Column</label>
                                <select
                                  value={mapping.bankColumn}
                                  onChange={(e) => {
                                    const newMappings = [...essentialMappings]
                                    newMappings[index].bankColumn = e.target.value
                                    setEssentialMappings(newMappings)
                                  }}
                                  className="modern-select"
                                >
                                  <option value="">-- Select Bank Column --</option>
                                  {bankHeaders.map(header => (
                                    <option key={header} value={header}>{header}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div className="mapping-footer">
                              <label className="modern-checkbox">
                                <input
                                  type="checkbox"
                                  checked={mapping.optional}
                                  onChange={(e) => {
                                    const newMappings = [...essentialMappings]
                                    newMappings[index].optional = e.target.checked
                                    setEssentialMappings(newMappings)
                                  }}
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-text">Optional (skip if not available)</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        className="modern-add-btn"
                        onClick={() => {
                          const newMapping = {
                            id: `custom_${Date.now()}`,
                            label: '🔧 New Essential Column',
                            companyColumn: '',
                            bankColumn: '',
                            icon: '🔧',
                            optional: false
                          }
                          setEssentialMappings([...essentialMappings, newMapping])
                        }}
                      >
                        <span>➕</span> Add Essential Column
                      </button>
                    </div>

                    {/* Custom Column Mappings - Redesigned */}
                    <div className="modern-mapping-section">
                      <div className="mapping-header">
                        <h5>🔗 Custom Column Mappings</h5>
                        <p className="mapping-description">Add additional column mappings for extended reconciliation</p>
                      </div>
                      
                      {customMappings.length === 0 ? (
                        <div className="empty-state">
                          <p>📄 No custom mappings yet. Add your first custom column mapping below.</p>
                        </div>
                      ) : (
                        customMappings.map((mapping, index) => (
                          <div key={mapping.id} className="modern-mapping-card custom-card">
                            <div className="mapping-card-header">
                              <h6>{mapping.label || 'Unnamed Custom Column'}</h6>
                              <button 
                                className="modern-remove-btn"
                                onClick={() => {
                                  const newMappings = customMappings.filter((_, i) => i !== index)
                                  setCustomMappings(newMappings)
                                }}
                                title="Remove this custom mapping"
                              >
                                🗑️
                              </button>
                            </div>
                            
                            <div className="mapping-card-body">
                              <div className="mapping-grid">
                                <div className="mapping-field">
                                  <label className="field-label">📝 Label</label>
                                  <input
                                    type="text"
                                    value={mapping.label}
                                    onChange={(e) => {
                                      const newMappings = [...customMappings]
                                      newMappings[index].label = e.target.value
                                      setCustomMappings(newMappings)
                                    }}
                                    placeholder="e.g., Reference Number, Notes"
                                    className="modern-input"
                                  />
                                </div>
                                
                                <div className="mapping-field">
                                  <label className="field-label">🏢 Company Column</label>
                                  <select
                                    value={mapping.companyColumn}
                                    onChange={(e) => {
                                      const newMappings = [...customMappings]
                                      newMappings[index].companyColumn = e.target.value
                                      setCustomMappings(newMappings)
                                    }}
                                    className="modern-select"
                                  >
                                    <option value="">-- Select Company Column --</option>
                                    {[...companyHeaders, 'رقم الشيك المستخرج', 'التاريخ المستخرج'].map(header => (
                                      <option key={header} value={header}>{header}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="mapping-visual-link">⟷</div>
                                
                                <div className="mapping-field">
                                  <label className="field-label">🏦 Bank Column</label>
                                  <select
                                    value={mapping.bankColumn}
                                    onChange={(e) => {
                                      const newMappings = [...customMappings]
                                      newMappings[index].bankColumn = e.target.value
                                      setCustomMappings(newMappings)
                                    }}
                                    className="modern-select"
                                  >
                                    <option value="">-- Select Bank Column --</option>
                                    {bankHeaders.map(header => (
                                      <option key={header} value={header}>{header}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <button 
                        className="modern-add-btn secondary-btn"
                        onClick={() => {
                          const newMapping = {
                            id: `custom_${Date.now()}`,
                            label: '🔗 New Custom Column',
                            companyColumn: '',
                            bankColumn: '',
                            icon: '🔗'
                          }
                          setCustomMappings([...customMappings, newMapping])
                        }}
                      >
                        <span>🔗</span> Add Custom Column
                      </button>
                    </div>

                    {/* Mapping Summary */}
                    <div className="mapping-summary">
                      <h6>📋 Current Mapping Summary:</h6>
                      {essentialMappings.map(mapping => (

                        <p key={mapping.id}>
                          {mapping.label}: {mapping.companyColumn || 'Not selected'} ↔ Bank: {mapping.bankColumn || 'Not selected'}
                          {mapping.optional && ' (Optional)'}
                        </p>
                      ))}
                      {customMappings.length > 0 && (
                        <>
                          <h6>Custom Mappings:</h6>
                          {customMappings.map(mapping => (
                            <p key={mapping.id}>
                              {mapping.label}: {mapping.companyColumn || 'Not selected'} ↔ Bank: {mapping.bankColumn || 'Not selected'}
                            </p>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        
        {(companyData.length > 0 || bankData.length > 0) && (
          <div className="clear-all-container">
            <button onClick={clearAllData} className="clear-all-button">
              Clear All Data
            </button>
          </div>
        )}
          <div className="upload-sections">
          {/* Company Data Section */}
          <div className="upload-section company-section">
            <h2 className="section-title company-title">🏢 Company Data</h2>
            
            {/* Upload Area - Hidden when file is uploaded */}
            {companyData.length === 0 && (
              <div 
                className={`upload-area company-upload ${companyDragOver ? 'drag-over' : ''} ${companyLoading ? ' loading ' : ''}`}
              onDrop={(e) => handleDrop(e, 'company')}
              onDragOver={(e) => handleDragOver(e, 'company')}
              onDragLeave={(e) => handleDragLeave(e, 'company')}
            >
              <div className="upload-content">
                {companyLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <h3>Processing Company Excel file...</h3>
                    <p>Please wait while we read your data</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">🏢</div>
                    <h3>Drop Company Excel file here</h3>
                    <p>or</p>
                    <label htmlFor="company-file-input" className="upload-button company-button">
                      Choose Company File
                    </label>
                    <input
                      id="company-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileInput(e, 'company')}
                      style={{ display: 'none' }}
                      disabled={companyLoading}
                    />
                  </>
                )}
              </div>
            </div>
            )}

            {companyError && (
              <div className="error-message">
                {companyError}
              </div>
            )}

            {companyFileName && (
              <div className="file-info company-file-info">
                <span>📄 {companyFileName}</span>
                <button onClick={() => clearData('company')} className="clear-button">
                  Clear
                </button>
              </div>
            )}

            {/* {companyData.length > 0 && (
              <div className="data-container">
                <div className="table-header">
                  <h3>📊 Company Data Preview ({companyData.length} rows)</h3>
                  <button 
                    className="download-button"
                    onClick={() => downloadAsExcel(companyDataWithChecks, companyHeadersWithChecks, 'company_data.xlsx')}
                  >
                    📥 Download Excel
                  </button>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {companyHeadersWithChecks.map((header, index) => (
                          <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                            {header || `Column ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {companyDataWithChecks.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {companyHeadersWithChecks.map((header, colIndex) => (
                            <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                              {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="data-note">
                  Showing all {companyData.length} rows of company data with extracted check numbers
                </p>
              </div>
            )} */}

            {/* Company Classified Data */}
            {companyClassifiedData.length > 0 && (
              <div className="data-container classified-container">
                <div className="table-header">
                  <h3>🏷️ Classified Company Data ({companyClassifiedData.length} rows)</h3>
                  <button 
                    className="download-button"
                    onClick={() => downloadAsExcel(
                      formattedCompanyClassifiedWithChecks, 
                      companyHeadersWithChecks, 
                      'classified_company_data.xlsx'
                    )}
                  >
                    📥 Download Excel
                  </button>
                </div>
                <p className="classification-note">
                  Contains rows with: اعادة ايداع شيك راجع, ايداع شيكات مقاصة, و ذلك عن تحصيل شيك
                </p>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {companyHeadersWithChecks.map((header, index) => (
                          <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                            {header || `Column ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formattedCompanyClassifiedWithChecks.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {companyHeadersWithChecks.map((header, colIndex) => (
                            <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                              {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Company Remaining Data - hidden per request */}
          </div>

          {/* Bank Data Section */}
          <div className="upload-section bank-section">
            <h2 className="section-title bank-title">🏦 Bank Data</h2>
            {/* Upload Area - Hidden when file is uploaded */}
            {bankData.length === 0 && (
              <div 
                className={`upload-area bank-upload ${bankDragOver ? 'drag-over' : ''} ${bankLoading ? 'loading' : ''}`}
              onDrop={(e) => handleDrop(e, 'bank')}
              onDragOver={(e) => handleDragOver(e, 'bank')}
              onDragLeave={(e) => handleDragLeave(e, 'bank')}
            >
              <div className="upload-content">
                {bankLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <h3>Processing Bank Excel file...</h3>
                    <p>Please wait while we read your data</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">🏦</div>
                    <h3>Drop Bank Excel file here</h3>
                    <p>or</p>
                    <label htmlFor="bank-file-input" className="upload-button bank-button">
                      Choose Bank File
                    </label>
                    <input
                      id="bank-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileInput(e, 'bank')}
                      style={{ display: 'none' }}
                      disabled={bankLoading}
                    />
                  </>
                )}
              </div>
            </div>
            )}

            {bankError && (
              <div className="error-message">
                {bankError}
              </div>
            )}

            {bankFileName && (
              <div className="file-info bank-file-info">
                <span>📄 {bankFileName}</span>
                <button onClick={() => clearData('bank')} className="clear-button">
                  Clear
                </button>
              </div>
            )}

            {/* Bank Classified Data */}
            {bankClassifiedData.length > 0 && (
              <div className="data-container classified-container">
                <div className="table-header">
                  <h3>🏷️ Classified Bank Data ({bankClassifiedData.length} rows)</h3>
                  <button 
                    className="download-button"
                    onClick={() => downloadAsExcel(
                      bankClassifiedData, 
                      bankHeaders, 
                      'classified_bank_data.xlsx'
                    )}
                  >
                    📥 Download Excel
                  </button>
                </div>
                <p className="classification-note">
                  Contains rows with: CHECK DEPOSIT, CLEAR. DEPO., INTERNAL CLEARING
                </p>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {bankHeaders.map((header, index) => (
                          <th key={index}>{header || `Column ${index + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bankClassifiedDataFormatted.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {bankHeaders.map((_, colIndex) => (
                            <td key={colIndex}>
                              {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bank Remaining Data - hidden per request */}
          </div>
        </div>

        {/* Checks Collection Reconciliation Section */}
        {(companyClassifiedData.length > 0 || bankClassifiedData.length > 0) && (
          <div className="reconciliation-section">
            <h2 className="section-title reconciliation-title">🔄 Checks Collection Reconciliation</h2>
            
            {companyClassifiedData.length > 0 && bankClassifiedData.length > 0 ? (
                <div className="reconciliation-content">
                  {!checksCollectionResults && (
                    <div className="table-header">
                      <h4>Run {editableRules[selectedClassificationType].name} Reconciliation to match classified data.</h4>
                      <button 
                        className={`download-button run-button ${reconciliationInProgress ? 'loading' : ''}`}
                        onClick={runReconciliation}
                        disabled={reconciliationInProgress}
                      >
                        {reconciliationInProgress ? (
                          <div className="reconciliation-loading">
                            <div className="loading-spinner">⏳</div>
                            <div className="loading-text">
                              <p>Processing...</p>
                              <div className="progress-info">
                                {reconciliationProgress.total > 0 && (
                                  <>
                                    <p>{reconciliationProgress.processed} / {reconciliationProgress.total} rows processed ({reconciliationProgress.percentage}%)</p>
                                    <div className="progress-bar">
                                      <div 
                                        className="progress-fill" 
                                        style={{ width: `${reconciliationProgress.percentage}%` }}
                                      ></div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            ▶ Run {editableRules[selectedClassificationType].name} Reconciliation
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Date Tolerance Debug Info */}
                  <div className="tolerance-debug-section">
                    <div className="debug-header">
                      <h4>🔍 Date Tolerance Debug Info</h4>
                    </div>
                    <div className="debug-info">
                      <div className="debug-item">
                        <span className="debug-label">Current Classification:</span>
                        <span className="debug-value">{classificationTypes[selectedClassificationType]?.name}</span>
                      </div>
                      <div className="debug-item">
                        <span className="debug-label">Date Tolerance:</span>
                        <span className="debug-value">
                          {editableRules[selectedClassificationType]?.useDateTolerance 
                            ? `${editableRules[selectedClassificationType]?.dateTolerance} days` 
                            : 'Exact match only'
                          }
                        </span>
                      </div>
                      <div className="debug-item">
                        <span className="debug-label">Tolerance Enabled:</span>
                        <span className="debug-value">
                          {editableRules[selectedClassificationType]?.useDateTolerance ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                    </div>
                    <div className="debug-actions">
                      <button 
                        className="test-tolerance-btn"
                        onClick={testDateTolerance}
                      >
                        🧪 Test Date Tolerance
                      </button>
                      <button 
                        className="test-tolerance-btn"
                        onClick={testCheckNumberNormalization}
                      >
                        🔢 Test Check Numbers
                      </button>
                      <small className="debug-note">Check browser console for detailed test results</small>
                    </div>
                  </div>
                  
                  {checksCollectionResults && (
                <div className="reconciliation-stats">
                  <div className="stat-card">
                    <h4>Company Classified</h4>
                    <span className="stat-number">{checksCollectionResults.matchedCompany.length + checksCollectionResults.unmatchedCompany.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>Bank Classified</h4>
                    <span className="stat-number">{checksCollectionResults.matchedBank.length + checksCollectionResults.unmatchedBank.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>Matched Transactions</h4>
                    <span className="stat-number">{checksCollectionResults.matchedCompany.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>Unmatched Company</h4>
                    <span className="stat-number">{checksCollectionResults.unmatchedCompany.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>Unmatched Bank</h4>
                    <span className="stat-number">{checksCollectionResults.unmatchedBank.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>⚠️ Review Company</h4>
                    <span className="stat-number">{checksCollectionResults.reviewCompany.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>⚠️ Review Bank</h4>
                    <span className="stat-number">{checksCollectionResults.reviewBank.length}</span>
                  </div>
                </div>
                  )}
                
                <div className="reconciliation-note">
                  <p>✅ Perfect Match: Date (±4 days) + Check Number + Amount</p>
                  <p>⚠️ Review Table: Check Number + Amount match, but date outside tolerance</p>
                  <p>✅ Company classified data vs Bank classified data</p>
                </div>
              </div>
            ) : (
              <div className="reconciliation-placeholder">
                <p>📁 Upload and classify both company and bank data files to start checks collection reconciliation</p>
              </div>
            )}
            
            {/* Re-run Reconciliation Button */}
            {checksCollectionResults && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button 
                  className="download-button"
                  onClick={runReconciliation}
                  disabled={reconciliationInProgress}
                >
                  {reconciliationInProgress ? '⏳ Re-running...' : '🔄 Re-run Reconciliation'}
                </button>
              </div>
            )}
            
            {/* Re-run Reconciliation Button */}
            {checksCollectionResults && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button 
                  className="download-button"
                  onClick={runReconciliation}
                  disabled={reconciliationInProgress}
                >
                  {reconciliationInProgress ? '⏳ Re-running...' : '🔄 Re-run Reconciliation'}
                </button>
              </div>
            )}

            {/* Checks Collection Results Tables */}
            {checksCollectionResults && (checksCollectionResults.matchedCompany.length > 0 || checksCollectionResults.unmatchedCompany.length > 0 || 
              checksCollectionResults.matchedBank.length > 0 || checksCollectionResults.unmatchedBank.length > 0 ||
              checksCollectionResults.reviewCompany.length > 0 || checksCollectionResults.reviewBank.length > 0) && (
              <div className="results-tables">
                <h3>Checks Collection Reconciliation Results</h3>
                
                <div className="results-grid">
                  {/* Matched Company Data */}
                  {checksCollectionResults.matchedCompany.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>✅ Matched Company Transactions ({checksCollectionResults.matchedCompany.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            checksCollectionResults.matchedCompany, 
                            companyHeadersWithChecks, 
                            'matched_company_checks_collection.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {companyHeadersWithChecks.map((header, index) => (
                                <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                                  {header || `Column ${index + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {checksCollectionResults.matchedCompany.slice(0, companyPreviewLimit).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {companyHeadersWithChecks.map((header, colIndex) => (
                                  <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {checksCollectionResults.matchedCompany.length > companyPreviewLimit && (
                        <div className="clear-all-container">
                          <button className="download-button" onClick={() => setCompanyPreviewLimit(prev => prev + LOAD_MORE_STEP)}>Show more</button>
                          <button className="download-button" onClick={() => setCompanyPreviewLimit(Number.MAX_SAFE_INTEGER)}>Show all</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unmatched Company Data */}
                  {checksCollectionResults.unmatchedCompany.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>❌ Unmatched Company Transactions ({checksCollectionResults.unmatchedCompany.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            checksCollectionResults.unmatchedCompany, 
                            companyHeadersWithChecks, 
                            'unmatched_company_checks_collection.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {companyHeadersWithChecks.map((header, index) => (
                                <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                                  {header || `Column ${index + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {checksCollectionResults.unmatchedCompany.slice(0, companyPreviewLimit).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {companyHeadersWithChecks.map((header, colIndex) => (
                                  <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {checksCollectionResults.unmatchedCompany.length > companyPreviewLimit && (
                        <div className="clear-all-container">
                          <button className="download-button" onClick={() => setCompanyPreviewLimit(prev => prev + LOAD_MORE_STEP)}>Show more</button>
                          <button className="download-button" onClick={() => setCompanyPreviewLimit(Number.MAX_SAFE_INTEGER)}>Show all</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matched Bank Data */}
                  {checksCollectionResults.matchedBank.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>✅ Matched Bank Transactions ({checksCollectionResults.matchedBank.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            checksCollectionResults.matchedBank, 
                            bankHeaders, 
                            'matched_bank_checks_collection.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {bankHeaders.map((header, index) => (
                                <th key={index}>{header || `Column ${index + 1}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {checksCollectionResults.matchedBank.slice(0, bankPreviewLimit).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {bankHeaders.map((_, colIndex) => (
                                  <td key={colIndex}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {checksCollectionResults.matchedBank.length > bankPreviewLimit && (
                        <div className="clear-all-container">
                          <button className="download-button" onClick={() => setBankPreviewLimit(prev => prev + LOAD_MORE_STEP)}>Show more</button>
                          <button className="download-button" onClick={() => setBankPreviewLimit(Number.MAX_SAFE_INTEGER)}>Show all</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unmatched Bank Data */}
                  {checksCollectionResults.unmatchedBank.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>❌ Unmatched Bank Transactions ({checksCollectionResults.unmatchedBank.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            checksCollectionResults.unmatchedBank, 
                            bankHeaders, 
                            'unmatched_bank_checks_collection.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {bankHeaders.map((header, index) => (
                                <th key={index}>{header || `Column ${index + 1}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {checksCollectionResults.unmatchedBank.slice(0, bankPreviewLimit).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {bankHeaders.map((_, colIndex) => (
                                  <td key={colIndex}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {checksCollectionResults.unmatchedBank.length > bankPreviewLimit && (
                        <div className="clear-all-container">
                          <button className="download-button" onClick={() => setBankPreviewLimit(prev => prev + LOAD_MORE_STEP)}>Show more</button>
                          <button className="download-button" onClick={() => setBankPreviewLimit(Number.MAX_SAFE_INTEGER)}>Show all</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Company Data */}
                  {checksCollectionResults.reviewCompany.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>⚠️ Review Company Transactions ({checksCollectionResults.reviewCompany.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            checksCollectionResults.reviewCompany, 
                            companyHeadersWithChecks, 
                            'review_company_checks_collection.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {companyHeadersWithChecks.map((header, index) => (
                                <th key={index} className={header === 'رقم الشيك المستخرج' ? 'check-number-header' : ''}>
                                  {header || `Column ${index + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {checksCollectionResults.reviewCompany.slice(0, companyPreviewLimit).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {companyHeadersWithChecks.map((header, colIndex) => (
                                  <td key={colIndex} className={header === 'رقم الشيك المستخرج' ? 'check-number-cell' : ''}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {checksCollectionResults.reviewCompany.length > companyPreviewLimit && (
                        <div className="clear-all-container">
                          <button className="download-button" onClick={() => setCompanyPreviewLimit(prev => prev + LOAD_MORE_STEP)}>Show more</button>
                          <button className="download-button" onClick={() => setCompanyPreviewLimit(Number.MAX_SAFE_INTEGER)}>Show all</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Bank Data */}
                  {checksCollectionResults.reviewBank.length > 0 && (
                    <div className="result-table-container">
                      <div className="table-header">
                        <h4>⚠️ Review Bank Transactions ({checksCollectionResults.reviewBank.length})</h4>
                        <button 
                          className="download-button"
                          onClick={() => downloadAsExcel(
                            checksCollectionResults.reviewBank, 
                            bankHeaders, 
                            'review_bank_checks_collection.xlsx'
                          )}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {bankHeaders.map((header, index) => (
                                <th key={index}>{header || `Column ${index + 1}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {checksCollectionResults.reviewBank.slice(0, bankPreviewLimit).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {bankHeaders.map((_, colIndex) => (
                                  <td key={colIndex}>
                                    {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {checksCollectionResults.reviewBank.length > bankPreviewLimit && (
                        <div className="clear-all-container">
                          <button className="download-button" onClick={() => setBankPreviewLimit(prev => prev + LOAD_MORE_STEP)}>Show more</button>
                          <button className="download-button" onClick={() => setBankPreviewLimit(Number.MAX_SAFE_INTEGER)}>Show all</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default App
