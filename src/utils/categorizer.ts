import { CategoryType } from '@/types';

// Map keywords (lowercase) to respective categories
const KEYWORD_MAP: Record<string, CategoryType> = {
  // Food
  restaurant: 'Food',
  lunch: 'Food',
  dinner: 'Food',
  coffee: 'Food',
  cafe: 'Food',
  starbucks: 'Food',
  burger: 'Food',
  pizza: 'Food',
  groceries: 'Food',
  grocery: 'Food',
  eats: 'Food',
  food: 'Food',
  bakery: 'Food',
  supermarket: 'Food',

  // Transport
  fuel: 'Transport',
  petrol: 'Transport',
  diesel: 'Transport',
  uber: 'Transport',
  taxi: 'Transport',
  bus: 'Transport',
  train: 'Transport',
  cab: 'Transport',
  metro: 'Transport',
  gas: 'Transport',
  transit: 'Transport',

  // Entertainment
  netflix: 'Entertainment',
  spotify: 'Entertainment',
  cinema: 'Entertainment',
  movie: 'Entertainment',
  game: 'Entertainment',
  playstation: 'Entertainment',
  xbox: 'Entertainment',
  concert: 'Entertainment',
  show: 'Entertainment',
  theater: 'Entertainment',
  tickets: 'Entertainment',

  // Bills
  electricity: 'Bills',
  internet: 'Bills',
  wifi: 'Bills',
  rent: 'Bills',
  water: 'Bills',
  power: 'Bills',
  phone: 'Bills',
  mobile: 'Bills',
  insurance: 'Bills',
  subscription: 'Bills',
  bill: 'Bills',

  // Health
  doctor: 'Health',
  pharmacy: 'Health',
  medicine: 'Health',
  gym: 'Health',
  dentist: 'Health',
  clinic: 'Health',
  hospital: 'Health',
  workout: 'Health',
  fitness: 'Health',

  // Education
  book: 'Education',
  course: 'Education',
  school: 'Education',
  tuition: 'Education',
  university: 'Education',
  class: 'Education',
  lecture: 'Education',

  // Travel
  hotel: 'Travel',
  flight: 'Travel',
  resort: 'Travel',
  vacation: 'Travel',
  stay: 'Travel',
  trip: 'Travel',
  booking: 'Travel',

  // Shopping
  amazon: 'Shopping',
  shirt: 'Shopping',
  clothes: 'Shopping',
  shoes: 'Shopping',
  electronics: 'Shopping',
  target: 'Shopping',
  walmart: 'Shopping',
  store: 'Shopping',
  mall: 'Shopping',
};

/**
 * Automatically categorizes a description based on local keywords.
 * Falls back to 'Other'.
 */
export function categorizeDescription(description: string): CategoryType {
  const normalizedDesc = description.toLowerCase();
  
  // Split description into individual words/tokens
  const words = normalizedDesc.split(/[\s,\.\-_]+/);

  for (const word of words) {
    if (KEYWORD_MAP[word]) {
      return KEYWORD_MAP[word];
    }
  }

  // Check substring matches for compounding words (e.g. "uberride", "starbucks coffee")
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (normalizedDesc.includes(keyword)) {
      return category;
    }
  }

  return 'Other';
}
