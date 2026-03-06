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

interface TransactionDate {
	year: number;
	month: number;
	day: number;
}

interface RemoveSeriesFromParams {
	seriesId: string;
	category: TransactionCategory;
	from: TransactionDate;
}

function toDateValue(date: TransactionDate): number {
	return new Date(date.year, date.month - 1, date.day).getTime();
}

function keyToDate(key: string): TransactionDate | null {
	const match = key.match(/^finance_tx_(\d+)_(\d+)_(\d+)_/);
	if (!match) return null;

	const year = Number.parseInt(match[1], 10);
	const month = Number.parseInt(match[2], 10);
	const day = Number.parseInt(match[3], 10);

	if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
		return null;
	}

	return { year, month, day };
}

export function removeTransactionsFromSeries(
	params: RemoveSeriesFromParams,
): TransactionDate[] {
	const affected = new Map<string, TransactionDate>();
	const fromValue = toDateValue(params.from);
	const prefix = `${STORAGE_PREFIX}_tx_`;

	for (let i = 0; i < localStorage.length; i += 1) {
		const key = localStorage.key(i);
		if (!key || !key.startsWith(prefix)) continue;

		const date = keyToDate(key);
		if (!date) continue;

		const txs = readTransactions(
			date.year,
			date.month,
			date.day,
			params.category,
		);

		if (txs.length === 0) continue;

		const filtered = txs.filter((tx) => {
			if (tx.seriesId !== params.seriesId) return true;

			const txDateValue = toDateValue({
				year: tx.year,
				month: tx.month,
				day: tx.day,
			});

			return txDateValue < fromValue;
		});

		if (filtered.length !== txs.length) {
			writeTransactions(
				date.year,
				date.month,
				date.day,
				params.category,
				filtered,
			);
			affected.set(`${date.year}-${date.month}-${date.day}`, date);
		}
	}

	return Array.from(affected.values());
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
