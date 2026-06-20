import {
	ChevronLeft,
	ChevronRight,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { formatBRL, formatWeekday, runwayDias } from "#/lib/finance";
import { cn } from "#/lib/utils";
import { CATEGORY_LABELS } from "../lib/categoryMeta";
import type { DayEntry } from "../types/models";
import type {
	Transaction,
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";
import { CategoryMark } from "./CategoryMark";
import { DeleteRecurrenceModal } from "./DeleteRecurrenceModal";
import {
	TransactionEditor,
	type TransactionEditorSaveData,
} from "./TransactionEditor";

interface SelectedDay {
	year: number;
	month: number;
	day: number;
}

interface DayDrawerProps {
	open: boolean;
	selectedDay: SelectedDay | null;
	entry: DayEntry | null;
	saldo: number;
	dailyBudget: number;
	onClose: () => void;
	onNavigate: (day: SelectedDay) => void;
	onAddTransaction: (params: {
		year: number;
		month: number;
		day: number;
		category: TransactionCategory;
		value: number;
		description: string;
		recurrence: TransactionRecurrence;
		recurrenceEndDate?: string;
	}) => Promise<void>;
	onDeleteTransaction: (params: {
		tx: Transaction;
		scope: "single" | "this-and-next";
	}) => Promise<void>;
	onGetTransactions: (
		year: number,
		month: number,
		day: number,
		category?: TransactionCategory,
	) => Promise<Transaction[]>;
}

type ActiveTab = "todas" | TransactionCategory;

type EditorState =
	| { type: "closed" }
	| { type: "add"; category: TransactionCategory }
	| { type: "edit"; tx: Transaction };

const TABS: Array<{ key: ActiveTab; label: string }> = [
	{ key: "todas", label: "Todas" },
	{ key: "entradas", label: "Entradas" },
	{ key: "saidas", label: "Saídas" },
	{ key: "diario", label: "Diários" },
	{ key: "economias", label: "Economias" },
];

const EMPTY_ENTRY: DayEntry = {
	entradas: 0,
	saidas: 0,
	diario: 0,
	economias: 0,
};

function nextCalendarDay(day: SelectedDay, direction: -1 | 1): SelectedDay {
	const date = new Date(day.year, day.month - 1, day.day + direction);
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	};
}

function formatDate(day: SelectedDay): string {
	return `${String(day.day).padStart(2, "0")}/${String(day.month).padStart(2, "0")}/${day.year}`;
}

function signedValue(category: TransactionCategory, value: number): string {
	const sign = category === "entradas" ? "+" : "-";
	return `${sign}${formatBRL(value)}`;
}

export function DayDrawer({
	open,
	selectedDay,
	entry,
	saldo,
	dailyBudget,
	onClose,
	onNavigate,
	onAddTransaction,
	onDeleteTransaction,
	onGetTransactions,
}: DayDrawerProps) {
	const [activeTab, setActiveTab] = useState<ActiveTab>("todas");
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [editor, setEditor] = useState<EditorState>({ type: "closed" });
	const [pendingRecurringDelete, setPendingRecurringDelete] =
		useState<Transaction | null>(null);

	const currentEntry = entry ?? EMPTY_ENTRY;
	const totalSaidas =
		currentEntry.saidas + currentEntry.diario + currentEntry.economias;
	const liquido = currentEntry.entradas - totalSaidas;
	const runway = dailyBudget > 0 ? runwayDias(saldo, dailyBudget) : null;

	const loadTransactions = useCallback(async () => {
		if (!selectedDay) return;
		setIsLoading(true);
		const category = activeTab === "todas" ? undefined : activeTab;
		const result = await onGetTransactions(
			selectedDay.year,
			selectedDay.month,
			selectedDay.day,
			category,
		);
		setTransactions(result);
		setIsLoading(false);
	}, [selectedDay, activeTab, onGetTransactions]);

	useEffect(() => {
		if (!open) return;
		void loadTransactions();
	}, [open, loadTransactions]);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (editor.type !== "closed" || pendingRecurringDelete) return;
			if (event.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [editor.type, open, onClose, pendingRecurringDelete]);

	const canNavigatePrevious = useMemo(() => {
		return selectedDay
			? selectedDay.year === nextCalendarDay(selectedDay, -1).year
			: false;
	}, [selectedDay]);
	const canNavigateNext = useMemo(() => {
		return selectedDay
			? selectedDay.year === nextCalendarDay(selectedDay, 1).year
			: false;
	}, [selectedDay]);

	const navigate = useCallback(
		(direction: -1 | 1) => {
			if (!selectedDay) return;
			const next = nextCalendarDay(selectedDay, direction);
			if (next.year !== selectedDay.year) return;
			onNavigate(next);
		},
		[selectedDay, onNavigate],
	);

	const saveEntry = useCallback(
		async (data: TransactionEditorSaveData) => {
			if (!selectedDay || editor.type === "closed") return;

			if (editor.type === "edit") {
				const isRecurring =
					editor.tx.recurrence &&
					editor.tx.recurrence !== "none" &&
					Boolean(editor.tx.seriesId);
				await onDeleteTransaction({
					tx: editor.tx,
					scope: isRecurring ? "this-and-next" : "single",
				});
			}

			await onAddTransaction({
				year: data.date.year,
				month: data.date.month,
				day: data.date.day,
				category: data.category,
				value: data.value,
				description: data.description,
				recurrence: data.recurrence,
				recurrenceEndDate: data.recurrenceEndDate,
			});

			setEditor({ type: "closed" });
			await loadTransactions();
		},
		[
			editor,
			selectedDay,
			onAddTransaction,
			onDeleteTransaction,
			loadTransactions,
		],
	);

	const applyDelete = useCallback(
		async (tx: Transaction, scope: "single" | "this-and-next") => {
			await onDeleteTransaction({ tx, scope });
			setTransactions((current) =>
				scope === "this-and-next" && tx.seriesId
					? current.filter((item) => item.seriesId !== tx.seriesId)
					: current.filter((item) => item.id !== tx.id),
			);
		},
		[onDeleteTransaction],
	);

	const requestDelete = useCallback(
		(tx: Transaction) => {
			const isRecurring =
				tx.recurrence && tx.recurrence !== "none" && tx.seriesId;
			if (isRecurring) {
				setPendingRecurringDelete(tx);
				return;
			}
			void applyDelete(tx, "single");
		},
		[applyDelete],
	);

	if (!selectedDay) return null;

	const activeTabLabel =
		activeTab === "todas"
			? "lançamentos"
			: CATEGORY_LABELS[activeTab].toLowerCase();
	const addCategory: TransactionCategory =
		activeTab === "todas" ? "entradas" : activeTab;

	return (
		<>
			<div
				className={cn(
					"fixed inset-0 z-40 bg-background/45 opacity-0 backdrop-blur-sm transition-opacity duration-200",
					open && "opacity-100",
				)}
				onClick={onClose}
				aria-hidden="true"
			/>
			<aside
				className={cn(
					"fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-[420px] translate-x-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200 ease-out",
					open && "translate-x-0",
				)}
				aria-label={`Detalhes de ${formatDate(selectedDay)}`}
				aria-modal="true"
				role="dialog"
			>
				<header className="border-b border-border px-5 py-4">
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => navigate(-1)}
									disabled={!canNavigatePrevious}
									aria-label="Dia anterior"
								>
									<ChevronLeft />
								</Button>
								<h2 className="text-lg font-semibold tabular-nums">
									{formatDate(selectedDay)}
								</h2>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => navigate(1)}
									disabled={!canNavigateNext}
									aria-label="Próximo dia"
								>
									<ChevronRight />
								</Button>
							</div>
							<p className="mt-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
								{formatWeekday(
									selectedDay.year,
									selectedDay.month,
									selectedDay.day,
								)}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={onClose}
							aria-label="Fechar detalhes do dia"
						>
							<X />
						</Button>
					</div>

					<div className="mt-5 rounded-xl border border-border bg-muted/35 p-4">
						<div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
							Saldo · fim do dia
						</div>
						<div className="mt-1 flex items-end justify-between gap-3">
							<strong className="text-2xl font-semibold tabular-nums">
								{formatBRL(saldo)}
							</strong>
							<Badge variant="outline" className="font-mono">
								{runway === null
									? "sem diário"
									: `≈ ${Math.round(runway)} dias`}
							</Badge>
						</div>
					</div>

					<div className="mt-3 grid grid-cols-3 gap-2 text-xs">
						<div className="rounded-lg border border-border p-2">
							<div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
								Entradas
							</div>
							<div className="mt-1 font-semibold tabular-nums">
								{formatBRL(currentEntry.entradas)}
							</div>
						</div>
						<div className="rounded-lg border border-border p-2">
							<div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
								Saídas
							</div>
							<div className="mt-1 font-semibold tabular-nums">
								{formatBRL(totalSaidas)}
							</div>
						</div>
						<div className="rounded-lg border border-border p-2">
							<div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
								Líquido
							</div>
							<div
								className={cn(
									"mt-1 font-semibold tabular-nums",
									liquido > 0
										? "text-emerald-600 dark:text-emerald-400"
										: liquido < 0
											? "text-red-600 dark:text-red-400"
											: "",
								)}
							>
								{liquido > 0 ? "+" : ""}
								{formatBRL(liquido)}
							</div>
						</div>
					</div>
				</header>

				<div className="flex border-b border-border px-4 pt-3">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								"-mb-px flex items-center gap-1.5 border-b-2 px-2 py-2 text-xs font-semibold text-muted-foreground transition-colors",
								activeTab === tab.key
									? "border-foreground text-foreground"
									: "border-transparent hover:text-foreground",
							)}
						>
							{tab.key !== "todas" && (
								<CategoryMark
									category={tab.key}
									active={activeTab === tab.key}
								/>
							)}
							{tab.label}
						</button>
					))}
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
					{isLoading ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Carregando lançamentos...
						</p>
					) : transactions.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Nenhum lançamento em {activeTabLabel}.
						</p>
					) : (
						<ul className="space-y-2">
							{transactions.map((tx) => (
								<li
									key={tx.id}
									className="rounded-xl border border-border bg-background/55 p-3"
								>
									<div className="flex items-start gap-3">
										<CategoryMark
											category={tx.category}
											active
											className="mt-0.5 size-6 shrink-0 text-sm"
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{tx.description || "Sem descrição"}
											</p>
											<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span>{formatDate(tx)}</span>
												<Badge variant="secondary" className="rounded-md">
													{CATEGORY_LABELS[tx.category]}
												</Badge>
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											<span className="mr-1 text-sm font-semibold tabular-nums">
												{signedValue(tx.category, tx.value)}
											</span>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												onClick={() => setEditor({ type: "edit", tx })}
												aria-label={`Editar ${tx.description || "lançamento"}`}
											>
												<Pencil />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="text-destructive hover:bg-destructive/10 hover:text-destructive"
												onClick={() => requestDelete(tx)}
												aria-label={`Excluir ${tx.description || "lançamento"}`}
											>
												<Trash2 />
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				<footer className="border-t border-border p-4">
					<Button
						type="button"
						className="w-full"
						onClick={() => setEditor({ type: "add", category: addCategory })}
					>
						<Plus className="h-4 w-4" />
						Adicionar neste dia
					</Button>
				</footer>
			</aside>

			<TransactionEditor
				open={editor.type !== "closed"}
				defaultCategory={
					editor.type === "add"
						? editor.category
						: editor.type === "edit"
							? editor.tx.category
							: addCategory
				}
				defaultDate={selectedDay}
				onClose={() => setEditor({ type: "closed" })}
				onSave={saveEntry}
				editData={
					editor.type === "edit"
						? {
								category: editor.tx.category,
								value: editor.tx.value,
								description: editor.tx.description,
								date: {
									year: editor.tx.year,
									month: editor.tx.month,
									day: editor.tx.day,
								},
								recurrence: editor.tx.recurrence ?? "none",
								tag: editor.tx.tag,
							}
						: undefined
				}
				onDelete={
					editor.type === "edit"
						? () => {
								const tx = editor.tx;
								setEditor({ type: "closed" });
								requestDelete(tx);
							}
						: undefined
				}
			/>

			<DeleteRecurrenceModal
				open={pendingRecurringDelete !== null}
				tx={pendingRecurringDelete}
				onClose={() => setPendingRecurringDelete(null)}
				onDeleteSingle={() => {
					if (!pendingRecurringDelete) return;
					void applyDelete(pendingRecurringDelete, "single");
					setPendingRecurringDelete(null);
				}}
				onDeleteThisAndNext={() => {
					if (!pendingRecurringDelete) return;
					void applyDelete(pendingRecurringDelete, "this-and-next");
					setPendingRecurringDelete(null);
				}}
			/>
		</>
	);
}
