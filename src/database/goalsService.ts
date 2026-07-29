import { execute, queryAll, queryOne } from './db';
import { SavingsGoal } from '@/types';

/**
 * Insert a new savings goal into the database.
 */
export function insertGoal(goal: SavingsGoal): void {
  const sql = `
    INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, createdAt)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  execute(sql, [
    goal.id,
    goal.name,
    goal.targetAmount,
    goal.currentAmount,
    goal.targetDate,
    goal.createdAt,
  ]);
}

/**
 * Update an existing savings goal.
 */
export function updateGoal(goal: SavingsGoal): void {
  const sql = `
    UPDATE savings_goals
    SET name = ?, targetAmount = ?, currentAmount = ?, targetDate = ?
    WHERE id = ?;
  `;
  execute(sql, [
    goal.name,
    goal.targetAmount,
    goal.currentAmount,
    goal.targetDate,
    goal.id,
  ]);
}

/**
 * Update the saved amount of a goal.
 */
export function updateGoalProgress(id: string, currentAmount: number): void {
  execute('UPDATE savings_goals SET currentAmount = ? WHERE id = ?;', [currentAmount, id]);
}

/**
 * Delete a goal from the database.
 */
export function deleteGoal(id: string): void {
  execute('DELETE FROM savings_goals WHERE id = ?;', [id]);
}

/**
 * Fetch all savings goals.
 */
export function getGoals(): SavingsGoal[] {
  return queryAll<SavingsGoal>('SELECT * FROM savings_goals ORDER BY createdAt DESC;');
}
