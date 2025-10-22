import paymentCheckImage from '../assets/payment-check.png';
import returnedCheckImage from '../assets/returned-check.png';
import cashInflowImage from '../assets/money.png';
import visaPaymentImage from '../assets/visa.png';

export const classificationTypes = {
  'checks-collection': {
    name: 'Checks Collection',
    icon: <img src={paymentCheckImage} alt="Checks Collection" width={40} height={40}/>,
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
    companySearchColumn: '',
    bankSearchColumn: '',
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'numeric' },
      { id: 'match_date', label: 'Date', companyColumn: '', bankColumn: '', matchType: 'date' },
      { id: 'match_check', label: 'Check Number', companyColumn: '', bankColumn: '', matchType: 'text', normalize: true }
    ],
    dateTolerance: 4,
    useDateTolerance: true
  },
  'returned-checks': {
    name: 'Returned Checks',
    icon: <img src={returnedCheckImage} alt="Returned Checks" width={40} height={40}/>,
    companyPatterns: [
      { pattern: 'شيك راجع', matchType: 'startsWith' },
      { pattern: 'ارجاع شيك بعد اعادة ايداعه', matchType: 'includes' },
    ],
    bankPatterns: [
      { pattern: 'RETURN CHEQUE , TRANSIT', matchType: 'startsWith' },
      { pattern: 'RETURNED CHECK FROM OTHER BANK', matchType: 'includes' },
      { pattern: 'RETURNED POST DATED/INSTALLMENT CHEQUES', matchType: 'includes' }
    ],
    companySearchColumn: '',
    bankSearchColumn: '',
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'exact' },
      { id: 'match_check', label: 'Check Number', companyColumn: '', bankColumn: '', matchType: 'text', normalize: true }
    ],
    dateTolerance: 0,
    useDateTolerance: false
  },
  'cleared-checks': {
    name: 'Cleared Checks',
    icon: '💸',
    companyPatterns: [
      { pattern: 'سند صرف', matchType: 'startsWith' },
      { pattern: 'دفعة أدعاء', matchType: 'startsWith' }
    ],
    bankPatterns: [
      { pattern: 'CLEARING WITHDRAWAL', matchType: 'startsWith' },
    ],
    companySearchColumn: '',
    bankSearchColumn: '',
    companyFilters: [
      { columnName: 'رقم الشيك المستخرج', condition: 'has8Digits' }
    ],
    bankFilters: [
      //to be checked 
      { columnName: 'DOC-NUM', condition: 'has8Digits' }
    ],
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'exact' },
      { id: 'match_date', label: 'Date', companyColumn: '', bankColumn: '', matchType: 'date' },
      { id: 'match_check', label: 'Check Number', companyColumn: '', bankColumn: '', matchType: 'text' }
    ],
    useDateTolerance: false
  },
  'outgoing-transfers': {
    name: 'Outgoing Transfers',
    icon: '💸',
    companyPatterns: [
      { pattern: 'سند صرف', matchType: 'startsWith' },
      { pattern: 'دفعة أدعاء', matchType: 'startsWith' }
    ],
    bankPatterns: [
      { pattern: 'SWIFT TRANSFER', matchType: 'startsWith' },
      { pattern: 'TRANSFER FROM AN ACCOUNT TO AN ACCOUNT', matchType: 'startsWith' },
    ],
    companySearchColumn: '',
    bankSearchColumn: '',
    companyFilters: [
      { columnName: 'رقم الشيك المستخرج', condition: 'not8Digits' }
    ],
    bankFilters: [
      { columnName: 'DOC-NUM', condition: 'not8Digits' }
    ],
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'exact' },
      { id: 'match_date', label: 'Date', companyColumn: '', bankColumn: '', matchType: 'date' }
    ],
    useDateTolerance: false
  },
  'cash-inflow': {
    name: 'Cash Inflow',
    icon: <img src={cashInflowImage} alt="Cash Inflow" width={40} height={40}/>,
    companyPatterns: [
      { pattern: 'حوالة ', matchType: 'startsWith' },
      { pattern: 'نقل ختم', matchType: 'startsWith' },
      { pattern: 'ايداع نقدي', matchType: 'startsWith' },
      
    ],
    bankPatterns: [
      { pattern: 'CASH DEPOSIT', matchType: 'startsWith' },
      { pattern: 'Electronic Transfer', matchType: 'startsWith' },
      { pattern: 'TRANSFER FROM AN ACCOUNT TO AN ACCOUNT', matchType: 'includes' }
    ],
    companySearchColumn: '',
    bankSearchColumn: '',
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'exact' }
    ],
    dateTolerance: 0,
    useDateTolerance: false
  },
  'visa-payment': {
    name: 'Visa Payment',
    icon: <img src={visaPaymentImage} alt="Visa Payment" width={40} height={40}/>,
    companyPatterns: [
      { pattern: 'ختم بوليصة سيارات', matchType: 'startsWith' },
      { pattern: '1112111102', matchType: 'startsWith' },
      { pattern: 'فيزا', matchType: 'startsWith' }
    ],
    bankPatterns: [
      { pattern: 'Purchase', matchType: 'startsWith' },
      { pattern: 'LOAN TRANS', matchType: 'includes' }
    ],
    companySearchColumn: '',
    bankSearchColumn: '',
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'numeric' },
      { id: 'match_date', label: 'Date', companyColumn: '', bankColumn: '', matchType: 'date' }
    ],
    dateTolerance: 3,
    useDateTolerance: true
  },
  'salary': {
    name: 'Salary',
    icon: '💰',
    isSumComparison: true,  // Special flag: Compare sum of company rows with single bank row
    companyPatterns: [
      { pattern: 'وذلك عن قيمة صافي رواتب', matchType: 'startsWith' },
    ],
    bankPatterns: [
      { pattern: 'salary', matchType: 'startsWith' },
    ],
    companySearchColumn: '',
    bankSearchColumn: '',
    companyAmountColumn: 'دائن',  // Column to sum in company data
    bankAmountColumn: 'DEBIT',     // Column to compare in bank data
    companyFilters: [
      { columnName: 'رقم الشيك المستخرج', condition: 'not8Digits' }
    ],
    bankFilters: [
      { columnName: 'DOC-NUM', condition: 'not8Digits' }
    ],
    matchingColumns: [],  // No row-by-row matching
    dateTolerance: 0,
    useDateTolerance: false
  },
  'charges': {
    name: 'Bank Charges',
    icon: '💳',
    isBankOnly: true,  // Special flag: Bank-only classification (no matching)
    companyPatterns: [],  // Not used for bank-only types
    bankPatterns: [
      { pattern: 'CHEQUES DEPOSIT CHARGES', matchType: 'includes' },
      { pattern: 'RETURNED CHEQUES CHARGES', matchType: 'includes' },
      { pattern: 'Returned Postdated cheques commission', matchType: 'includes' },
      { pattern: 'ADDITIONAL COMMISSION', matchType: 'includes' },
      { pattern: 'COMMISSION/OUTWARD TRANSFERS', matchType: 'includes' },
      { pattern: 'CHEQUE BOOK ISSUE CHARGES', matchType: 'includes' },
      { pattern: 'INTEREST CAPITALIZATION TRANSACTIONS', matchType: 'includes' },
      { pattern: 'A/C MANAGEMENT COMMISSION', matchType: 'includes' },
      { pattern: 'ATM TRANSACTION /POS /CARD FEES', matchType: 'includes' },
      { pattern: 'DAILY DEPOSITS COMMISSION', matchType: 'includes' },
      { pattern: 'MONTHLY DEPOSITS COMMISSION', matchType: 'includes' },
      { pattern: 'STANDING INSTUCTION', matchType: 'includes' },

    ],
    companySearchColumn: '',  // Not used for bank-only types
    bankSearchColumn: '',  // Will be configured by user
    bankAmountColumn: 'DEBIT',  // Column to sum for total amounts
    matchingColumns: [],  // No matching needed for bank-only types
    dateTolerance: 0,
    useDateTolerance: false
  },

  'fund-account': {
    name: 'Funding the  Account',
    icon: '💳',
    isBankOnly: true,  // Special flag: Bank-only classification (no matching)
    companyPatterns: [],  // Not used for bank-only types
    bankPatterns: [
      { pattern: 'BUYING/SELLING FOREIGN CURRENCY', matchType: 'includes' },
      { pattern: 'FUND TRANSFER - OWN ACCOUNTS', matchType: 'includes' },
    ],
    companySearchColumn: '',  // Not used for bank-only types
    bankSearchColumn: '',  // Will be configured by user
    bankAmountColumn: 'DEBIT',  // Column to sum for total amounts
    matchingColumns: [],  // No matching needed for bank-only types
    dateTolerance: 0,
    useDateTolerance: false
  },
  'unclassified': {
    name: 'Other Transactions (Unclassified)',
    icon: '❓',
    isUnclassified: true,  // Special flag: Show rows that didn't match any other type
    companyPatterns: [],   // Will use exclusion logic
    bankPatterns: [],      // Will use exclusion logic
    companySearchColumn: '',
    bankSearchColumn: '',
    matchingColumns: [],
    dateTolerance: 0,
    useDateTolerance: false
  },
};

