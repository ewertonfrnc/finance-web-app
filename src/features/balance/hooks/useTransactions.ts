import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { writeDayData } from "../service/localStorageAdapter";
import { createTransaction } from "../service/transactionApi";
import {
	readTransactions,
	removeTransaction,
	removeTransactionsFromSeries,
	sumTransactions,
} from "../service/transactionStorage";
import type { Transaction, TransactionCategory } from "../types/transaction";

function recalcDayField(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
): void {
	const total = sumTransactions(year, month, day, category);
	writeDayData(year, month, day, { [category]: total });
}

interface DeleteParams {
	tx: Transaction;
	scope: "single" | "this-and-next";
}

export function useTransactions(_year: number) {
	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: createTransaction,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["balance"] });
			toast.success("Lançamento adicionado");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Erro ao adicionar lançamento",
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (params: DeleteParams) => {
			if (
				params.scope === "this-and-next" &&
				params.tx.seriesId &&
				params.tx.recurrence &&
				params.tx.recurrence !== "none"
			) {
				const affectedDates = removeTransactionsFromSeries({
					seriesId: params.tx.seriesId,
					category: params.tx.category,
					from: {
						year: params.tx.year,
						month: params.tx.month,
						day: params.tx.day,
					},
				});

				affectedDates.forEach((date) => {
					recalcDayField(date.year, date.month, date.day, params.tx.category);
				});
				return;
			}

			removeTransaction(
				params.tx.year,
				params.tx.month,
				params.tx.day,
				params.tx.category,
				params.tx.id,
			);
			recalcDayField(
				params.tx.year,
				params.tx.month,
				params.tx.day,
				params.tx.category,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["balance"] });
			toast.success("Lançamento excluído");
		},
	});

	return {
		addTransaction: addMutation.mutate,
		deleteTransaction: deleteMutation.mutate,
		getTransactions: readTransactions,
	};
}
