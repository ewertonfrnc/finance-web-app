import type { DayEntry, SaldoColor } from "#/features/balance/types/models";

const MONTH_NAMES = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubro",
	"Novembro",
	"Dezembro",
] as const;

export function getDiasNoMes(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export function getNomeMes(month: number): string {
	return MONTH_NAMES[month - 1] ?? "";
}

export function isToday(year: number, month: number, day: number): boolean {
	const now = new Date();
	return (
		now.getFullYear() === year &&
		now.getMonth() + 1 === month &&
		now.getDate() === day
	);
}

export interface MonthTotals {
	entradas: number;
	saidas: number;
	diario: number;
	economias: number;
}

export function calcularTotaisMes(days: Record<number, DayEntry>): MonthTotals {
	const entries = Object.values(days);

	return entries.reduce<MonthTotals>(
		(totals, entry) => ({
			entradas: totals.entradas + entry.entradas,
			saidas: totals.saidas + entry.saidas,
			diario: totals.diario + entry.diario,
			economias: totals.economias + entry.economias,
		}),
		{ entradas: 0, saidas: 0, diario: 0, economias: 0 },
	);
}

export function getSaldoColor(value: number, saldoInicial: number): SaldoColor {
	if (saldoInicial <= 0) {
		if (value > 2000) return "dark-green";
		if (value > 1000) return "light-green";
		if (value >= 0) return "yellow";
		if (value >= -500) return "light-red";
		return "dark-red";
	}

	const ratio = value / saldoInicial;

	if (ratio > 0.6) return "dark-green";
	if (ratio > 0.2) return "light-green";
	if (value >= 0) return "yellow";
	return value >= -500 ? "light-red" : "dark-red";
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function formatBRL(value: number): string {
	return brlFormatter.format(value);
}
