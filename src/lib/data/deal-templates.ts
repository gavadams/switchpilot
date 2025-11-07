// Deal templates for quick deal creation

export interface DealTemplate {
  name: string
  required_direct_debits: number
  min_pay_in: number
  debit_card_transactions: number
  time_to_payout: string
}

export const DEAL_TEMPLATES: Record<string, DealTemplate> = {
  standard_switch: {
    name: 'Standard Bank Switch',
    required_direct_debits: 2,
    min_pay_in: 1000,
    debit_card_transactions: 0,
    time_to_payout: '30 days'
  },
  premium_switch: {
    name: 'Premium Bank Switch',
    required_direct_debits: 3,
    min_pay_in: 1500,
    debit_card_transactions: 5,
    time_to_payout: '60 days'
  },
  basic_switch: {
    name: 'Basic Bank Switch',
    required_direct_debits: 2,
    min_pay_in: 500,
    debit_card_transactions: 0,
    time_to_payout: '45 days'
  }
}

export function getTemplate(templateName: string): DealTemplate | null {
  return DEAL_TEMPLATES[templateName] || null
}

