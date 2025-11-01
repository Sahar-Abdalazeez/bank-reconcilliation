# Bank Reconciliation Assistant - Quick Guide (TTS Optimized)

## Introduction

Welcome to the Bank Reconciliation Assistant by Al-Mashreq Insurance Company. This application automatically matches transactions between your company Excel file and bank statement Excel file, saving you hours of manual work.

---

## How It Works

This tool uses pattern matching and column-based reconciliation to find which transactions match between your company records and bank statement, identify missing entries, and generate detailed reports.

---

## The Workflow

**Step One: Upload Files**

First, upload your company Excel file. This contains your internal transaction records. The app shows a progress step indicator.

Next, upload your bank Excel file. This is your bank statement with transactions from your financial institution. Once both files upload successfully, you'll see their names displayed.

**Step Two: Select Transaction Type**

Choose what type of transactions you're reconciling. Options include:
- Checks Collection for deposited checks
- Returned Checks for bounced checks  
- Cash Inflow for incoming money
- Disbursement for payments
- Visa Payment for credit card transactions
- Bank Charges for fees
- Salary for payroll payments
- Or Unclassified to find transactions that don't fit any category

Click the card matching your transaction type.

**Step Three: Configure Rules**

Set up how the app will match your transactions:

**Company Patterns** - Text patterns to find transactions in your company file, like "check deposit" or "payment received". Add multiple patterns and choose if they match at the start of text or anywhere in the text.

**Bank Patterns** - Similar patterns for your bank file, like "CHECK DEPOSIT" or "TRANSACTION".

**Search Columns** - Pick which column in each file contains the description or narrative you want to search.

**Matching Columns** - Set up how rows match. You can match:
- Exact values that must be identical
- Numbers with optional tolerance for small differences
- Dates with optional day tolerance
- Text with normalization options

For each matching column, select the corresponding column from both files. You can also set date tolerance to handle processing delays.

**Step Four: Run Reconciliation**

Click the "Run Reconciliation" button. The app will:
- Classify transactions by finding your patterns
- Match transactions using your matching rules
- Calculate statistics

This usually takes just seconds.

**Step Five: Review Results**

See your results in a dashboard with:
- Total rows processed
- Classified transactions found
- Successfully matched pairs
- Unmatched entries
- Match rate percentage

Below that, view detailed tables in tabs:
- Matched Company transactions
- Matched Bank transactions  
- Unmatched Company transactions
- Unmatched Bank transactions
- Classified Company data
- Classified Bank data

Each table shows row counts, can be expanded to view data, opened in full screen, and downloaded.

**Step Six: Download Results**

Use download buttons throughout to export any result table to Excel. Files are named clearly with the classification type included.

---

## Special Modes

For bank charges, the app groups transactions by charge type with totals.

For salary payments, it compares the total of all company salary entries against the bank's total salary amount.

The unclassified mode helps find transactions that don't match your patterns, useful for discovering new transaction types.

---

## Tips for Best Results

Make sure your Excel files have clear column headers. Start with simple patterns, then refine based on results. Review unmatched transactions to improve your rules. Keep your Excel files clean and consistently formatted.

---

## Conclusion

The Bank Reconciliation Assistant makes financial reconciliation fast and accurate. Upload your files, configure your rules, run reconciliation, and download your results. It's that simple!


