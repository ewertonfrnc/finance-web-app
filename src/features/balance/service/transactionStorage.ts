import type { Transaction, TransactionCategory } from "../types/transaction";

const STORAGE_PREFIX = "finance";

function transactionsKey(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
): string {
	return `${STORAGE_PREFIX}_tx_${year}_${month}_${day}_${category}`;
}

export function readTransactions(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
): Transaction[] {
	const raw = localStorage.getItem(transactionsKey(year, month, day, category));
	if (!raw) return [];
	return JSON.parse(raw) as Transaction[];
}

export function writeTransactions(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
	transactions: Transaction[],
): void {
	localStorage.setItem(
		transactionsKey(year, month, day, category),
		JSON.stringify(transactions),
	);
}

export function addTransaction(tx: Transaction): void {
	const existing = readTransactions(tx.year, tx.month, tx.day, tx.category);
	existing.push(tx);
	writeTransactions(tx.year, tx.month, tx.day, tx.category, existing);
}

export function removeTransaction(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
	id: string,
): void {
	const existing = readTransactions(year, month, day, category);
	const filtered = existing.filter((tx) => tx.id !== id);
	writeTransactions(year, month, day, category, filtered);
}

export function sumTransactions(
	year: number,
	month: number,
	day: number,
	category: TransactionCategory,
): number {
	const txs = readTransactions(year, month, day, category);
	return txs.reduce((sum, tx) => sum + tx.value, 0);
}
