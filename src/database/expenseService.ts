import { execute, queryAll, queryOne } from './db';
import { Expense, CategoryType } from '@/types';

/**
 * Insert a new expense into the database asynchronously.
 */
export async function insertExpense(expense: Expense): Promise<void> {
  const sql = `
    INSERT INTO expenses (id, amount, description, category, expenseDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  await execute(sql, [
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
 * Update an existing expense in the database asynchronously.
 */
export async function updateExpense(expense: Expense): Promise<void> {
  const sql = `
    UPDATE expenses
    SET amount = ?, description = ?, category = ?, expenseDate = ?, updatedAt = ?
    WHERE id = ?;
  `;
  await execute(sql, [
    expense.amount,
    expense.description,
    expense.category,
    expense.expenseDate,
    expense.updatedAt,
    expense.id,
  ]);
}

/**
 * Delete an expense from the database asynchronously.
 */
export async function deleteExpense(id: string): Promise<void> {
  await execute('DELETE FROM expenses WHERE id = ?;', [id]);
}

/**
 * Fetch a single expense by ID asynchronously.
 */
export async function getExpenseById(id: string): Promise<Expense | null> {
  return queryOne<Expense>('SELECT * FROM expenses WHERE id = ?;', [id]);
}

/**
 * Query expenses with filters asynchronously, sorted by date.
 */
export async function getExpenses(filters?: { search?: string; category?: string }): Promise<Expense[]> {
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
 * Calculate total spent today asynchronously.
 */
export async function getSpentToday(): Promise<number> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const row = await queryOne<{ total: number }>('SELECT SUM(amount) as total FROM expenses WHERE expenseDate = ?;', [todayStr]);
    return row?.total || 0;
  } catch (error) {
    console.error('[ExpenseService] getSpentToday failed:', error);
    return 0;
  }
}

/**
 * Calculate total spent this week (starting from Monday) asynchronously.
 */
export async function getSpentThisWeek(): Promise<number> {
  try {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().split('T')[0];
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    const row = await queryOne<{ total: number }>('SELECT SUM(amount) as total FROM expenses WHERE expenseDate >= ? AND expenseDate <= ?;', [mondayStr, todayStr]);
    return row?.total || 0;
  } catch (error) {
    console.error('[ExpenseService] getSpentThisWeek failed:', error);
    return 0;
  }
}

/**
 * Get category totals spent today asynchronously.
 */
export async function getSpentTodayByCategory(): Promise<{ category: CategoryType; total: number }[]> {
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
