import type { FinanceApiResponse } from "../types/api";
import type { DayEntry, FinanceYear, MonthBalance } from "../types/models";

export function normalizeFinance(
	data: FinanceApiResponse,
	year: number,
): FinanceYear {
	const yearData = data.years[String(year)];
	const months: Record<number, MonthBalance> = {};

	if (yearData) {
		Object.entries(yearData.months).forEach(([monthStr, monthData]) => {
			const monthNum = Number(monthStr);
			const days: Record<number, DayEntry> = {};

			Object.entries(monthData.days).forEach(([dayStr, dayData]) => {
				const dayNum = Number(dayStr);
				days[dayNum] = {
					entradas: dayData.entradas ?? 0,
					saidas: dayData.saidas ?? 0,
					diario: dayData.diario ?? 0,
					economias: dayData.economias ?? 0,
				};
			});

			months[monthNum] = { days };
		});
	}

	return {
		saldoInicial: data.saldo_inicial ?? 0,
		months,
	};
}
