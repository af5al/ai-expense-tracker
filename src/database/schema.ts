// SQL schema statements for SQLite initialization
export const SCHEMA_TABLES = [
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    expenseDate TEXT NOT NULL, -- YYYY-MM-DD
    createdAt TEXT NOT NULL,   -- ISO Timestamp
    updatedAt TEXT NOT NULL    -- ISO Timestamp
  );`,

  `CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    periodType TEXT NOT NULL, -- 'weekly'
    startDate TEXT NOT NULL,  -- YYYY-MM-DD
    endDate TEXT NOT NULL,    -- YYYY-MM-DD
    totalLimit REAL NOT NULL,
    status TEXT NOT NULL,     -- 'active', 'archived', 'draft'
    createdAt TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS budget_categories (
    id TEXT PRIMARY KEY NOT NULL,
    budgetId TEXT NOT NULL,
    category TEXT NOT NULL,
    limitAmount REAL NOT NULL,
    FOREIGN KEY(budgetId) REFERENCES budgets(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    targetAmount REAL NOT NULL,
    currentAmount REAL NOT NULL,
    targetDate TEXT NOT NULL, -- YYYY-MM
    createdAt TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS recurring_expenses (
    id TEXT PRIMARY KEY NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    frequency TEXT NOT NULL,      -- 'weekly', 'monthly'
    nextExpectedDate TEXT NOT NULL, -- YYYY-MM-DD
    active INTEGER NOT NULL DEFAULT 1
  );`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`
];

// List of indexes to optimize query performance on common filters
export const SCHEMA_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expenseDate);`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets (startDate, endDate);`,
  `CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_expenses (nextExpectedDate);`
];
