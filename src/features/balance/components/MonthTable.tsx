import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	calcularSaldosMes,
	calcularTotaisMes,
	formatBRL,
	getDiasNoMes,
	getNomeMes,
} from "#/lib/finance";
import { cn } from "#/lib/utils";
import { useTransactions } from "../hooks/useTransactions";
import { readMonthConfig } from "../service/localStorageAdapter";
import type { DayEntry, FinanceYear } from "../types/models";
import { CategoryMark } from "./CategoryMark";
import { DayRow } from "./DayRow";
import { MonthSummary } from "./MonthSummary";

interface MonthTableProps {
	month: number;
	year: number;
	financeYear: FinanceYear;
	saldoInicialMes: number;
}

export function MonthTable({
	month,
	year,
	financeYear,
	saldoInicialMes,
}: MonthTableProps) {
	const { addTransaction: addTx, deleteTransaction: deleteTx } =
		useTransactions(year);

	const monthData = financeYear.months[month];
	const daysInMonth = getDiasNoMes(year, month);
	const monthName = getNomeMes(month);

	const diarioConfig = useMemo(() => {
		const config = readMonthConfig(year, month);
		return config?.diario_value ?? 0;
	}, [year, month]);

	const days = useMemo(() => {
		if (!monthData) return {} as Record<number, DayEntry>;
		return monthData.days;
	}, [monthData]);

	const saldos = useMemo(
		() => calcularSaldosMes(days, saldoInicialMes, daysInMonth),
		[days, saldoInicialMes, daysInMonth],
	);

	const totals = useMemo(() => calcularTotaisMes(days), [days]);

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
		diario: diarioConfig,
		economias: 0,
	};

	return (
		<div className="min-w-90 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
			<h2
				className={cn(
					"border-b border-border bg-muted/40 px-3 py-2 text-sm font-medium",
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
				<span className="flex items-center gap-1.5">
					{isEmptyMonth &&
						(collapsed ? (
							<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
						) : (
							<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
						))}
					{monthName}/{year}
					{isEmptyMonth && (
						<span className="ml-auto text-xs font-normal text-muted-foreground">
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
				<Table className="table-fixed text-xs">
					<TableHeader>
						<TableRow>
							<TableHead scope="col" className="w-10 text-center text-xs">
								Dia
							</TableHead>
							<TableHead scope="col" className="w-32 text-right text-xs">
								<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
									<CategoryMark category="entradas" active />
									<span className="text-right">Entradas</span>
								</span>
							</TableHead>
							<TableHead scope="col" className="w-32 text-right text-xs">
								<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
									<CategoryMark category="saidas" active />
									<span className="text-right">Saídas</span>
								</span>
							</TableHead>
							<TableHead scope="col" className="w-32 text-right text-xs">
								<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
									<CategoryMark category="diario" active />
									<span className="text-right">Diários</span>
								</span>
							</TableHead>
							<TableHead scope="col" className="w-32 text-right text-xs">
								<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
									<CategoryMark category="economias" active />
									<span className="text-right">Economias</span>
								</span>
							</TableHead>
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
									onAddTransaction={addTx}
									onDeleteTransaction={deleteTx}
								/>
							);
						})}
					</TableBody>
					<MonthSummary totals={totals} />
				</Table>
			)}
		</div>
	);
}
