// Deal validation functions

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateDeal(dealData: any): ValidationResult {
  const errors: string[] = []

  // Required fields
  if (!dealData.bank_name || dealData.bank_name.length < 2) {
    errors.push('Bank name must be at least 2 characters')
  }

  if (!dealData.reward_amount || dealData.reward_amount <= 0) {
    errors.push('Reward amount must be greater than 0')
  }

  // Range validation
  if (dealData.required_direct_debits !== undefined) {
    if (dealData.required_direct_debits < 0 || dealData.required_direct_debits > 10) {
      errors.push('Required direct debits must be between 0 and 10')
    }
  }

  if (dealData.min_pay_in !== undefined && dealData.min_pay_in < 0) {
    errors.push('Minimum pay-in cannot be negative')
  }

  // Date validation
  if (dealData.expiry_date) {
    const expiryDate = new Date(dealData.expiry_date)
    if (expiryDate < new Date()) {
      errors.push('Expiry date must be in the future')
    }
  }

  // URL validation
  if (dealData.affiliate_url && !isValidUrl(dealData.affiliate_url)) {
    errors.push('Affiliate URL must be a valid URL')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

