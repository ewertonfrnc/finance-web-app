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

export type SaldoColourMode = "runway" | "tier";

export interface SaldoColourResult {
	fill: string;
	ink: string;
	tier: SaldoColor;
	runwayDays: number | null;
}

const TIER_STYLES: Record<SaldoColor, { fill: string; ink: string }> = {
	"dark-green": {
		fill: "var(--finance-saldo-dark-green-bg)",
		ink: "var(--finance-saldo-dark-green-fg)",
	},
	"light-green": {
		fill: "var(--finance-saldo-light-green-bg)",
		ink: "var(--finance-saldo-light-green-fg)",
	},
	yellow: {
		fill: "var(--finance-saldo-yellow-bg)",
		ink: "var(--finance-saldo-yellow-fg)",
	},
	"light-red": {
		fill: "var(--finance-saldo-light-red-bg)",
		ink: "var(--finance-saldo-light-red-fg)",
	},
	"dark-red": {
		fill: "var(--finance-saldo-dark-red-bg)",
		ink: "var(--finance-saldo-dark-red-fg)",
	},
};

const RUNWAY_STOPS = [
	{ days: -10, fill: [239, 188, 197], ink: [112, 21, 41], tier: "dark-red" },
	{ days: 0, fill: [248, 217, 221], ink: [133, 32, 53], tier: "light-red" },
	{ days: 10, fill: [248, 237, 200], ink: [115, 88, 15], tier: "yellow" },
	{ days: 22, fill: [219, 244, 231], ink: [24, 91, 67], tier: "light-green" },
	{ days: 40, fill: [184, 236, 212], ink: [17, 77, 54], tier: "dark-green" },
] as const;

function interpolate(start: number, end: number, ratio: number): number {
	return Math.round(start + (end - start) * ratio);
}

function rgb(values: readonly number[], alpha = 1): string {
	return `rgb(${values[0]} ${values[1]} ${values[2]} / ${alpha})`;
}

function runwayTier(days: number): SaldoColor {
	if (days <= 0) return "light-red";
	if (days <= 10) return "yellow";
	if (days <= 22) return "light-green";
	return "dark-green";
}

export function runwayDias(saldo: number, diario: number): number | null {
	if (diario <= 0) return null;
	return saldo / diario;
}

export function saldoColour(
	saldo: number,
	options: {
		mode?: SaldoColourMode;
		diario?: number;
		saldoInicial?: number;
		future?: boolean;
	} = {},
): SaldoColourResult {
	const mode = options.mode ?? "runway";
	const tier = getSaldoColor(saldo, options.saldoInicial ?? 0);

	if (mode === "tier") {
		const style = TIER_STYLES[tier];
		return {
			...style,
			tier,
			runwayDays: null,
		};
	}

	const days = runwayDias(saldo, options.diario ?? 0);
	if (days === null) {
		const style = TIER_STYLES[tier];
		return { ...style, tier, runwayDays: null };
	}

	const lowerIndex = RUNWAY_STOPS.findIndex((stop) => days <= stop.days);
	const upperStop =
		lowerIndex === -1
			? RUNWAY_STOPS[RUNWAY_STOPS.length - 1]
			: RUNWAY_STOPS[lowerIndex];
	const lowerStop =
		lowerIndex <= 0 ? RUNWAY_STOPS[0] : RUNWAY_STOPS[lowerIndex - 1];
	const span = upperStop.days - lowerStop.days || 1;
	const ratio = Math.min(1, Math.max(0, (days - lowerStop.days) / span));
	const fill = lowerStop.fill.map((value, index) =>
		interpolate(value, upperStop.fill[index], ratio),
	);
	const ink = lowerStop.ink.map((value, index) =>
		interpolate(value, upperStop.ink[index], ratio),
	);

	return {
		fill: rgb(fill, options.future ? 0.42 : 1),
		ink: rgb(ink, options.future ? 0.7 : 1),
		tier: runwayTier(days),
		runwayDays: days,
	};
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function formatBRL(value: number): string {
	return brlFormatter.format(value);
}

export function formatWeekday(
	year: number,
	month: number,
	day: number,
): string {
	return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
		.format(new Date(year, month - 1, day))
		.replace(".", "")
		.slice(0, 3)
		.toUpperCase();
}

export function isFutureDate(
	year: number,
	month: number,
	day: number,
): boolean {
	const today = new Date();
	const target = new Date(year, month - 1, day);
	today.setHours(0, 0, 0, 0);
	target.setHours(0, 0, 0, 0);
	return target > today;
}
