import {
	type ApiResponse,
	apiClient,
	centsToReais,
	unwrapApiData,
} from "#/lib/api";
import { getDiasNoMes } from "#/lib/finance";
import type { FinanceYear } from "../types/models";

interface ApiDayBalance {
	day: number;
	income: number;
	expense: number;
	daily: number;
	daily_projected: number;
	savings: number;
	running_balance: number;
}

async function getMonthBalance(
	year: number,
	month: number,
): Promise<ApiDayBalance[]> {
	const response = await apiClient.get<ApiResponse<ApiDayBalance[]>>(
		"/v1/balance",
		{
			params: { year, month },
		},
	);
	return unwrapApiData(response.data);
}

function getInitialBalanceFromFirstDay(day: ApiDayBalance | undefined): number {
	if (!day) return 0;
	return centsToReais(
		day.running_balance - day.income + day.expense + day.daily + day.savings,
	);
}

export async function getFinanceYearFromApi(
	year: number,
): Promise<FinanceYear> {
	const months = await Promise.all(
		Array.from({ length: 12 }, (_, index) => getMonthBalance(year, index + 1)),
	);

	return {
		saldoInicial: getInitialBalanceFromFirstDay(months[0]?.[0]),
		months: Object.fromEntries(
			months.map((monthDays, index) => {
				const month = index + 1;
				const daysInMonth = getDiasNoMes(year, month);
				const days = Object.fromEntries(
					Array.from({ length: daysInMonth }, (_, dayIndex) => {
						const day = dayIndex + 1;
						const apiDay = monthDays.find((entry) => entry.day === day);
						return [
							day,
							{
								entradas: centsToReais(apiDay?.income ?? 0),
								saidas: centsToReais(apiDay?.expense ?? 0),
								diario: centsToReais(apiDay?.daily ?? 0),
								economias: centsToReais(apiDay?.savings ?? 0),
								saldo: centsToReais(apiDay?.running_balance ?? 0),
							},
						];
					}),
				);
				return [month, { days }];
			}),
		),
	};
}
