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
}

export interface TripSummary {
  totalPrice: number
  totalBrokerFee: number
  totalGrossBeforeDeductions: number
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
  if (normalized === 'cod' || normalized === 'cash') return 'cash'
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

  // Calculate 10% dispatch fee
  const dispatchFeeAmount = totalGrossBeforeDeductions * DISPATCH_FEE

  // Total expenses (dispatch fee + other expenses)
  const otherExpenses =
    expenses.parking +
    expenses.eldLogbook +
    expenses.insurance +
    expenses.fuel +
    expenses.ifta +
    expenses.localTowing
  const totalExpenses = dispatchFeeAmount + otherExpenses

  // Apply deductions proportionally to each payment method
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

  const cashExpenses = totalExpenses * cashShare
  const checkExpenses = totalExpenses * checkShare
  const billingExpenses = totalExpenses * billingShare

  // Gross AFTER deductions
  const totalGrossAfterDeductions = totalGrossBeforeDeductions - totalExpenses
  const cashGrossAfterDeductions = cashGrossBeforeDeductions - cashExpenses
  const checkGrossAfterDeductions = checkGrossBeforeDeductions - checkExpenses
  const billingGrossAfterDeductions = billingGrossBeforeDeductions - billingExpenses

  // Driver/Owner percentage
  // For regular drivers (32%): calculated from gross BEFORE expenses
  // For owner operators (90%): calculated from gross AFTER expenses
  const percentage = driverType === 'owner_operator' ? 0.9 : 0.32
  const driverPay =
    driverType === 'owner_operator'
      ? totalGrossAfterDeductions * percentage
      : totalGrossBeforeDeductions * percentage

  return {
    totalPrice,
    totalBrokerFee,
    totalGrossBeforeDeductions,
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
