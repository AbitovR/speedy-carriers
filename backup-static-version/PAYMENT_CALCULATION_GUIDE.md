# Speedy Carriers - Payment Calculation Guide

## Business Model Overview

Speedy Carriers is a trucking company that:
- **Leases MC/DOT authority** to owner operators
- **Provides dispatch services** for a 10% fee
- Employs both **company drivers** and **owner operators**

---

## Driver Types & Payment Models

### 1. Company Drivers (32% Model)

**Who they are:**
- W2 employees of the company
- Drive company-owned trucks
- Company pays all expenses

**Payment Calculation:**
```
Total Invoice Price:        $12,915.00
- Broker Fee:               -$100.00
= Total Gross:              $12,815.00

Driver Pay (32%):           $4,100.80
Company Keeps (68%):        $8,714.20
```

**Key Points:**
- ✅ Driver gets 32% of gross BEFORE any expenses
- ✅ Company pays ALL expenses (fuel, IFTA, insurance, etc.) from their 68%
- ✅ Expenses are NOT deducted from driver pay

---

### 2. Owner Operators (90% Model)

**Who they are:**
- Independent contractors
- Own their own trucks
- Lease company's MC/DOT authority
- Pay for their own expenses

**Payment Calculation:**
```
Total Invoice Price:        $12,915.00
- Broker Fee:               -$100.00
= Total Gross:              $12,815.00

EXPENSES (Deducted from Gross):
- Dispatch Fee (10%):       -$1,281.50
- Parking:                  -$50.00
- ELD/LogBook:              -$0.00
- Insurance:                -$0.00
- Fuel:                     -$0.00
- IFTA:                     -$0.00
- Local Towing:             -$0.00
= Total Expenses:           -$1,331.50

= Net Gross (After Expenses): $11,483.50

Owner Operator Pay (90%):   $10,335.15
Company Keeps (10%):        $1,148.35
```

**Key Points:**
- ✅ Owner operator pays 10% dispatch fee
- ✅ Owner operator pays ALL other expenses
- ✅ Expenses are deducted BEFORE calculating 90% pay
- ✅ Owner keeps 90% of net gross (after expenses)
- ✅ Company keeps 10% of net gross

---

## Payment Settlement (Owner Operators Only)

### Cash/COD Collection Logic

When owner operators collect cash or COD directly from customers:

```
Example:
Total Owner Earnings:       $10,461.15
Less: Cash/COD Collected:   -$4,400.00  (actual gross cash amount)
= NET DUE FROM COMPANY:     $6,061.15
```

**How it works:**
1. Owner operator delivers vehicles and collects cash/COD from customers
2. That cash amount goes directly into owner's pocket
3. The cash amount is the **actual gross** collected (not a calculated portion)
4. Company owes owner the remaining balance via check or billing

**Payment Breakdown:**
- 💵 **Cash Collected by Owner**: $4,400.00 (already in owner's possession)
- ✓ **Check/ACH Due**: $2,000.00 (company pays)
- 📋 **Billing Due**: $4,061.15 (company pays)
- **Total Company Owes**: $6,061.15

---

## Expense Categories

### Dispatch Fee (10%)
- **Always charged**: 10% of total gross (after broker fee)
- **Who pays**: Owner operators only
- **Non-negotiable**: Fixed at 10%

### Other Expenses
Owner operators may have these expenses:
- **Parking**: Parking fees during trips
- **ELD/LogBook**: Electronic logging device subscription
- **Insurance**: Truck insurance premiums
- **Fuel**: Fuel costs for the trip
- **IFTA**: International Fuel Tax Agreement fees
- **Local Towing**: Towing services for local deliveries

**For Company Drivers**: Company pays all these from their 68% share

**For Owner Operators**: All deducted from gross before calculating 90% pay

---

## Payment Method Categories

### Cash/COD
- Cash payments
- COD (Cash on Delivery)
- Owner collects directly from customer

### Check/ACH
- Check payments
- ACH bank transfers
- Company collects and pays to owner

### Billing/Credit
- Credit terms (30/60/90 days)
- Invoiced to customer
- Company collects and pays to owner

---

## Complete Calculation Example

### Owner Operator Trip with Mixed Payment Methods

**Revenue:**
- Cash loads: $4,400.00 (5 vehicles)
- Check loads: $0.00
- Billing loads: $8,515.00 (6 vehicles)
- **Total Gross**: $12,915.00

**Expenses:**
- Dispatch Fee (10%): $1,291.50
- Other Expenses: $0.00
- **Total Expenses**: $1,291.50

**Net Gross (After Expenses):**
- $12,915.00 - $1,291.50 = $11,623.50

**Owner Operator Pay:**
- $11,623.50 × 90% = **$10,461.15**

**Payment Settlement:**
- Total Owner Earnings: $10,461.15
- Less: Cash Collected: -$4,400.00
- **Company Owes**: $6,061.15

**How Company Pays:**
- Check/ACH: $0.00
- Billing: $6,061.15
- **Total**: $6,061.15 ✓

---

## Key Differences Summary

| Aspect | Company Driver (32%) | Owner Operator (90%) |
|--------|---------------------|---------------------|
| **Employment** | W2 Employee | Independent Contractor |
| **Truck** | Company-owned | Owner-owned |
| **Expenses** | Company pays | Owner pays |
| **Dispatch Fee** | Company pays | Owner pays (10%) |
| **Pay Calculation** | 32% of gross BEFORE expenses | 90% of gross AFTER expenses |
| **Cash Collection** | Goes to company | Goes to owner, deducted from settlement |

---

## System Features

### Automatic Calculation
- Imports SuperDispatch trip reports (Excel/CSV)
- Automatically categorizes payment methods
- Calculates all fees and deductions
- Shows payment settlement breakdown

### PDF Statement Generation
- Professional trip statement
- Complete breakdown of all charges
- Payment method breakdown
- Shows net amount due

### Supported Import Formats
- Excel (.xlsx, .xls)
- CSV (.csv)
- SuperDispatch export format

---

## Important Notes

1. **Driver Type Selection**: Always ensure correct driver type is selected before generating statements
2. **Cash Collection**: For owner operators, cash/COD amount is based on actual gross collected, not calculated
3. **Expenses**: Only apply to owner operators, never to company drivers
4. **Dispatch Fee**: Always 10% for owner operators, automatically calculated
5. **Payment Methods**: System automatically recognizes CASH, COD, CHECK, ACH, BILLING payment types

---

## Troubleshooting

### Cash amount showing incorrectly
- Verify payment method is marked as "CASH" or "COD" in import file
- Check that driver type is set to "Owner Operator"
- Cash amount should equal sum of all cash/COD load gross amounts

### Total not matching
- Check broker fees are correctly imported
- Verify all loads are included in import
- Ensure no duplicate loads in file

### Expenses not calculating
- Confirm driver type is "Owner Operator"
- Check that expense values are entered correctly
- Dispatch fee is automatic (10% of gross)

---

## Version History

### Current Version
- ✅ Company drivers: 32% of gross, expenses NOT deducted
- ✅ Owner operators: 90% of net gross after expenses
- ✅ Cash/COD: Actual gross amount collected, not proportional
- ✅ Payment settlement: Shows net due from company
- ✅ Local Towing: Added as expense category
- ✅ PDF generation: Separate formats for drivers vs owners

---

*Document created: November 2025*
*System: Speedy Carriers Driver Payment Management*
