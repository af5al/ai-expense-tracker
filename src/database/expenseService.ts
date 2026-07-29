import { execute, queryAll, queryOne } from './db';
import { Expense, CategoryType } from '@/types';

/**
 * Insert a new expense into the database.
 */
export function insertExpense(expense: Expense): void {
  const sql = `
    INSERT INTO expenses (id, amount, description, category, expenseDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  execute(sql, [
    expense.id,
    expense.amount,
    expense.description,
    expense.category,
    expense.expenseDate,
    expense.createdAt,
    expense.updatedAt,
  ]);
}

/**
 * Update an existing expense in the database.
 */
export function updateExpense(expense: Expense): void {
  const sql = `
    UPDATE expenses
    SET amount = ?, description = ?, category = ?, expenseDate = ?, updatedAt = ?
    WHERE id = ?;
  `;
  execute(sql, [
    expense.amount,
    expense.description,
    expense.category,
    expense.expenseDate,
    expense.updatedAt,
    expense.id,
  ]);
}

/**
 * Delete an expense from the database by its ID.
 */
export function deleteExpense(id: string): void {
  execute('DELETE FROM expenses WHERE id = ?;', [id]);
}

/**
 * Fetch a single expense by ID.
 */
export function getExpenseById(id: string): Expense | null {
  return queryOne<Expense>('SELECT * FROM expenses WHERE id = ?;', [id]);
}

/**
 * Query expenses with search and category filtering, ordered by date (descending).
 */
export function getExpenses(filters?: { search?: string; category?: string }): Expense[] {
  let sql = 'SELECT * FROM expenses';
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.search) {
    conditions.push('description LIKE ?');
    params.push(`%${filters.search}%`);
  }

  if (filters?.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY expenseDate DESC, createdAt DESC;';
  
  return queryAll<Expense>(sql, params);
}

/**
 * Calculate total spent today.
 */
export function getSpentToday(): number {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const row = queryOne<{ total: number }>('SELECT SUM(amount) as total FROM expenses WHERE expenseDate = ?;', [todayStr]);
    return row?.total || 0;
  } catch (error) {
    console.error('[ExpenseService] getSpentToday failed:', error);
    return 0;
  }
}

/**
 * Calculate total spent this week (starting from Monday).
 */
export function getSpentThisWeek(): number {
  try {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().split('T')[0];
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    const row = queryOne<{ total: number }>('SELECT SUM(amount) as total FROM expenses WHERE expenseDate >= ? AND expenseDate <= ?;', [mondayStr, todayStr]);
    return row?.total || 0;
  } catch (error) {
    console.error('[ExpenseService] getSpentThisWeek failed:', error);
    return 0;
  }
}

/**
 * Get category totals spent today.
 */
export function getSpentTodayByCategory(): { category: CategoryType; total: number }[] {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT category, SUM(amount) as total 
      FROM expenses 
      WHERE expenseDate = ? 
      GROUP BY category 
      ORDER BY total DESC;
    `;
    return queryAll<{ category: CategoryType; total: number }>(sql, [todayStr]);
  } catch (error) {
    console.error('[ExpenseService] getSpentTodayByCategory failed:', error);
    return [];
  }
}
