import { Pool } from 'pg';

// 6.3 Budget Tracking
// Tracks spend per user and enforces a hard budget cutoff.

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

/**
 * Checks if a user has remaining budget.
 * Throws BudgetExceededError if they are over budget.
 */
export async function checkBudget(userId: string): Promise<void> {
  if (!pool) return;

  try {
    const { rows } = await pool.query(
      'SELECT budget_usd, spent_usd FROM user_budgets WHERE user_id = $1',
      [userId]
    );

    if (rows.length === 0) {
      // If user is not explicitly given a budget, assume unlimited for the prototype
      // Or we could enforce a default budget. Let's do a default budget of $1.00 for unknown users.
      await pool.query(
        'INSERT INTO user_budgets (user_id, budget_usd, spent_usd) VALUES ($1, $2, $3)',
        [userId, 1.0, 0]
      );
      return;
    }

    const { budget_usd, spent_usd } = rows[0];
    if (spent_usd >= budget_usd) {
      throw new BudgetExceededError(`User ${userId} has exceeded their budget of $${budget_usd.toFixed(4)}. Spent: $${spent_usd.toFixed(4)}`);
    }
  } catch (err) {
    if (err instanceof BudgetExceededError) throw err;
    console.warn('Budget check error:', err);
  }
}

/**
 * Charges a user's budget after a successful LLM call.
 */
export async function chargeBudget(userId: string, costUsd: number): Promise<void> {
  if (!pool || costUsd <= 0) return;

  try {
    await pool.query(
      'UPDATE user_budgets SET spent_usd = spent_usd + $1 WHERE user_id = $2',
      [costUsd, userId]
    );
  } catch (err) {
    console.warn('Budget charge error:', err);
  }
}
