import { Pool } from 'pg';
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;
export class BudgetExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BudgetExceededError';
    }
}
export async function checkBudget(userId) {
    if (!pool)
        return;
    try {
        const { rows } = await pool.query('SELECT budget_usd, spent_usd FROM user_budgets WHERE user_id = $1', [userId]);
        if (rows.length === 0) {
            await pool.query('INSERT INTO user_budgets (user_id, budget_usd, spent_usd) VALUES ($1, $2, $3)', [userId, 1.0, 0]);
            return;
        }
        const { budget_usd, spent_usd } = rows[0];
        if (spent_usd >= budget_usd) {
            throw new BudgetExceededError(`User ${userId} has exceeded their budget of $${budget_usd.toFixed(4)}. Spent: $${spent_usd.toFixed(4)}`);
        }
    }
    catch (err) {
        if (err instanceof BudgetExceededError)
            throw err;
        console.warn('Budget check error:', err);
    }
}
export async function chargeBudget(userId, costUsd) {
    if (!pool || costUsd <= 0)
        return;
    try {
        await pool.query('UPDATE user_budgets SET spent_usd = spent_usd + $1 WHERE user_id = $2', [costUsd, userId]);
    }
    catch (err) {
        console.warn('Budget charge error:', err);
    }
}
//# sourceMappingURL=tracker.js.map