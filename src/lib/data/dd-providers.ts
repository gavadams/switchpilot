export interface DDProvider {
  id: string
  name: string
  description: string
  website: string
  setupTime: string
  minAmount: number
  recommendedAmount: number
  category: 'service' | 'charity'
  logo?: string
}

export const DD_PROVIDERS: DDProvider[] = [
  {
    id: 'onepounddd',
    name: 'One Pound DD',
    description: 'Quick setup direct debit for £1/month',
    website: 'https://onepounddd.com',
    setupTime: 'Instant',
    minAmount: 1.00,
    recommendedAmount: 1.00,
    category: 'service'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Use PayPal for direct debit setup',
    website: 'https://paypal.com',
    setupTime: '1 day',
    minAmount: 1.00,
    recommendedAmount: 2.00,
    category: 'service'
  },
  {
    id: 'charity_unicef',
    name: 'UNICEF',
    description: 'Support children worldwide',
    website: 'https://unicef.org.uk',
    setupTime: '3-5 days',
    minAmount: 5.00,
    recommendedAmount: 10.00,
    category: 'charity'
  },
  {
    id: 'charity_alzheimers',
    name: 'Alzheimer\'s Society',
    description: 'Support dementia research and care',
    website: 'https://alzheimers.org.uk',
    setupTime: '3-5 days',
    minAmount: 5.00,
    recommendedAmount: 10.00,
    category: 'charity'
  },
  {
    id: 'charity_crohns',
    name: 'Crohn\'s & Colitis UK',
    description: 'Support those with IBD',
    website: 'https://crohnsandcolitis.org.uk',
    setupTime: '3-5 days',
    minAmount: 5.00,
    recommendedAmount: 10.00,
    category: 'charity'
  }
]

export const getProviderById = (id: string): DDProvider | undefined => {
  return DD_PROVIDERS.find(provider => provider.id === id)
}

export const getProvidersByCategory = (category: 'service' | 'charity'): DDProvider[] => {
  return DD_PROVIDERS.filter(provider => provider.category === category)
}
