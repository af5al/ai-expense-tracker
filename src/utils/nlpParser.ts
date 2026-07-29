import { CategoryType } from '@/types';
import { categorizeDescription } from './categorizer';

interface ParsedExpense {
  amount: number;
  description: string;
  category: CategoryType;
  expenseDate: string; // YYYY-MM-DD format
}

// Regex to capture currency signs, spaces, and decimal/integer amounts
const AMOUNT_REGEX = /(?:\$|€|£|¥|₹)?\s*(\d+(?:\.\d{1,2})?)/i;

// Words to strip out of the description (case-insensitive)
const FILLERS = [
  /spent/i,
  /spend/i,
  /buying/i,
  /buy/i,
  /costs/i,
  /cost/i,
  /purchased/i,
  /purchase/i,
  /\bon\b/i,
  /\bfor\b/i,
  /\bwith\b/i,
  /\ba\b/i,
  /\ban\b/i,
  /\bat\b/i,
];

/**
 * Parses natural language input to extract expense attributes.
 * Examples: 
 *   "12 lunch today" -> { amount: 12, description: "lunch", category: "Food", expenseDate: "2026-07-29" }
 *   "spent 35 on fuel yesterday" -> { amount: 35, description: "fuel", category: "Transport", expenseDate: "2026-07-28" }
 */
export function parseNaturalLanguageExpense(input: string): ParsedExpense {
  const cleanInput = input.trim();
  let amount = 0;
  let remainingText = cleanInput;
  let expenseDate = new Date().toISOString().split('T')[0]; // Default to today

  // 1. Extract Date
  if (/yesterday/i.test(remainingText)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expenseDate = yesterday.toISOString().split('T')[0];
    remainingText = remainingText.replace(/yesterday/i, '');
  } else if (/today/i.test(remainingText)) {
    remainingText = remainingText.replace(/today/i, '');
  }

  // 2. Extract Amount
  const amountMatch = remainingText.match(AMOUNT_REGEX);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
    // Remove the amount from the text
    remainingText = remainingText.replace(amountMatch[0], '');
  }

  // 3. Clean Description
  let description = remainingText;
  
  // Strip out fillers
  for (const filler of FILLERS) {
    description = description.replace(filler, '');
  }

  // Clean double spaces and punctuation, then trim
  description = description
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Handle fallback if description became empty
  if (!description) {
    description = 'Quick Expense';
  } else {
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // 4. Categorize
  const category = categorizeDescription(description);

  return {
    amount,
    description,
    category,
    expenseDate,
  };
}
