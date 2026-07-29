import { execute, queryAll, queryOne } from './db';
import { RecurringExpense } from '@/types';

/**
 * Maps database row to standard TypeScript typed object.
 */
function mapRow(row: any): RecurringExpense {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    category: row.category,
    frequency: row.frequency,
    nextExpectedDate: row.nextExpectedDate,
    active: row.active === 1,
  };
}

/**
 * Fetch all recurring commitments.
 */
export function getRecurringExpenses(onlyActive: boolean = false): RecurringExpense[] {
  const sql = onlyActive 
    ? 'SELECT * FROM recurring_expenses WHERE active = 1;' 
    : 'SELECT * FROM recurring_expenses;';
  
  const rows = queryAll<any>(sql);
  return rows.map(mapRow);
}

/**
 * Insert a new recurring expense commitment.
 */
export function insertRecurringExpense(rec: RecurringExpense): void {
  const sql = `
    INSERT OR REPLACE INTO recurring_expenses (id, description, amount, category, frequency, nextExpectedDate, active)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  execute(sql, [
    rec.id,
    rec.description,
    rec.amount,
    rec.category,
    rec.frequency,
    rec.nextExpectedDate,
    rec.active ? 1 : 0,
  ]);
}

/**
 * Confirm / Activate a recurring subscription (Layer 2 confirmation).
 */
export function activateRecurringExpense(id: string): void {
  execute('UPDATE recurring_expenses SET active = 1 WHERE id = ?;', [id]);
}

/**
 * Delete recurring expense.
 */
export function deleteRecurringExpense(id: string): void {
  execute('DELETE FROM recurring_expenses WHERE id = ?;', [id]);
}

/**
 * Update next expected billing cycle date.
 */
export function updateRecurringNextDate(id: string, nextDate: string): void {
  execute('UPDATE recurring_expenses SET nextExpectedDate = ? WHERE id = ?;', [nextDate, id]);
}
