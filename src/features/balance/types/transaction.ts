export type TransactionCategory =
	| "entradas"
	| "saidas"
	| "diario"
	| "economias";

export type TransactionRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface Transaction {
	id: string;
	category: TransactionCategory;
	value: number;
	description: string;
	year: number;
	month: number;
	day: number;
}
