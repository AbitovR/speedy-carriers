export interface Load {
  loadId: string
  customer: string
  vehicle: string
  price: number
  brokerFee: number
  paymentMethod: string
  notes?: string
}

export interface Expenses {
  parking: number
  eldLogbook: number
  insurance: number
  fuel: number
  ifta: number
  localTowing: number
  prepass: number
  shipcar: number
  superDispatch: number
  other: number
  paidInAdvance: number
}

export interface TripSummary {
  totalPrice: number
  totalBrokerFee: number
  totalGrossBeforeDeductions: number
  totalGrossAfterTowing: number
  dispatchFeeAmount: number
  otherExpenses: number
  totalExpenses: number
  totalGrossAfterDeductions: number
  cashGrossBeforeDeductions: number
  checkGrossBeforeDeductions: number
  billingGrossBeforeDeductions: number
  cashGrossAfterDeductions: number
  checkGrossAfterDeductions: number
  billingGrossAfterDeductions: number
  cashExpenses: number
  checkExpenses: number
  billingExpenses: number
  driverPay: number
  percentage: number
  loadCount: number
}

export function normalizePaymentMethod(method: string): string {
  const normalized = method?.toLowerCase().trim() || ''
  if (normalized === 'cod' || normalized === 'cash' || normalized === 'zelle') return 'cash'
  if (normalized === 'check' || normalized === 'ach') return 'check'
  return 'billing'
}

export function calculateTripSummary(
  loads: Load[],
  driverType: 'company_driver' | 'owner_operator',
  expenses: Expenses
): TripSummary {
  const DISPATCH_FEE = 0.10

  let totalPrice = 0
  let totalBrokerFee = 0
  let totalGrossBeforeDeductions = 0
  let cashGrossBeforeDeductions = 0
  let checkGrossBeforeDeductions = 0
  let billingGrossBeforeDeductions = 0

  loads.forEach((load) => {
    totalPrice += load.price
    totalBrokerFee += load.brokerFee
    const gross = load.price - load.brokerFee
    totalGrossBeforeDeductions += gross

    const method = normalizePaymentMethod(load.paymentMethod)
    if (method === 'cash') {
      cashGrossBeforeDeductions += gross
    } else if (method === 'check') {
      checkGrossBeforeDeductions += gross
    } else {
      billingGrossBeforeDeductions += gross
    }
  })

  // Step 1: Deduct local towing fee FIRST (if it exists)
  const localTowingFee = expenses.localTowing || 0
  const totalGrossAfterTowing = totalGrossBeforeDeductions - localTowingFee

  // Step 2: Calculate dispatch fee from gross AFTER towing
  // Dispatch fee: Always 10% of gross after towing for both driver types
  const dispatchFeeAmount = totalGrossAfterTowing * DISPATCH_FEE

  // Step 3: Other expenses (excluding local towing, as it's already deducted)
  const otherExpenses =
    expenses.parking +
    expenses.eldLogbook +
    expenses.insurance +
    expenses.fuel +
    expenses.ifta +
    expenses.prepass +
    expenses.shipcar +
    expenses.superDispatch +
    expenses.other +
    expenses.paidInAdvance

  // Step 4: Total expenses (dispatch fee + other expenses + local towing)
  const totalExpenses = dispatchFeeAmount + otherExpenses + localTowingFee

  // Apply local towing fee proportionally to each payment method
  const cashShare =
    totalGrossBeforeDeductions > 0
      ? cashGrossBeforeDeductions / totalGrossBeforeDeductions
      : 0
  const checkShare =
    totalGrossBeforeDeductions > 0
      ? checkGrossBeforeDeductions / totalGrossBeforeDeductions
      : 0
  const billingShare =
    totalGrossBeforeDeductions > 0
      ? billingGrossBeforeDeductions / totalGrossBeforeDeductions
      : 0

  const cashTowingFee = localTowingFee * cashShare
  const checkTowingFee = localTowingFee * checkShare
  const billingTowingFee = localTowingFee * billingShare

  // Calculate gross after towing for each payment method
  const cashGrossAfterTowing = cashGrossBeforeDeductions - cashTowingFee
  const checkGrossAfterTowing = checkGrossBeforeDeductions - checkTowingFee
  const billingGrossAfterTowing = billingGrossBeforeDeductions - billingTowingFee

  // Calculate dispatch fee proportionally from gross after towing
  const cashDispatchFee = cashGrossAfterTowing * DISPATCH_FEE
  const checkDispatchFee = checkGrossAfterTowing * DISPATCH_FEE
  const billingDispatchFee = billingGrossAfterTowing * DISPATCH_FEE

  // Calculate other expenses proportionally
  const cashOtherExpenses = otherExpenses * cashShare
  const checkOtherExpenses = otherExpenses * checkShare
  const billingOtherExpenses = otherExpenses * billingShare

  // Total expenses per payment method
  const cashExpenses = cashTowingFee + cashDispatchFee + cashOtherExpenses
  const checkExpenses = checkTowingFee + checkDispatchFee + checkOtherExpenses
  const billingExpenses = billingTowingFee + billingDispatchFee + billingOtherExpenses

  // Gross AFTER all deductions
  const totalGrossAfterDeductions = totalGrossBeforeDeductions - totalExpenses
  const cashGrossAfterDeductions = cashGrossBeforeDeductions - cashExpenses
  const checkGrossAfterDeductions = checkGrossBeforeDeductions - checkExpenses
  const billingGrossAfterDeductions = billingGrossBeforeDeductions - billingExpenses

  // Driver/Owner percentage
  // For regular drivers (32%): calculated from gross AFTER towing (but before dispatch fee and other expenses)
  // For owner operators (100%): get 100% of remaining after 10% dispatch fee and other expenses
  const percentage = driverType === 'owner_operator' ? 1.0 : 0.32
  const driverPay =
    driverType === 'owner_operator'
      ? totalGrossAfterDeductions // Owner operators get 100% of what remains after towing, dispatch fee, and other expenses
      : totalGrossAfterTowing * percentage // Company drivers get 32% of gross after towing

  return {
    totalPrice,
    totalBrokerFee,
    totalGrossBeforeDeductions,
    totalGrossAfterTowing, // Add this for company earnings calculation
    dispatchFeeAmount,
    otherExpenses,
    totalExpenses,
    totalGrossAfterDeductions,
    cashGrossBeforeDeductions,
    checkGrossBeforeDeductions,
    billingGrossBeforeDeductions,
    cashGrossAfterDeductions,
    checkGrossAfterDeductions,
    billingGrossAfterDeductions,
    cashExpenses,
    checkExpenses,
    billingExpenses,
    driverPay,
    percentage,
    loadCount: loads.length,
  }
}
