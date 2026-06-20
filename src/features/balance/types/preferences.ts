import type { TransactionCategory } from "./transaction";

export type BalanceLayout = "trilho" | "foco";
export type BalanceDensity = "confortavel" | "compacto";
export type SaldoMode = "runway" | "tier";
export type CategoryFilter = "todas" | TransactionCategory;

export interface BalancePreferences {
	layout: BalanceLayout;
	density: BalanceDensity;
	saldoMode: SaldoMode;
}
