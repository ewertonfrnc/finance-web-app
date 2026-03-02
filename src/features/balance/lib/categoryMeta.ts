import type { TransactionCategory } from "../types/transaction";

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
	entradas: "Entrada",
	saidas: "Saída",
	diario: "Diário",
	economias: "Economia",
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
	entradas: "finance-category-entradas",
	saidas: "finance-category-saidas",
	diario: "finance-category-diario",
	economias: "finance-category-economias",
};
