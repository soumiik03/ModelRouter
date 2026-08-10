export declare class BudgetExceededError extends Error {
    constructor(message: string);
}
export declare function checkBudget(userId: string): Promise<void>;
export declare function chargeBudget(userId: string, costUsd: number): Promise<void>;
//# sourceMappingURL=tracker.d.ts.map