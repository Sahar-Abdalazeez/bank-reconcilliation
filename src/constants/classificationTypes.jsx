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
      { columnName: 'DOC-NUM', condition: 'has8Digits' }
    ],
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'exact' },
      { id: 'match_date', label: 'Date', companyColumn: '', bankColumn: '', matchType: 'date' },
      { id: 'match_check', label: 'Check Number', companyColumn: '', bankColumn: '', matchType: 'text' }
    ],
    useDateTolerance: false
  },
  'cash-inflow': {
    name: 'Cash Inflow',
    icon: <img src={cashInflowImage} alt="Cash Inflow" width={40} height={40}/>,
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
    companySearchColumn: '',
    bankSearchColumn: '',
    matchingColumns: [
      { id: 'match_amount', label: 'Amount', companyColumn: '', bankColumn: '', matchType: 'numeric' },
      { id: 'match_date', label: 'Date', companyColumn: '', bankColumn: '', matchType: 'date' }
    ],
    dateTolerance: 3,
    useDateTolerance: true
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
  }
};

