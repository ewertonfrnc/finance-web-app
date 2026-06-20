import { ChevronDown, ChevronRight } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	calcularTotaisMes,
	formatBRL,
	getDiasNoMes,
	getNomeMes,
} from "#/lib/finance";
import { cn } from "#/lib/utils";
import { useTransactions } from "../hooks/useTransactions";
import type { DayEntry, FinanceYear } from "../types/models";
import type {
	BalanceDensity,
	CategoryFilter,
	SaldoMode,
} from "../types/preferences";
import type { TransactionCategory } from "../types/transaction";
import { CategoryMark } from "./CategoryMark";
import { DayRow } from "./DayRow";
import { MonthSummary } from "./MonthSummary";

interface MonthTableProps {
	month: number;
	year: number;
	financeYear: FinanceYear;
	saldoInicialMes: number;
	categoryFilter: CategoryFilter;
	density: BalanceDensity;
	saldoMode: SaldoMode;
}

const CATEGORIES: Array<{ key: TransactionCategory; label: string }> = [
	{ key: "entradas", label: "Entradas" },
	{ key: "saidas", label: "Saídas" },
	{ key: "diario", label: "Diários" },
	{ key: "economias", label: "Economias" },
];

export function MonthTable({
	month,
	year,
	financeYear,
	saldoInicialMes,
	categoryFilter,
	density,
	saldoMode,
}: MonthTableProps) {
	const {
		addTransaction: addTx,
		deleteTransaction: deleteTx,
		getTransactions,
	} = useTransactions(year);

	const monthData = financeYear.months[month];
	const daysInMonth = getDiasNoMes(year, month);
	const monthName = getNomeMes(month);

	const days = useMemo(() => {
		if (!monthData) return {} as Record<number, DayEntry>;
		return monthData.days;
	}, [monthData]);

	const saldos = useMemo(() => {
		return Object.fromEntries(
			Array.from({ length: daysInMonth }, (_, index) => {
				const day = index + 1;
				return [day, days[day]?.saldo ?? saldoInicialMes];
			}),
		);
	}, [days, saldoInicialMes, daysInMonth]);

	const totals = useMemo(() => calcularTotaisMes(days), [days]);
	const saldoFim = saldos[daysInMonth] ?? saldoInicialMes;
	const dailyBudget = useMemo(() => {
		const entries = Object.values(days);
		return (
			entries.find((entry) => (entry.diarioProjetado ?? 0) > 0)
				?.diarioProjetado ??
			entries.find((entry) => entry.diario > 0)?.diario ??
			0
		);
	}, [days]);
	const isCurrentMonth = (() => {
		const now = new Date();
		return year === now.getFullYear() && month === now.getMonth() + 1;
	})();

	const isEmptyMonth = useMemo(() => {
		const now = new Date();
		const isFullyPast =
			year < now.getFullYear() ||
			(year === now.getFullYear() && month < now.getMonth() + 1);
		if (!isFullyPast) return false;
		return (
			totals.entradas === 0 &&
			totals.saidas === 0 &&
			totals.economias === 0 &&
			totals.diario === 0
		);
	}, [totals, year, month]);

	const [collapsed, setCollapsed] = useState(false);

	const dayNumbers = useMemo(
		() => Array.from({ length: daysInMonth }, (_, i) => i + 1),
		[daysInMonth],
	);

	const emptyDay: DayEntry = {
		entradas: 0,
		saidas: 0,
		diario: 0,
		economias: 0,
	};
	const visibleCategories = CATEGORIES.filter(
		(category) => categoryFilter === "todas" || categoryFilter === category.key,
	);

	return (
		<div
			style={
				{
					"--balance-row-py": density === "compacto" ? "0.125rem" : "0.375rem",
					"--balance-day-size": density === "compacto" ? "0.8rem" : "0.95rem",
				} as CSSProperties
			}
			className={cn(
				"shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				isCurrentMonth && "border-emerald-500/70 shadow-emerald-500/10",
				categoryFilter === "todas" ? "min-w-90" : "min-w-64",
			)}
		>
			<h2
				className={cn(
					"border-b border-border bg-muted/40 px-3 py-2.5 text-sm font-medium",
					isEmptyMonth && "cursor-pointer select-none",
				)}
				onClick={isEmptyMonth ? () => setCollapsed((c) => !c) : undefined}
				onKeyDown={
					isEmptyMonth
						? (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setCollapsed((c) => !c);
								}
							}
						: undefined
				}
				role={isEmptyMonth ? "button" : undefined}
				tabIndex={isEmptyMonth ? 0 : undefined}
			>
				<span className="flex items-center gap-2">
					{isEmptyMonth &&
						(collapsed ? (
							<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
						) : (
							<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
						))}
					<span className="text-emerald-500">●</span>
					<span className="mr-auto">
						{monthName}/{String(year).slice(-2)}
					</span>
					<span className="hidden items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest sm:flex">
						<span>Entrou {formatBRL(totals.entradas)}</span>
						<span>Saiu {formatBRL(totals.saidas)}</span>
						<span>Saldo fim {formatBRL(saldoFim)}</span>
					</span>
					{isEmptyMonth && (
						<span className="text-xs font-normal text-muted-foreground">
							Sem lançamentos
						</span>
					)}
				</span>
			</h2>
			{isEmptyMonth && collapsed ? (
				<div className="px-3 py-4 text-center text-xs text-muted-foreground">
					Saldo: {formatBRL(saldos[daysInMonth] ?? saldoInicialMes)}
				</div>
			) : (
				<Table
					className={cn(
						"table-fixed text-xs",
						density === "compacto" && "text-[11px]",
					)}
				>
					<TableHeader>
						<TableRow>
							<TableHead scope="col" className="w-10 text-center text-xs">
								Dia
							</TableHead>
							{visibleCategories.map((category) => (
								<TableHead
									key={category.key}
									scope="col"
									className="w-32 text-right text-xs"
								>
									<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
										<CategoryMark category={category.key} active />
										<span className="text-right">{category.label}</span>
									</span>
								</TableHead>
							))}
							<TableHead scope="col" className="w-32 text-right text-xs">
								Saldo
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{dayNumbers.map((day) => {
							const entry = days[day] ?? emptyDay;
							const saldo = saldos[day] ?? 0;

							return (
								<DayRow
									key={day}
									day={day}
									month={month}
									year={year}
									entry={entry}
									saldo={saldo}
									saldoInicial={financeYear.saldoInicial}
									dailyBudget={dailyBudget}
									saldoMode={saldoMode}
									categoryFilter={categoryFilter}
									onAddTransaction={addTx}
									onDeleteTransaction={deleteTx}
									onGetTransactions={getTransactions}
								/>
							);
						})}
					</TableBody>
					<MonthSummary
						totals={totals}
						categoryFilter={categoryFilter}
						saldoFim={saldoFim}
					/>
				</Table>
			)}
		</div>
	);
}
