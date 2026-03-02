export interface DayApiData {
	entradas: number;
	saidas: number;
	diario: number;
	economias: number;
}

export interface MonthApiData {
	days: Record<string, DayApiData>;
}

export interface YearApiData {
	months: Record<string, MonthApiData>;
}

export interface FinanceApiResponse {
	saldo_inicial: number;
	years: Record<string, YearApiData>;
}
