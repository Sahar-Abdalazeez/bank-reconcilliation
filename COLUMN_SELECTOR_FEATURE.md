# 🔍 Column Selector Feature

**Version:** 2.1.0  
**Date:** October 7, 2025  
**Status:** ✅ Production Ready

---

## 🎯 Overview

The Column Selector feature allows users to specify which columns to search when matching patterns. This provides flexibility to target specific columns in your Excel files for pattern matching.

---

## ✨ Features

### 📊 Column Selection

#### **Company Search Column**
- Select which column to search for company patterns
- Dropdown populated with actual column headers from uploaded company Excel file
- Stored per classification type

#### **Bank Search Column**
- Select which column to search for bank patterns
- Dropdown populated with actual column headers from uploaded bank Excel file
- Stored per classification type

---

## 🎨 User Interface

### Visual Design

#### **Column Selector Box**
- Beautiful gradient background (cyan/teal)
- 🔍 Search icon indicator
- Dropdown with all available columns
- Shows selected column in view mode

#### **Edit Mode**
- Full dropdown with all column headers
- Select any column from the list
- Changes save immediately to state

#### **View Mode**
- Displays currently selected column
- Purple text to indicate selection
- Shows "Not selected" if no column chosen

---

## 🚀 How to Use

### Step 1: Upload Files
1. Upload **Company Excel file**
2. Upload **Bank Excel file**
3. Column headers are automatically extracted

### Step 2: Select Classification Type
- Click on any classification card
- Rules accordion opens automatically

### Step 3: Enter Edit Mode
- Click **"✏️ Edit Mode"** button

### Step 4: Select Search Columns

#### For Company Patterns:
1. Find **"🔍 Search in Column:"** under Company Patterns
2. Click the dropdown
3. See list of all company Excel columns
4. Select the column where patterns should be searched

#### For Bank Patterns:
1. Find **"🔍 Search in Column:"** under Bank Patterns
2. Click the dropdown
3. See list of all bank Excel columns
4. Select the column where patterns should be searched

### Step 5: Save Changes
- Click **"💾 Save Changes"**
- Column selections are saved with rules

---

## 📊 Data Structure

### Updated Classification Type Object

```javascript
{
  "checks-collection": {
    name: "Checks Collection",
    icon: <Component>,
    
    // Patterns
    companyPatterns: [...],
    bankPatterns: [...],
    
    // 🆕 Column Selection
    companySearchColumn: "Column Name",  // NEW!
    bankSearchColumn: "Column Name",      // NEW!
    
    // Date settings
    dateTolerance: 4,
    useDateTolerance: true
  }
}
```

---

## 🎯 Use Cases

### Example 1: Arabic Description Column
```
Company Excel has columns: 
- التاريخ (Date)
- الوصف (Description)  ← Search here!
- المبلغ (Amount)

Select: companySearchColumn = "الوصف"
```

### Example 2: Transaction Details Column
```
Bank Excel has columns:
- Date
- Transaction Details  ← Search here!
- Debit
- Credit

Select: bankSearchColumn = "Transaction Details"
```

### Example 3: Multiple Classifications
```
Checks Collection:
  - companySearchColumn: "الوصف"
  - bankSearchColumn: "Transaction Details"

Returned Checks:
  - companySearchColumn: "البيان"
  - bankSearchColumn: "Narration"
```

---

## 🎨 Styling

### Column Selector Styles

```css
.column-selector {
  /* Gradient background */
  background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
  border: 2px solid #81e6d9;
  border-radius: 8px;
  padding: 14px 16px;
}

.column-selector-dropdown {
  /* White dropdown */
  background: white;
  border: 2px solid #e2e8f0;
  
  /* Focus state */
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.column-selector-value {
  /* Purple text in view mode */
  color: #667eea;
  font-weight: 600;
}
```

---

## 🔧 Technical Implementation

### Context Integration

```javascript
const {
  companyHeaders,  // Array of column names
  bankHeaders      // Array of column names
} = useFileUpload();
```

### Update Functions

```javascript
// Update company search column
const updateCompanySearchColumn = (column: string) => {
  const newRules = { ...editableRules };
  newRules[currentKey].companySearchColumn = column;
  setEditableRules(newRules);
};

// Update bank search column
const updateBankSearchColumn = (column: string) => {
  const newRules = { ...editableRules };
  newRules[currentKey].bankSearchColumn = column;
  setEditableRules(newRules);
};
```

---

## 📱 Responsive Design

### Desktop View
- Horizontal layout
- Label and dropdown side-by-side
- Full dropdown width

### Mobile View (≤ 768px)
- Vertical layout
- Label on top
- Full-width dropdown
- Stacked elements

---

## 🎯 Integration with Pattern Matching

### How It Works

When running reconciliation:

1. **User selects columns** in edit mode
2. **Columns are saved** with classification rules
3. **During matching**, system:
   - Reads the selected company column
   - Searches for company patterns in that column only
   - Reads the selected bank column
   - Searches for bank patterns in that column only

### Example Flow

```javascript
// User configuration
companySearchColumn: "الوصف"  // Arabic description
bankSearchColumn: "Transaction Details"

// During matching
for each companyRow {
  descriptionText = companyRow[companySearchColumn]
  if (descriptionText matches any companyPattern) {
    // Match found!
  }
}

for each bankRow {
  detailsText = bankRow[bankSearchColumn]
  if (detailsText matches any bankPattern) {
    // Match found!
  }
}
```

---

## ✨ Benefits

### 1. **Flexibility**
- Different Excel files have different column structures
- Users can adapt to any file format

### 2. **Accuracy**
- Search only in relevant columns
- Avoid false matches from other columns

### 3. **Per-Classification**
- Each classification type can use different columns
- One size doesn't fit all

### 4. **User Control**
- Users decide which columns to use
- No hardcoded column names

---

## 🔮 Future Enhancements

### Planned Features
1. **Multiple Column Search** - Search in multiple columns
2. **Column Preview** - Show sample data from selected column
3. **Auto-detect** - Suggest best column based on patterns
4. **Column Mapping** - Map different column names to standard fields
5. **Validation** - Warn if selected column is empty
6. **History** - Remember last used columns

---

## 📋 Validation

### Current Behavior
- Empty selection allowed (shows "-- Select Column --")
- No validation on save (users can save without selection)
- System should handle missing selection gracefully

### Recommended Enhancements
```javascript
// Add validation before save
if (!currentRules.companySearchColumn) {
  alert("Please select a company search column");
  return;
}

if (!currentRules.bankSearchColumn) {
  alert("Please select a bank search column");
  return;
}
```

---

## 🎯 Complete Feature Checklist

- [x] Company column selector
- [x] Bank column selector
- [x] Dropdown populated from headers
- [x] Edit mode integration
- [x] View mode display
- [x] Save functionality
- [x] Reset to defaults
- [x] Beautiful styling
- [x] Responsive design
- [x] State management
- [ ] Validation (recommended)
- [ ] Column preview (future)
- [ ] Auto-detect (future)

---

## 📸 Visual Examples

### Edit Mode
```
┌─────────────────────────────────────────────┐
│ 🔍 Search in Column:                        │
│ ┌─────────────────────────────────────────┐ │
│ │ الوصف                              ▼   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### View Mode
```
┌─────────────────────────────────────────────┐
│ 🔍 Search in Column:  الوصف               │
└─────────────────────────────────────────────┘
```

---

## 🎉 Summary

The Column Selector feature provides:
- ✅ Flexible column targeting
- ✅ Per-classification configuration
- ✅ Beautiful UI integration
- ✅ Easy to use
- ✅ Production ready

Users can now specify exactly which columns to search for patterns, making the system adaptable to any Excel file structure!

---

*End of Column Selector Feature Documentation*

