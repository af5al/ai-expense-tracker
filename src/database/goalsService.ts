import { execute, queryAll, queryOne } from './db';
import { SavingsGoal } from '@/types';

/**
 * Insert a new savings goal asynchronously.
 */
export async function insertGoal(goal: SavingsGoal): Promise<void> {
  const sql = `
    INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, createdAt)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  await execute(sql, [
    goal.id,
    goal.name,
    goal.targetAmount,
    goal.currentAmount,
    goal.targetDate,
    goal.createdAt,
  ]);
}

/**
 * Update an existing savings goal asynchronously.
 */
export async function updateGoal(goal: SavingsGoal): Promise<void> {
  const sql = `
    UPDATE savings_goals
    SET name = ?, targetAmount = ?, currentAmount = ?, targetDate = ?
    WHERE id = ?;
  `;
  await execute(sql, [
    goal.name,
    goal.targetAmount,
    goal.currentAmount,
    goal.targetDate,
    goal.id,
  ]);
}

/**
 * Update the saved amount of a goal asynchronously.
 */
export async function updateGoalProgress(id: string, currentAmount: number): Promise<void> {
  await execute('UPDATE savings_goals SET currentAmount = ? WHERE id = ?;', [currentAmount, id]);
}

/**
 * Delete a goal from the database asynchronously.
 */
export async function deleteGoal(id: string): Promise<void> {
  await execute('DELETE FROM savings_goals WHERE id = ?;', [id]);
}

/**
 * Fetch all savings goals asynchronously.
 */
export async function getGoals(): Promise<SavingsGoal[]> {
  return queryAll<SavingsGoal>('SELECT * FROM savings_goals ORDER BY createdAt DESC;');
}
