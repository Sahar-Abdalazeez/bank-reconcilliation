import { createContext, useContext, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { processCompanyData } from '../utils/dataExtraction';

const FileUploadContext = createContext();

const useFileUpload = () => {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error('useFileUpload must be used within FileUploadProvider');
  }
  return context;
};

export const FileUploadProvider = ({ children }) => {
  // Company file state
  const [companyData, setCompanyData] = useState([]);
  const [companyHeaders, setCompanyHeaders] = useState([]);
  const [companyFileName, setCompanyFileName] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyDragOver, setCompanyDragOver] = useState(false);

  // Bank file state
  const [bankData, setBankData] = useState([]);
  const [bankHeaders, setBankHeaders] = useState([]);
  const [bankFileName, setBankFileName] = useState('');
  const [bankError, setBankError] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankDragOver, setBankDragOver] = useState(false);

  // Classification type selection state
  const [selectedClassificationType, setSelectedClassificationType] = useState(null);
  
  // Editable rules state
  const [editableRules, setEditableRules] = useState(null);

  // Process Excel file
  const processExcelFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });

          if (jsonData.length === 0) {
            reject(new Error('The Excel file is empty'));
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));

          resolve({ headers, rows, fileName: file.name });
        } catch (error) {
          reject(new Error(`Error reading Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Handle file input in case you are uploading file from the file input
  const handleFileInput = useCallback(async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const setLoading = type === 'company' ? setCompanyLoading : setBankLoading;
    const setError = type === 'company' ? setCompanyError : setBankError;
    const setData = type === 'company' ? setCompanyData : setBankData;
    const setHeaders = type === 'company' ? setCompanyHeaders : setBankHeaders;
    const setFileName = type === 'company' ? setCompanyFileName : setBankFileName;

    setLoading(true);
    setError('');

    try {
      const result = await processExcelFile(file);
      
      // Process company data to extract check numbers and dates
      if (type === 'company') {
        const processed = processCompanyData(result.rows, result.headers);
        setData(processed.data);
        setHeaders(processed.headers);
      } else {
        setData(result.rows);
        setHeaders(result.headers);
      }
      
      setFileName(result.fileName);
    } catch (error) {
      setError(error.message);
      setData([]);
      setHeaders([]);
      setFileName('');
    } finally {
      setLoading(false);
    }
  }, [processExcelFile]);

  // Handle drag and drop in case you are uploading file from the drag and drop area
  const handleDrop = useCallback(async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    const setDragOver = type === 'company' ? setCompanyDragOver : setBankDragOver;
    const setLoading = type === 'company' ? setCompanyLoading : setBankLoading;
    const setError = type === 'company' ? setCompanyError : setBankError;
    const setData = type === 'company' ? setCompanyData : setBankData;
    const setHeaders = type === 'company' ? setCompanyHeaders : setBankHeaders;
    const setFileName = type === 'company' ? setCompanyFileName : setBankFileName;

    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await processExcelFile(file);
      
      // Process company data to extract check numbers and dates
      if (type === 'company') {
        const processed = processCompanyData(result.rows, result.headers);
        setData(processed.data);
        setHeaders(processed.headers);
      } else {
        setData(result.rows);
        setHeaders(result.headers);
      }
      
      setFileName(result.fileName);
    } catch (error) {
      setError(error.message);
      setData([]);
      setHeaders([]);
      setFileName('');
    } finally {
      setLoading(false);
    }
  }, [processExcelFile]);

  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const setDragOver = type === 'company' ? setCompanyDragOver : setBankDragOver;
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const setDragOver = type === 'company' ? setCompanyDragOver : setBankDragOver;
    setDragOver(false);
  }, []);

  // Clear data
  const clearData = useCallback((type) => {
    if (type === 'company') {
      setCompanyData([]);
      setCompanyHeaders([]);
      setCompanyFileName('');
      setCompanyError('');
    } else {
      setBankData([]);
      setBankHeaders([]);
      setBankFileName('');
      setBankError('');
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    setCompanyData([]);
    setCompanyHeaders([]);
    setCompanyFileName('');
    setCompanyError('');
    setBankData([]);
    setBankHeaders([]);
    setBankFileName('');
    setBankError('');
  }, []);

  const value = {
    // Company state
    companyData,
    companyHeaders,
    companyFileName,
    companyError,
    companyLoading,
    companyDragOver,
    
    // Bank state
    bankData,
    bankHeaders,
    bankFileName,
    bankError,
    bankLoading,
    bankDragOver,
    
    // Classification state
    selectedClassificationType,
    setSelectedClassificationType,
    editableRules,
    setEditableRules,
    
    // Actions
    handleFileInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    clearData,
    clearAllData,
  };

  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  );
};

export { useFileUpload };

