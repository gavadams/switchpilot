export interface SwitchStep {
  step_number: number
  step_name: string
  description: string | null
  estimated_days: number
}

export const STANDARD_SWITCH_STEPS: SwitchStep[] = [
  {
    step_number: 1,
    step_name: "Create Chase Burner Account",
    description: "Open a Chase current account that will be used as the account to switch FROM",
    estimated_days: 1
  },
  {
    step_number: 2,
    step_name: "Set Up Direct Debits",
    description: "Add required direct debits to Chase account (onepounddd.com, PayPal, charities if needed)",
    estimated_days: 2
  },
  {
    step_number: 3,
    step_name: "Wait for DD Confirmation",
    description: "Wait for direct debits to be confirmed and appear on account",
    estimated_days: 3
  },
  {
    step_number: 4,
    step_name: "Apply for New Bank Account",
    description: "Complete application for the target bank account with switching service",
    estimated_days: 1
  },
  {
    step_number: 5,
    step_name: "Set Up Mobile Banking",
    description: "Download app, activate account, and set up mobile/online banking access",
    estimated_days: 2
  },
  {
    stepNumber: 6,
    stepName: "Fulfill Pay-in Requirements",
    description: "Transfer required amount into new account (can cycle smaller amounts)",
    estimatedDays: 1
  },
  {
    step_number: 7,
    step_name: "Complete Card Transactions",
    description: "Make required debit card transactions if specified in deal terms",
    estimated_days: 1
  },
  {
    step_number: 8,
    step_name: "Wait for Reward",
    description: "Monitor account for reward payment according to bank timeline",
    estimated_days: 30
  }
]
