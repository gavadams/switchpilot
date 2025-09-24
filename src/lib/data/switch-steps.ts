export interface SwitchStep {
  stepNumber: number
  stepName: string
  description: string
  estimatedDays: number
}

export const STANDARD_SWITCH_STEPS: SwitchStep[] = [
  {
    stepNumber: 1,
    stepName: "Create Chase Burner Account",
    description: "Open a Chase current account that will be used as the account to switch FROM",
    estimatedDays: 1
  },
  {
    stepNumber: 2, 
    stepName: "Set Up Direct Debits",
    description: "Add required direct debits to Chase account (onepounddd.com, PayPal, charities if needed)",
    estimatedDays: 2
  },
  {
    stepNumber: 3,
    stepName: "Wait for DD Confirmation", 
    description: "Wait for direct debits to be confirmed and appear on account",
    estimatedDays: 3
  },
  {
    stepNumber: 4,
    stepName: "Apply for New Bank Account",
    description: "Complete application for the target bank account with switching service",
    estimatedDays: 1
  },
  {
    stepNumber: 5,
    stepName: "Set Up Mobile Banking",
    description: "Download app, activate account, and set up mobile/online banking access",
    estimatedDays: 2
  },
  {
    stepNumber: 6,
    stepName: "Fulfill Pay-in Requirements",
    description: "Transfer required amount into new account (can cycle smaller amounts)",
    estimatedDays: 1
  },
  {
    stepNumber: 7,
    stepName: "Complete Card Transactions",
    description: "Make required debit card transactions if specified in deal terms",
    estimatedDays: 1
  },
  {
    stepNumber: 8,
    stepName: "Wait for Reward",
    description: "Monitor account for reward payment according to bank timeline",
    estimatedDays: 30
  }
]
