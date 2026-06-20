import { getDiasNoMes } from "#/lib/finance";
import type { FinanceYear } from "../types/models";

export interface YearPoint {
	month: number;
	day: number;
	saldo: number;
}

export function getYearSeries(
	year: number,
	financeYear: FinanceYear,
): YearPoint[] {
	return Array.from({ length: 12 }, (_, index) => index + 1).flatMap(
		(month) => {
			const monthData = financeYear.months[month];
			const daysInMonth = getDiasNoMes(year, month);

			return Array.from({ length: daysInMonth }, (_, dayIndex) => {
				const day = dayIndex + 1;
				return {
					month,
					day,
					saldo: monthData?.days[day]?.saldo ?? 0,
				};
			});
		},
	);
}

export function getTodayBalance(
	year: number,
	financeYear: FinanceYear,
): number | null {
	const now = new Date();
	if (now.getFullYear() !== year) return null;

	return (
		financeYear.months[now.getMonth() + 1]?.days[now.getDate()]?.saldo ?? null
	);
}
