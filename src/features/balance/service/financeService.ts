import financeData from "#/data/finance.json";
import { getDiasNoMes } from "#/lib/finance";
import type { DayApiData, FinanceApiResponse } from "../types/api";
import {
	readDayData,
	readGlobalDiarioValue,
	readMonthConfig,
	writeDayData,
} from "./localStorageAdapter";
import { sumTransactions } from "./transactionStorage";

const MIN_FINANCE_YEAR = 1900;

function roundCurrency(value: number): number {
	return Math.round(value * 100) / 100;
}

function buildYearMonths(
	data: FinanceApiResponse,
	year: number,
	today: Date,
): Record<string, { days: Record<string, DayApiData> }> {
	const yearData = data.years[String(year)];
	const months: Record<string, { days: Record<string, DayApiData> }> = {};

	Array.from({ length: 12 }, (_, i) => i + 1).forEach((m) => {
		const monthStr = String(m);
		const daysInMonth = getDiasNoMes(year, m);
		const jsonMonth = yearData?.months[monthStr];
		const monthConfig = readMonthConfig(year, m);
		const globalDiarioValue = roundCurrency(readGlobalDiarioValue() ?? 0);
		const diarioValue = roundCurrency(
			monthConfig?.diario_value ?? globalDiarioValue,
		);

		const days: Record<string, DayApiData> = {};

		Array.from({ length: daysInMonth }, (_, i) => i + 1).forEach((d) => {
			const dayStr = String(d);
			const jsonDay = jsonMonth?.days[dayStr];
			const localDay = readDayData(year, m, d);

			const isFutureDay = new Date(year, m - 1, d).getTime() > today.getTime();
			const txDiarioSum = roundCurrency(sumTransactions(year, m, d, "diario"));
			const diarioFinal = isFutureDay
				? roundCurrency(diarioValue + txDiarioSum)
				: txDiarioSum;

			days[dayStr] = {
				entradas: localDay?.entradas ?? jsonDay?.entradas ?? 0,
				saidas: localDay?.saidas ?? jsonDay?.saidas ?? 0,
				diario: diarioFinal,
				economias: localDay?.economias ?? jsonDay?.economias ?? 0,
			};
		});

		months[monthStr] = { days };
	});

	return months;
}

function calculateYearEndBalance(
	year: number,
	initialBalance: number,
	months: Record<string, { days: Record<string, DayApiData> }>,
): number {
	let carryOver = initialBalance;

	for (let month = 1; month <= 12; month += 1) {
		const monthDays = months[String(month)]?.days;
		if (!monthDays) continue;

		const daysInMonth = getDiasNoMes(year, month);
		for (let day = 1; day <= daysInMonth; day += 1) {
			const entry = monthDays[String(day)];
			if (!entry) continue;

			carryOver = roundCurrency(
				carryOver +
					(entry.entradas - entry.saidas - entry.diario - entry.economias),
			);
		}
	}

	return carryOver;
}

function resolveInitialBalanceForYear(
	data: FinanceApiResponse,
	year: number,
	today: Date,
): number {
	const availableYears = Object.keys(data.years)
		.map((value) => Number.parseInt(value, 10))
		.filter((value) => !Number.isNaN(value));

	const firstYearFromData = availableYears.length
		? Math.min(...availableYears)
		: year;
	const startYear = Math.max(
		MIN_FINANCE_YEAR,
		Math.min(firstYearFromData, year),
	);

	let carryOver = data.saldo_inicial;

	for (let currentYear = startYear; currentYear < year; currentYear += 1) {
		const yearMonths = buildYearMonths(data, currentYear, today);
		carryOver = calculateYearEndBalance(currentYear, carryOver, yearMonths);
	}

	return carryOver;
}

export async function getFinanceYear(
	year: number,
): Promise<FinanceApiResponse> {
	const data = financeData as FinanceApiResponse;

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const months = buildYearMonths(data, year, today);
	const saldoInicialYear = resolveInitialBalanceForYear(data, year, today);

	return {
		saldo_inicial: saldoInicialYear,
		years: {
			[String(year)]: { months },
		},
	};
}

export async function updateDay(
	year: number,
	month: number,
	day: number,
	field: keyof DayApiData,
	value: number,
): Promise<void> {
	writeDayData(year, month, day, { [field]: roundCurrency(value) });
}
