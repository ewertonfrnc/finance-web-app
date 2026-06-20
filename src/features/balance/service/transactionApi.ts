import {
	type ApiResponse,
	apiClient,
	centsToReais,
	reaisToCents,
	unwrapApiData,
} from "#/lib/api";
import type {
	Transaction,
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";

const TYPE_BY_CATEGORY: Record<TransactionCategory, string> = {
	entradas: "entrada",
	saidas: "saida",
	diario: "diario",
	economias: "economia",
};

const CATEGORY_BY_TYPE: Record<string, TransactionCategory> = {
	entrada: "entradas",
	saida: "saidas",
	diario: "diario",
	economia: "economias",
};

const DELETE_SCOPE_BY_UI = {
	single: "single",
	"this-and-next": "following",
} as const;

interface ApiTransaction {
	id: string;
	type: string;
	amount: number;
	description: string;
	date: string;
	recurrence?: TransactionRecurrence;
	series_id?: string;
}

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
	const mm = String(month).padStart(2, "0");
	const dd = String(day).padStart(2, "0");
	return `${year}-${mm}-${dd}`;
}

function mapApiTransaction(api: ApiTransaction): Transaction {
	const [year, month, day] = api.date.split("-").map(Number);

	return {
		id: api.id,
		category: CATEGORY_BY_TYPE[api.type] ?? "saidas",
		value: centsToReais(api.amount),
		description: api.description,
		year: year ?? 0,
		month: month ?? 0,
		day: day ?? 0,
		recurrence: api.recurrence ?? "none",
		seriesId: api.series_id,
	};
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

export async function listTransactions(params: {
	year: number;
	month: number;
	day: number;
	category: TransactionCategory;
}): Promise<Transaction[]> {
	const response = await apiClient.get<ApiResponse<ApiTransaction[]>>(
		"/v1/transactions",
		{
			params: {
				year: params.year,
				month: params.month,
				day: params.day,
				type: TYPE_BY_CATEGORY[params.category],
			},
		},
	);

	return unwrapApiData(response.data).map(mapApiTransaction);
}

export async function deleteTransaction(params: {
	tx: Transaction;
	scope: "single" | "this-and-next";
}): Promise<void> {
	await apiClient.delete(`/v1/transactions/${params.tx.id}`, {
		params: {
			scope: DELETE_SCOPE_BY_UI[params.scope],
			date: toDateString(params.tx.year, params.tx.month, params.tx.day),
		},
	});
}
