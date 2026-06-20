import { apiClient, reaisToCents } from "#/lib/api";
import type {
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";

const TYPE_BY_CATEGORY: Record<TransactionCategory, string> = {
	entradas: "entrada",
	saidas: "saida",
	diario: "diario",
	economias: "economia",
};

interface CreateTransactionParams {
	year: number;
	month: number;
	day: number;
	category: TransactionCategory;
	value: number;
	description: string;
	recurrence: TransactionRecurrence;
}

function toDateString(year: number, month: number, day: number): string {
	return [year, month, day]
		.map((part) => String(part).padStart(2, "0"))
		.join("-");
}

export async function createTransaction(
	params: CreateTransactionParams,
): Promise<void> {
	await apiClient.post("/v1/transactions", {
		type: TYPE_BY_CATEGORY[params.category],
		amount: reaisToCents(params.value),
		description: params.description,
		date: toDateString(params.year, params.month, params.day),
		recurrence: params.recurrence,
	});
}
