import * as React from "react";
import { Suspense, useCallback, useState } from "react";
import { TableCell, TableRow } from "#/components/ui/table";
import { formatBRL, getNomeMes, getSaldoColor, isToday } from "#/lib/finance";
import { cn } from "#/lib/utils";
import { readTransactions } from "../service/transactionStorage";
import type { DayEntry, SaldoColor } from "../types/models";
import type {
	Transaction,
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";
import { ClickableCell } from "./ClickableCell";
import { DeleteRecurrenceModal } from "./DeleteRecurrenceModal";

const AddEntryModal = React.lazy(() =>
	import("./AddEntryModal").then((m) => ({ default: m.AddEntryModal })),
);
const EntryListModal = React.lazy(() =>
	import("./EntryListModal").then((m) => ({ default: m.EntryListModal })),
);

interface DayRowProps {
	day: number;
	month: number;
	year: number;
	entry: DayEntry;
	saldo: number;
	saldoInicial: number;
	onAddTransaction: (params: {
		year: number;
		month: number;
		day: number;
		category: TransactionCategory;
		value: number;
		description: string;
		recurrence: TransactionRecurrence;
	}) => void;
	onDeleteTransaction: (params: {
		tx: Transaction;
		scope: "single" | "this-and-next";
	}) => void;
}

type ModalState =
	| { type: "closed" }
	| { type: "add"; category: TransactionCategory }
	| {
			type: "list";
			category: TransactionCategory;
			transactions: Transaction[];
	  };

const CATEGORIES: TransactionCategory[] = [
	"entradas",
	"saidas",
	"diario",
	"economias",
];

const CATEGORY_FIELD_LABELS: Record<TransactionCategory, string> = {
	entradas: "Entradas",
	saidas: "Saídas",
	diario: "Diário",
	economias: "Economias",
};

const SALDO_CELL_CLASSES: Record<SaldoColor, string> = {
	"dark-green": "finance-saldo-dark-green",
	"light-green": "finance-saldo-light-green",
	yellow: "finance-saldo-yellow",
	"light-red": "finance-saldo-light-red",
	"dark-red": "finance-saldo-dark-red",
};

const SALDO_COLOR_LABELS: Record<SaldoColor, string> = {
	"dark-green": "Saldo muito positivo",
	"light-green": "Saldo positivo",
	yellow: "Saldo baixo",
	"light-red": "Saldo negativo",
	"dark-red": "Saldo muito negativo",
};

const DayRow = React.memo(function DayRow({
	day,
	month,
	year,
	entry,
	saldo,
	saldoInicial,
	onAddTransaction,
	onDeleteTransaction,
}: DayRowProps) {
	const [modal, setModal] = useState<ModalState>({ type: "closed" });
	const [pendingRecurringDelete, setPendingRecurringDelete] =
		useState<Transaction | null>(null);

	const dayIsToday = isToday(year, month, day);
	const dayOfWeek = new Date(year, month - 1, day).getDay();
	const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
	const saldoColor: SaldoColor = getSaldoColor(saldo, saldoInicial);
	const monthName = getNomeMes(month);

	const makeAriaLabel = useCallback(
		(field: string) => `${field} do dia ${day} de ${monthName}`,
		[day, monthName],
	);

	const handleClick = useCallback(
		(category: TransactionCategory) => {
			const txs = readTransactions(year, month, day, category);
			setModal({ type: "list", category, transactions: txs });
		},
		[year, month, day],
	);

	const handleDoubleClick = useCallback((category: TransactionCategory) => {
		setModal({ type: "add", category });
	}, []);

	const handleCloseModal = useCallback(() => {
		setModal({ type: "closed" });
	}, []);

	const handleSaveEntry = useCallback(
		(data: {
			value: number;
			description: string;
			day: number;
			recurrence: TransactionRecurrence;
		}) => {
			if (modal.type !== "add") return;
			onAddTransaction({
				year,
				month,
				day: data.day,
				category: modal.category,
				value: data.value,
				description: data.description,
				recurrence: data.recurrence,
			});
			setModal({ type: "closed" });
		},
		[modal, year, month, onAddTransaction],
	);

	const applyDelete = useCallback(
		(tx: Transaction, scope: "single" | "this-and-next") => {
			onDeleteTransaction({ tx, scope });

			if (modal.type !== "list") return;

			const remaining =
				scope === "this-and-next" && tx.seriesId
					? modal.transactions.filter((item) => item.seriesId !== tx.seriesId)
					: modal.transactions.filter((item) => item.id !== tx.id);

			if (remaining.length === 0) {
				setModal({ type: "closed" });
			} else {
				setModal({
					type: "list",
					category: modal.category,
					transactions: remaining,
				});
			}
		},
		[modal, onDeleteTransaction],
	);

	const handleDeleteEntry = useCallback(
		(tx: Transaction) => {
			if (modal.type !== "list") return;
			const isRecurring =
				tx.recurrence && tx.recurrence !== "none" && Boolean(tx.seriesId);

			if (isRecurring) {
				setPendingRecurringDelete(tx);
				return;
			}

			applyDelete(tx, "single");
		},
		[modal, applyDelete],
	);

	const handleCloseDeleteRecurrenceModal = useCallback(() => {
		setPendingRecurringDelete(null);
	}, []);

	const handleDeleteSingle = useCallback(() => {
		if (!pendingRecurringDelete) return;
		applyDelete(pendingRecurringDelete, "single");
		setPendingRecurringDelete(null);
	}, [pendingRecurringDelete, applyDelete]);

	const handleDeleteThisAndNext = useCallback(() => {
		if (!pendingRecurringDelete) return;
		applyDelete(pendingRecurringDelete, "this-and-next");
		setPendingRecurringDelete(null);
	}, [pendingRecurringDelete, applyDelete]);

	const rowClass = dayIsToday ? "bg-primary/5 font-semibold" : "";
	const dayCellClass = cn(
		"w-10 text-center text-xs font-medium",
		dayIsToday ? "bg-muted/50" : "",
		isWeekend && !dayIsToday && "bg-muted/35",
	);

	const values: Record<TransactionCategory, number> = {
		entradas: entry.entradas,
		saidas: entry.saidas,
		diario: entry.diario,
		economias: entry.economias,
	};
	const saldoLabel = `${formatBRL(saldo)} — ${SALDO_COLOR_LABELS[saldoColor]}`;

	return (
		<>
			<TableRow className={rowClass}>
				<TableCell className={dayCellClass}>{day}</TableCell>
				{CATEGORIES.map((cat) => (
					<TableCell key={cat} className="w-28 text-right">
						<ClickableCell
							category={cat}
							value={values[cat]}
							ariaLabel={makeAriaLabel(CATEGORY_FIELD_LABELS[cat])}
							onClick={() => handleClick(cat)}
							onDoubleClick={() => handleDoubleClick(cat)}
						/>
					</TableCell>
				))}
				<TableCell
					aria-label={saldoLabel}
					className={cn(
						"w-28 text-right text-xs font-semibold tabular-nums transition-colors duration-200 ease-out",
						SALDO_CELL_CLASSES[saldoColor],
					)}
				>
					{formatBRL(saldo)}
				</TableCell>
			</TableRow>

			{modal.type !== "closed" && (
				<Suspense fallback={null}>
					{modal.type === "add" && (
						<AddEntryModal
							open
							category={modal.category}
							defaultDay={day}
							month={month}
							year={year}
							onClose={handleCloseModal}
							onSave={handleSaveEntry}
						/>
					)}

					{modal.type === "list" && (
						<EntryListModal
							open
							category={modal.category}
							day={day}
							month={month}
							year={year}
							transactions={modal.transactions}
							onClose={handleCloseModal}
							onDelete={handleDeleteEntry}
						/>
					)}
				</Suspense>
			)}

			<DeleteRecurrenceModal
				open={pendingRecurringDelete !== null}
				tx={pendingRecurringDelete}
				onClose={handleCloseDeleteRecurrenceModal}
				onDeleteSingle={handleDeleteSingle}
				onDeleteThisAndNext={handleDeleteThisAndNext}
			/>
		</>
	);
});

export { DayRow };
