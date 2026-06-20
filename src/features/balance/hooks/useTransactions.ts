import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	createTransaction,
	deleteTransaction,
	listTransactions,
	updateTransaction,
} from "../service/transactionApi";
import type { TransactionCategory } from "../types/transaction";

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

	const updateMutation = useMutation({
		mutationFn: updateTransaction,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["balance"] });
			toast.success("Lançamento atualizado");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Erro ao atualizar lançamento",
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteTransaction,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["balance"] });
			toast.success("Lançamento excluído");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Erro ao excluir lançamento",
			);
		},
	});

	return {
		addTransaction: addMutation.mutateAsync,
		updateTransaction: updateMutation.mutateAsync,
		deleteTransaction: deleteMutation.mutateAsync,
		getTransactions: async (
			year: number,
			month: number,
			day: number,
			category?: TransactionCategory,
		) => {
			try {
				return await listTransactions({ year, month, day, category });
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Erro ao listar lançamentos",
				);
				return [];
			}
		},
	};
}
