import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScraperConfig, ScrapedDeal } from '@/types/scraping'

export class FlexibleScraper {
  private config: ScraperConfig
  private url: string

  constructor(url: string, config: ScraperConfig) {
    this.url = url
    this.config = config
  }

  private async fetchPage(): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.options.retryAttempts; attempt++) {
      try {
        const response = await axios.get(this.url, {
          headers: {
            'User-Agent': this.config.options.userAgent,
          },
          timeout: this.config.options.timeout,
        })

        return response.data
      } catch (error) {
        const err = error as Error & { response?: { status: number } }
        lastError = err
        console.error(`Fetch attempt ${attempt} failed:`, err.message)

        if (attempt < this.config.options.retryAttempts) {
          // Wait before retrying (exponential backoff)
          await this.delay(1000 * attempt)
        }
      }
    }

    throw lastError || new Error('Failed to fetch page')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private extractText(element: cheerio.Cheerio, selector: string): string {
    try {
      return element.find(selector).first().text().trim()
    } catch {
      return ''
    }
  }

  private parseRewardAmount(text: string): number {
    try {
      const regex = new RegExp(this.config.parsing.rewardAmountRegex)
      const match = text.match(regex)
      if (match && match[1]) {
        // Remove commas and convert to number
        return parseFloat(match[1].replace(/,/g, ''))
      }
    } catch (error) {
      console.error('Error parsing reward amount:', error)
    }
    return 0
  }

  private parseDirectDebits(text: string): number {
    try {
      const regex = new RegExp(this.config.parsing.directDebitsRegex, 'i')
      const match = text.match(regex)
      if (match && match[1]) {
        return parseInt(match[1], 10)
      }
    } catch (error) {
      console.error('Error parsing direct debits:', error)
    }
    return 2 // Default to 2 if not found
  }

  private parsePayIn(text: string): number {
    try {
      const regex = new RegExp(this.config.parsing.payInRegex, 'i')
      const match = text.match(regex)
      if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ''))
      }
    } catch (error) {
      console.error('Error parsing pay-in amount:', error)
    }
    return 0
  }

  private parseExpiryDate(text: string): Date | null {
    try {
      // Attempt to parse various date formats
      // DD/MM/YYYY or DD-MM-YYYY
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
        if (!isNaN(date.getTime())) {
          return date
        }
      }

      // YYYY-MM-DD
      const isoMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
      if (isoMatch) {
        const [, year, month, day] = isoMatch
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
        if (!isNaN(date.getTime())) {
          return date
        }
      }

      // Try text dates like "31 December 2025" or "Dec 31, 2025"
      const textDate = new Date(text)
      if (!isNaN(textDate.getTime())) {
        return textDate
      }
    } catch (error) {
      console.error('Error parsing expiry date:', error)
    }
    return null
  }

  public async scrapeDeals(): Promise<{
    deals: ScrapedDeal[]
    scrapedAt: Date
    success: boolean
    error?: string
  }> {
    try {
      // Fetch page
      const html = await this.fetchPage()

      // Parse with cheerio
      const $ = cheerio.load(html)

      // Find all deal containers
      const dealElements = $(this.config.selectors.dealContainer)

      if (dealElements.length === 0) {
        throw new Error(`No deals found with selector: ${this.config.selectors.dealContainer}`)
      }

      const deals: ScrapedDeal[] = []

      // Extract data from each deal
      dealElements.each((index, element) => {
        try {
          const $deal = $(element)

          // Extract all text fields
          const bankName = this.extractText($deal, this.config.selectors.bankName)
          const rewardText = this.extractText($deal, this.config.selectors.rewardAmount)
          const requirementsText = this.extractText($deal, this.config.selectors.requirements)
          const expiryText = this.extractText($deal, this.config.selectors.expiryDate)

          // Skip if no bank name (likely not a valid deal)
          if (!bankName || bankName.trim().length === 0) {
            return
          }

          // Parse extracted data
          const rewardAmount = this.parseRewardAmount(rewardText || requirementsText)
          const directDebits = this.parseDirectDebits(requirementsText)
          const payIn = this.parsePayIn(requirementsText)
          const expiryDate = this.parseExpiryDate(expiryText)

          // Parse debit card transactions if found
          let debitCardTransactions = 0
          const debitCardMatch = requirementsText.match(/(\d+)\s*(?:debit card|card|transaction)/i)
          if (debitCardMatch && debitCardMatch[1]) {
            debitCardTransactions = parseInt(debitCardMatch[1], 10)
          }

          // Create deal object
          const deal: ScrapedDeal = {
            bankName: bankName.trim(),
            rewardAmount: rewardAmount,
            requirements: {
              directDebitsRequired: directDebits,
              minPayIn: payIn,
              debitCardTransactions: debitCardTransactions,
              otherRequirements: []
            },
            expiryDate: expiryDate,
            timeToPayout: 'Unknown', // Could parse if found in requirements
            sourceUrl: this.url,
            rawData: {
              rewardText,
              requirementsText,
              expiryText
            }
          }

          deals.push(deal)
        } catch (error) {
          console.error(`Error parsing deal ${index}:`, error)
        }
      })

      return {
        deals,
        scrapedAt: new Date(),
        success: true
      }
    } catch (error) {
      const err = error as Error
      return {
        deals: [],
        scrapedAt: new Date(),
        success: false,
        error: err.message || 'Unknown error occurred'
      }
    }
  }
}

