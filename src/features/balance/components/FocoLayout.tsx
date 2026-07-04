import { useCallback, useMemo, useRef, useState } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import {
	calcularTotaisMes,
	formatBRL,
	formatBRLAbbr,
	formatBRLRounded,
	getDiasNoMes,
	getNomeMes,
	saldoColour,
} from "#/lib/finance";
import { cn } from "#/lib/utils";
import { useFinanceYear } from "../hooks/useFinanceYear";
import { useTransactions } from "../hooks/useTransactions";
import type { DayEntry } from "../types/models";
import type { CategoryFilter, SaldoMode } from "../types/preferences";
import { DayDrawer } from "./DayDrawer";
import { MonthTable } from "./MonthTable";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const EMPTY_DAY: DayEntry = { entradas: 0, saidas: 0, diario: 0, economias: 0 };

interface SelectedDay {
	year: number;
	month: number;
	day: number;
}

interface FocoLayoutProps {
	year: number;
	categoryFilter: CategoryFilter;
	saldoMode: SaldoMode;
}

function getSaldoInicialFromFirstDay(day: DayEntry | undefined): number {
	if (!day || day.saldo === undefined) return 0;
	return day.saldo - day.entradas + day.saidas + day.diario + day.economias;
}

function getDailyBudgetForMonth(days: Record<number, DayEntry>): number {
	const entries = Object.values(days);
	return (
		entries.find((e) => (e.diarioProjetado ?? 0) > 0)?.diarioProjetado ??
		entries.find((e) => e.diario > 0)?.diario ??
		0
	);
}

export function FocoLayout({
	year,
	categoryFilter,
	saldoMode,
}: FocoLayoutProps) {
	const { data: financeYear, isLoading, isError } = useFinanceYear(year);
	const {
		addTransaction: addTx,
		deleteTransaction: deleteTx,
		getTransactions,
	} = useTransactions(year);

	const now = new Date();
	const currentMonth = year === now.getFullYear() ? now.getMonth() + 1 : 1;
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const closeDrawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const monthStats = useMemo(() => {
		if (!financeYear)
			return {} as Record<
				number,
				{
					saldoFim: number;
					saldoInicial: number;
					totals: ReturnType<typeof calcularTotaisMes>;
					dailyBudget: number;
					liquido: number;
				}
			>;
		return Object.fromEntries(
			MONTHS.map((m) => {
				const days = financeYear.months[m]?.days ?? {};
				const daysInMonth = getDiasNoMes(year, m);
				const saldoInicial = getSaldoInicialFromFirstDay(days[1]);
				const saldoFim = days[daysInMonth]?.saldo ?? saldoInicial;
				const totals = calcularTotaisMes(days);
				const dailyBudget = getDailyBudgetForMonth(days);
				const liquido = totals.entradas - totals.saidas;
				return [m, { saldoFim, saldoInicial, totals, dailyBudget, liquido }];
			}),
		);
	}, [financeYear, year]);

	const selectedMonthDays = useMemo(
		() => financeYear?.months[selectedMonth]?.days ?? {},
		[financeYear, selectedMonth],
	);

	const selectedSaldoInicial = useMemo(
		() => getSaldoInicialFromFirstDay(selectedMonthDays[1]),
		[selectedMonthDays],
	);

	const drawerMonthDays = selectedDay
		? (financeYear?.months[selectedDay.month]?.days ?? {})
		: {};
	const drawerEntry = selectedDay
		? (drawerMonthDays[selectedDay.day] ?? EMPTY_DAY)
		: null;
	const drawerSaldo = selectedDay
		? (drawerMonthDays[selectedDay.day]?.saldo ?? 0)
		: 0;
	const drawerDailyBudget = useMemo(() => {
		if (!selectedDay || !financeYear) return 0;
		return getDailyBudgetForMonth(
			financeYear.months[selectedDay.month]?.days ?? {},
		);
	}, [financeYear, selectedDay]);

	const handleSelectDay = useCallback((day: SelectedDay) => {
		if (closeDrawerTimeoutRef.current) {
			clearTimeout(closeDrawerTimeoutRef.current);
			closeDrawerTimeoutRef.current = null;
		}
		const daysInMonth = getDiasNoMes(day.year, day.month);
		setSelectedDay({
			...day,
			day: Math.min(daysInMonth, Math.max(1, day.day)),
		});
		setIsDrawerOpen(true);
	}, []);

	const handleCloseDrawer = useCallback(() => {
		if (closeDrawerTimeoutRef.current)
			clearTimeout(closeDrawerTimeoutRef.current);
		setIsDrawerOpen(false);
		closeDrawerTimeoutRef.current = setTimeout(() => {
			setSelectedDay(null);
			closeDrawerTimeoutRef.current = null;
		}, 200);
	}, []);

	if (isLoading) {
		return (
			<div className="flex gap-4">
				<Skeleton className="h-[600px] w-[272px] shrink-0 rounded-xl" />
				<Skeleton className="h-[600px] flex-1 rounded-xl" />
			</div>
		);
	}

	if (isError || !financeYear) {
		return (
			<div className="text-destructive py-8 text-center">
				Erro ao carregar dados financeiros do ano {year}.
			</div>
		);
	}

	return (
		<div className="flex overflow-hidden">
			<aside className="w-[272px] shrink-0 overflow-y-auto border-r border-border bg-muted/30 lg:sticky lg:top-header lg:max-h-[calc(100dvh-var(--spacing-header))]">
				<div className="sticky top-0 z-10 border-b border-border bg-muted/60 px-4 py-3 backdrop-blur">
					<p className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
						Meses de {year}
					</p>
				</div>
				<ul className="flex flex-col py-1">
					{MONTHS.map((m) => {
						const stats = monthStats[m];
						const isActive = m === selectedMonth;
						const isCurrentMonthInYear = m === currentMonth;
						const saldoFim = stats?.saldoFim ?? 0;
						const colour = saldoColour(saldoFim, {
							mode: saldoMode,
							diario: stats?.dailyBudget,
							saldoInicial: stats?.saldoInicial,
						});
						const liquido = stats?.liquido ?? 0;
						const totals = stats?.totals;

						return (
							<li key={m} className="px-2">
								<button
									type="button"
									className={cn(
										"w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-background/60",
										isActive
											? "border-2 border-emerald-500 bg-background/80"
											: "border-2 border-transparent",
									)}
									onClick={() => setSelectedMonth(m)}
								>
									<div className="flex items-center justify-between gap-2">
										<span className="flex items-center gap-1.5 font-semibold text-sm">
											{isCurrentMonthInYear && (
												<span className="text-emerald-500">●</span>
											)}
											{getNomeMes(m)}
										</span>
										<span
											className="rounded-md px-2 py-0.5 font-mono text-xs font-bold tabular-nums"
											style={{ background: colour.fill, color: colour.ink }}
										>
											{formatBRLRounded(saldoFim)}
										</span>
									</div>
									{totals && (
										<div className="mt-1 flex items-center justify-between font-mono text-[11px]">
											<span className="flex gap-2 text-muted-foreground">
												<span className="text-emerald-600 dark:text-emerald-400">
													+{formatBRLAbbr(totals.entradas)}
												</span>
												<span className="text-red-500 dark:text-red-400">
													-{formatBRLAbbr(totals.saidas)}
												</span>
											</span>
											<span
												className={cn(
													"tabular-nums",
													liquido >= 0
														? "text-emerald-600 dark:text-emerald-400"
														: "text-red-500 dark:text-red-400",
												)}
											>
												{liquido >= 0 ? "+" : ""}
												{formatBRL(liquido)}
											</span>
										</div>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			</aside>

			<div className="min-w-0 flex-1 overflow-auto px-4 py-2 lg:sticky lg:top-header lg:max-h-[calc(100dvh-var(--spacing-header))]">
				<MonthTable
					month={selectedMonth}
					year={year}
					financeYear={financeYear}
					saldoInicialMes={selectedSaldoInicial}
					categoryFilter={categoryFilter}
					density="confortavel"
					saldoMode={saldoMode}
					focoHeader
					onSelectDay={handleSelectDay}
				/>
			</div>

			<DayDrawer
				open={isDrawerOpen}
				selectedDay={selectedDay}
				entry={drawerEntry}
				saldo={drawerSaldo}
				dailyBudget={drawerDailyBudget}
				onClose={handleCloseDrawer}
				onNavigate={handleSelectDay}
				onAddTransaction={addTx}
				onDeleteTransaction={deleteTx}
				onGetTransactions={getTransactions}
			/>
		</div>
	);
}
