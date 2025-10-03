import { useState, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import './App.css'
import './header-accordion.css'
import logoImage from './assets/al-mashreq-logo.png'

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
  const [companyPreviewLimit, setCompanyPreviewLimit] = useState(PREVIEW_ROW_LIMIT)
  const [bankPreviewLimit, setBankPreviewLimit] = useState(PREVIEW_ROW_LIMIT)
  
  // Classification state
  const [companyClassifiedData, setCompanyClassifiedData] = useState([])
  const [bankClassifiedData, setBankClassifiedData] = useState([])

  
  // Checks Collection Reconciliation results
  const [checksCollectionResults, setChecksCollectionResults] = useState(null)

  // Helpers and classification (defined before use)
  const getBankNarrativeIndex = useCallback((headers) => {
    const candidates = ['narrative', 'narritive', 'narr', 'description', 'details']
    return headers.findIndex(header => {
      if (!header) return false
      const h = header.toString().toLowerCase().trim()
      return candidates.some(key => h.includes(key))
    })
  }, [])

  const classifyCompanyData = useCallback((data, headers) => {
    const البيانIndex = headers.findIndex(header => header === 'البيان')
    if (البيانIndex === -1) {
      return { classified: [], remaining: data }
    }

    const classificationPatterns = [
      'اعادة ايداع شيك راجع',
      'ايداع شيكات مقاصة', 
      'و ذلك عن تحصيل شيك'
    ]

    const classified = []
    const remaining = []

    data.forEach(row => {
      const البيانValue = row[البيانIndex]
      const shouldClassify = البيانValue && classificationPatterns.some(pattern => 
        البيانValue.toString().includes(pattern)
      )

      if (shouldClassify) {
        classified.push(row)
      } else {
        remaining.push(row)
      }
    })

    return { classified, remaining }
  }, [])

  const classifyBankData = useCallback((data, headers) => {
    const narrativeIndex = getBankNarrativeIndex(headers)
    if (narrativeIndex === -1) {
      return { classified: [], remaining: data }
    }

    const normalizeText = (text) => text.toString().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()
    const classificationPatterns = [
      'check deposit',
      'cheque deposit',
      'clear depo',
      'clear depo',
      'clearing deposit',
      'internal clearing',
      'int clearing',
      'internal clearing transfer'
    ].map(normalizeText)
    const exactPhrases = ['check deposit', 'clear. depo.', 'internal clearing']

    const classified = []
    const remaining = []

    data.forEach(row => {
      const narrativeValue = row[narrativeIndex]
      const raw = narrativeValue ? narrativeValue.toString().toLowerCase() : ''
      const text = narrativeValue ? normalizeText(narrativeValue) : ''
      const containsClearDepo = text.includes('clear') && (text.includes('depo') || text.includes('deposit'))
      const exactMatch = raw && exactPhrases.some(p => raw.includes(p))
      const normalizedMatch = text && classificationPatterns.some(pattern => text.includes(pattern))
      const shouldClassify = exactMatch || normalizedMatch || containsClearDepo

      if (shouldClassify) {
        classified.push(row)
      } else {
        remaining.push(row)
      }
    })

    return { classified, remaining }
  }, [getBankNarrativeIndex])
  
  // Drag over states
  const [companyDragOver, setCompanyDragOver] = useState(false)
  const [bankDragOver, setBankDragOver] = useState(false)

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
          const companyClassification = classifyCompanyData(rows, headerRow || [])
          setCompanyClassifiedData(companyClassification.classified)
          // Remaining data not displayed per request
          
          setCompanyLoading(false)
        } else {
          setBankHeaders(headerRow || [])
          setBankData(rows)
          setBankPreviewLimit(PREVIEW_ROW_LIMIT)
          
          // Classify bank data
          const bankClassification = classifyBankData(rows, headerRow || [])
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
  }, [companyLoading, bankLoading, classifyCompanyData, classifyBankData])

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


  

  

  // Helper function to parse date and check if bank date is within 4 days after company date
  const isDateMatch = (companyDate, bankDate) => {
    if (!companyDate || !bankDate) return false
    
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
      
      // Check if dates are equal or bank date is 1-4 days after company date
      const diffTime = bankDateObj.getTime() - companyDateObj.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      return diffDays >= 0 && diffDays <= 4
    } catch {
      return false
    }
  }

  // Match Checks Collection data (classified company vs classified bank)
  const matchChecksCollection = () => {
    if (formattedCompanyClassifiedWithChecks.length === 0 || bankClassifiedDataFormatted.length === 0) {
      return {
        matchedCompany: [],
        unmatchedCompany: [],
        matchedBank: [],
        unmatchedBank: [],
        reviewCompany: [],
        reviewBank: []
      }
    }

    // Find column indices
    const companyDateIndex = companyHeaders.findIndex(header => 
      header === 'التاريخ' || header === 'تاريخ الادخال'
    )
    const companyCheckIndex = companyHeadersWithChecks.length - 1 // Last column is check number
    const companyDebitIndex = companyHeaders.findIndex(header => header === 'مدين')
    
    const bankPostDateIndex = bankHeaders.findIndex(header => 
      header && header.toString().toLowerCase().includes('post') && 
      header.toString().toLowerCase().includes('date')
    )
    const bankDocNumIndex = bankHeaders.findIndex(header => 
      header && header.toString().toLowerCase().includes('doc-num')
    )
    const bankCreditIndex = bankHeaders.findIndex(header => 
      header && header.toString().toLowerCase().includes('credit')
    )

    console.log('Checks Collection Debug:', {
      companyDateIndex,
      companyCheckIndex,
      companyDebitIndex,
      bankPostDateIndex,
      bankDocNumIndex,
      bankCreditIndex
    })

    const matchedCompany = []
    const unmatchedCompany = []
    const matchedBank = []
    const unmatchedBank = []
    const reviewCompany = []
    const reviewBank = []

    // Check each classified company transaction
    formattedCompanyClassifiedWithChecks.forEach((companyRow, index) => {
      const companyDate = companyRow[companyDateIndex]
      const companyCheckNumber = companyRow[companyCheckIndex]
      const companyDebitAmount = companyRow[companyDebitIndex]
      
      console.log(`Company row ${index}: date="${companyDate}", check="${companyCheckNumber}", debit="${companyDebitAmount}"`)
      
      if (!companyDate || !companyCheckNumber || !companyDebitAmount) {
        unmatchedCompany.push(companyRow)
        return
      }

      // Find matching bank entry - check for perfect match first
      let matchingBank = bankClassifiedDataFormatted.find((bankRow, bankIndex) => {
        const bankPostDate = bankRow[bankPostDateIndex]
        const bankDocNum = bankRow[bankDocNumIndex]
        const bankCreditAmount = bankRow[bankCreditIndex]
        
        console.log(`  Checking bank row ${bankIndex}: postDate="${bankPostDate}", docNum="${bankDocNum}", credit="${bankCreditAmount}"`)
        
        // Check all three criteria for perfect match
        const dateMatch = isDateMatch(companyDate, bankPostDate)
        const checkMatch = bankDocNum && bankDocNum.toString() === companyCheckNumber.toString()
        const amountMatch = bankCreditAmount && companyDebitAmount && 
               Math.abs(parseFloat(companyDebitAmount) - parseFloat(bankCreditAmount)) < 0.01
        
        console.log(`    Date match: ${dateMatch}, Check match: ${checkMatch}, Amount match: ${amountMatch}`)
        
        return dateMatch && checkMatch && amountMatch
      })

      if (matchingBank) {
        console.log(`  ✅ PERFECT MATCH FOUND for check ${companyCheckNumber}`)
        matchedCompany.push(companyRow)
        if (!matchedBank.find(row => row === matchingBank)) {
          matchedBank.push(matchingBank)
        }
      } else {
        // Check for review match (check number + amount match, but date mismatch)
        const reviewBankMatch = bankClassifiedDataFormatted.find((bankRow) => {
          const bankPostDate = bankRow[bankPostDateIndex]
          const bankDocNum = bankRow[bankDocNumIndex]
          const bankCreditAmount = bankRow[bankCreditIndex]
          
          const checkMatch = bankDocNum && bankDocNum.toString() === companyCheckNumber.toString()
          const amountMatch = bankCreditAmount && companyDebitAmount && 
                 Math.abs(parseFloat(companyDebitAmount) - parseFloat(bankCreditAmount)) < 0.01
          
          // Check if dates exist but don't match (outside tolerance)
          const hasDates = companyDate && bankPostDate
          const dateMismatch = hasDates && !isDateMatch(companyDate, bankPostDate)
          
          return checkMatch && amountMatch && dateMismatch
        })

        if (reviewBankMatch) {
          console.log(`  ⚠️ REVIEW MATCH FOUND for check ${companyCheckNumber} (date mismatch)`)
          reviewCompany.push(companyRow)
          if (!reviewBank.find(row => row === reviewBankMatch)) {
            reviewBank.push(reviewBankMatch)
          }
        } else {
          console.log(`  ❌ NO MATCH for check ${companyCheckNumber}`)
          unmatchedCompany.push(companyRow)
        }
      }
    })

    // Add unmatched bank entries
    bankClassifiedDataFormatted.forEach(bankRow => {
      if (!matchedBank.find(row => row === bankRow) && !reviewBank.find(row => row === bankRow)) {
        unmatchedBank.push(bankRow)
      }
    })

    console.log('Checks Collection Results:', {
      matchedCompany: matchedCompany.length,
      unmatchedCompany: unmatchedCompany.length,
      matchedBank: matchedBank.length,
      unmatchedBank: unmatchedBank.length,
      reviewCompany: reviewCompany.length,
      reviewBank: reviewBank.length
    })

    return {
      matchedCompany,
      unmatchedCompany,
      matchedBank,
      unmatchedBank,
      reviewCompany,
      reviewBank
    }
  }


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
              <img src={logoImage} alt="AL-MASHREQ INSURANCE CO." className="logo-image" />
              <div className="logo-text">
                <h1>Bank Reconciliation Assistant</h1>
                <p>Advanced Excel Data Processing & Reconciliation</p>
              </div>
            </div>
            <nav className="header-nav">
              <div className="nav-item">
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
              </div>
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
            
            <div 
              className={`upload-area company-upload ${companyDragOver ? 'drag-over' : ''} ${companyLoading ? 'loading' : ''}`}
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

            {companyData.length > 0 && (
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
            )}

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

            {bankData.length > 0 && (
              <div className="data-container">
                <div className="table-header">
                  <h3>🏦 Bank Data Preview ({bankData.length} rows)</h3>
                  <button 
                    className="download-button"
                    onClick={() => downloadAsExcel(bankDataFormatted, bankHeaders, 'bank_data.xlsx')}
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
                      {bankDataFormatted.map((row, rowIndex) => {
                        return (
                        <tr key={rowIndex}>
                          {bankHeaders.map((_, colIndex) => (
                            <td key={colIndex}>
                              {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                            </td>
                          ))}
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                <p className="data-note">
                  Showing all {bankData.length} rows of bank data
                </p>
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
                      <h4>Run Checks Collection Reconciliation to match classified data.</h4>
                      <button 
                        className="download-button run-button"
                        onClick={() => setChecksCollectionResults(matchChecksCollection())}
                      >
                        ▶ Run Checks Collection Reconciliation
                      </button>
                    </div>
                  )}
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
