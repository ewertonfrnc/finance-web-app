import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writeDayData } from "../service/localStorageAdapter";
import {
	addTransaction,
	readTransactions,
	removeTransaction,
	sumTransactions,
} from "../service/transactionStorage";
import type {
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";

const MAX_RECURRING_YEAR = 2100;

function generateId(): string {
	return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function recalcDayField(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
): void {
	const total = sumTransactions(year, month, day, category);
	writeDayData(year, month, day, { [category]: total });
}

interface AddParams {
	year: number;
	month: number;
	day: number;
	category: TransactionCategory;
	value: number;
	description: string;
	recurrence: TransactionRecurrence;
}

interface DeleteParams {
	year: number;
	month: number;
	day: number;
	category: TransactionCategory;
	id: string;
}

interface OccurrenceDate {
	year: number;
	month: number;
	day: number;
}

function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

function buildOccurrences(params: AddParams): OccurrenceDate[] {
	const start = new Date(params.year, params.month - 1, params.day);
	const end = new Date(MAX_RECURRING_YEAR, 11, 31);

	if (params.recurrence === "none") {
		return [{ year: params.year, month: params.month, day: params.day }];
	}

	if (params.recurrence === "daily") {
		const occurrences: OccurrenceDate[] = [];
		const cursor = new Date(start);

		while (cursor <= end) {
			occurrences.push({
				year: cursor.getFullYear(),
				month: cursor.getMonth() + 1,
				day: cursor.getDate(),
			});
			cursor.setDate(cursor.getDate() + 1);
		}

		return occurrences;
	}

	if (params.recurrence === "weekly") {
		const occurrences: OccurrenceDate[] = [];
		const cursor = new Date(start);

		while (cursor <= end) {
			occurrences.push({
				year: cursor.getFullYear(),
				month: cursor.getMonth() + 1,
				day: cursor.getDate(),
			});
			cursor.setDate(cursor.getDate() + 7);
		}

		return occurrences;
	}

	const occurrences: OccurrenceDate[] = [];

	for (
		let currentYear = params.year;
		currentYear <= MAX_RECURRING_YEAR;
		currentYear += 1
	) {
		const startMonth = currentYear === params.year ? params.month : 1;

		for (let currentMonth = startMonth; currentMonth <= 12; currentMonth += 1) {
			const daysInMonth = getDaysInMonth(currentYear, currentMonth);
			if (params.day > daysInMonth) continue;

			occurrences.push({
				year: currentYear,
				month: currentMonth,
				day: params.day,
			});
		}
	}

	return occurrences;
}

export function useTransactions(_year: number) {
	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: async (params: AddParams) => {
			const occurrences = buildOccurrences(params);

			occurrences.forEach((date) => {
				addTransaction({
					id: generateId(),
					category: params.category,
					value: params.value,
					description: params.description,
					year: date.year,
					month: date.month,
					day: date.day,
				});

				recalcDayField(date.year, date.month, date.day, params.category);
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finances"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (params: DeleteParams) => {
			removeTransaction(
				params.year,
				params.month,
				params.day,
				params.category,
				params.id,
			);
			recalcDayField(params.year, params.month, params.day, params.category);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finances"] });
		},
	});

	return {
		addTransaction: addMutation.mutate,
		deleteTransaction: deleteMutation.mutate,
		getTransactions: readTransactions,
	};
}
