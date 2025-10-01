export interface DDProvider {
  id: string
  name: string
  description: string
  provider: string
  website?: string
  setupTime: string
  amount?: number // Fixed amount for SwitchPilot DDs
  minAmount?: number // For external providers
  recommendedAmount?: number // For external providers
  category: 'switchpilot' | 'charity' | 'external_service'
  features?: string[]
  note?: string
  isExternal?: boolean
}

export const DD_PROVIDERS: DDProvider[] = [
  {
    id: 'switchpilot_dd',
    name: 'SwitchPilot Direct Debit',
    description: 'Our direct debit service - fulfills bank switching requirements instantly',
    provider: 'SwitchPilot',
    setupTime: 'Instant',
    amount: 1.00, // Fixed £1/month per DD
    category: 'switchpilot',
    features: [
      'Instant activation - no 3-5 day wait',
      'Automatically counts toward bank requirements',
      'Managed within SwitchPilot',
      'Cancel automatically after switch completes'
    ],
    note: '£1/month per direct debit - separate from subscription'
  },
  {
    id: 'charity_unicef',
    name: 'UNICEF (External)',
    description: 'Support children worldwide - setup required on their website',
    provider: 'UNICEF',
    website: 'https://unicef.org.uk',
    setupTime: '3-5 days',
    minAmount: 5.00,
    recommendedAmount: 10.00,
    category: 'charity',
    note: 'You will need to setup this direct debit directly with the charity. Takes 3-5 days to activate.',
    isExternal: true
  },
  {
    id: 'charity_alzheimers',
    name: 'Alzheimer\'s Society (External)',
    description: 'Support dementia research - setup required on their website',
    provider: 'Alzheimer\'s Society',
    website: 'https://alzheimers.org.uk',
    setupTime: '3-5 days',
    minAmount: 5.00,
    recommendedAmount: 10.00,
    category: 'charity',
    note: 'You will need to setup this direct debit directly with the charity. Takes 3-5 days to activate.',
    isExternal: true
  },
  {
    id: 'charity_crohns',
    name: 'Crohn\'s & Colitis UK (External)',
    description: 'Support those with IBD - setup required on their website',
    provider: 'Crohn\'s & Colitis UK',
    website: 'https://crohnsandcolitis.org.uk',
    setupTime: '3-5 days',
    minAmount: 5.00,
    recommendedAmount: 10.00,
    category: 'charity',
    note: 'You will need to setup this direct debit directly with the charity. Takes 3-5 days to activate.',
    isExternal: true
  },
  {
    id: 'onepounddd_external',
    name: 'OnePoundDD.com (External)',
    description: 'Third-party direct debit service',
    provider: 'OnePoundDD',
    website: 'https://onepounddd.com',
    setupTime: '1-2 days',
    amount: 1.00,
    category: 'external_service',
    note: 'External service - setup on their website',
    isExternal: true
  }
]

export const getProviderById = (id: string): DDProvider | undefined => {
  return DD_PROVIDERS.find(provider => provider.id === id)
}

export const getProvidersByCategory = (category: 'switchpilot' | 'charity' | 'external_service'): DDProvider[] => {
  return DD_PROVIDERS.filter(provider => provider.category === category)
}

export const getSwitchPilotProviders = (): DDProvider[] => {
  return DD_PROVIDERS.filter(provider => provider.category === 'switchpilot')
}

export const getExternalProviders = (): DDProvider[] => {
  return DD_PROVIDERS.filter(provider => provider.isExternal === true)
}
