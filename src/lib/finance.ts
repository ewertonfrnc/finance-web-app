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

export function calcularSaldosMes(
	days: Record<number, DayEntry>,
	saldoInicial: number,
	daysInMonth: number,
): Record<number, number> {
	const saldos: Record<number, number> = {};
	let saldoAnterior = saldoInicial;

	Array.from({ length: daysInMonth }, (_, i) => i + 1).forEach((day) => {
		const entry = days[day];

		if (entry) {
			saldos[day] =
				saldoAnterior +
				entry.entradas -
				entry.saidas -
				entry.diario -
				entry.economias;
		} else {
			saldos[day] = saldoAnterior;
		}

		saldoAnterior = saldos[day];
	});

	return saldos;
}

export function calcularSaldoInicialMes(
	year: number,
	targetMonth: number,
	financeYear: {
		saldoInicial: number;
		months: Record<number, { days: Record<number, DayEntry> }>;
	},
): number {
	let saldo = financeYear.saldoInicial;

	Array.from({ length: targetMonth - 1 }, (_, i) => i + 1).forEach((m) => {
		const monthData = financeYear.months[m];
		if (!monthData) return;

		const daysInMonth = getDiasNoMes(year, m);
		const saldos = calcularSaldosMes(monthData.days, saldo, daysInMonth);

		const lastDay = daysInMonth;
		saldo = saldos[lastDay] ?? saldo;
	});

	return saldo;
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
