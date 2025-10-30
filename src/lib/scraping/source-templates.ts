import { ScraperConfig } from '@/types/scraping'

export interface SourceTemplate {
  name: string
  description: string
  config: ScraperConfig
}

export const SOURCE_TEMPLATES: Record<string, SourceTemplate> = {
  scrimpr: {
    name: 'Scrimpr Template',
    description: 'Pre-configured template for Scrimpr.co.uk bank switching deals',
    config: {
      selectors: {
        dealContainer: '.offer-card',
        bankName: '.bank-name',
        rewardAmount: '.reward-amount',
        requirements: '.requirements-text',
        expiryDate: '.expiry-date'
      },
      parsing: {
        rewardAmountRegex: '£([0-9,]+)',
        directDebitsRegex: '([0-9]+)\\s*(?:direct debit|DD)',
        payInRegex: '(?:pay in|deposit)\\s*£([0-9,]+)',
        expiryDateFormat: 'DD/MM/YYYY'
      },
      options: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        timeout: 30000,
        retryAttempts: 3
      }
    }
  },
  moneysavingexpert: {
    name: 'MoneySavingExpert Template',
    description: 'Pre-configured template for MoneySavingExpert.com bank switching deals',
    config: {
      selectors: {
        dealContainer: '.deal-box',
        bankName: '.bank-title',
        rewardAmount: '.reward-value',
        requirements: '.requirements-list',
        expiryDate: '.expiry-info'
      },
      parsing: {
        rewardAmountRegex: '£([0-9,]+)',
        directDebitsRegex: '([0-9]+)\\s*direct debit',
        payInRegex: '£([0-9,]+)\\s*(?:minimum|pay in)',
        expiryDateFormat: 'MMMM DD, YYYY'
      },
      options: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        timeout: 30000,
        retryAttempts: 3
      }
    }
  },
  generic: {
    name: 'Generic Template',
    description: 'Basic template for custom sites - requires CSS selector configuration',
    config: {
      selectors: {
        dealContainer: '.deal-item',
        bankName: '.bank-name',
        rewardAmount: '.reward',
        requirements: '.requirements',
        expiryDate: '.expiry'
      },
      parsing: {
        rewardAmountRegex: '£([0-9,]+)',
        directDebitsRegex: '([0-9]+)\\s*(?:direct debit|DD)',
        payInRegex: '(?:pay in|deposit)\\s*£([0-9,]+)',
        expiryDateFormat: 'DD/MM/YYYY'
      },
      options: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        timeout: 30000,
        retryAttempts: 3
      }
    }
  }
}

export function getTemplate(key: string): SourceTemplate | null {
  return SOURCE_TEMPLATES[key] || null
}

export function getAllTemplates(): SourceTemplate[] {
  return Object.values(SOURCE_TEMPLATES)
}

