export interface DayEntry {
	entradas: number;
	saidas: number;
	diario: number;
	diarioProjetado?: number;
	economias: number;
	saldo?: number;
}

export interface MonthBalance {
	days: Record<number, DayEntry>;
}

export interface FinanceYear {
	saldoInicial: number;
	months: Record<number, MonthBalance>;
}

export type SaldoColor =
	| "dark-green"
	| "light-green"
	| "yellow"
	| "light-red"
	| "dark-red";
