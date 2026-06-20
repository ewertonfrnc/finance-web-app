import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { getDiasNoMes } from "#/lib/finance";
import { cn } from "#/lib/utils";
import { useFinanceYear } from "../hooks/useFinanceYear";
import { useTransactions } from "../hooks/useTransactions";
import type { DayEntry } from "../types/models";
import type {
	BalanceDensity,
	CategoryFilter,
	SaldoMode,
} from "../types/preferences";
import { DayDrawer } from "./DayDrawer";
import { LazyMonth } from "./LazyMonth";
import { MonthTable } from "./MonthTable";

interface MonthGridProps {
	year: number;
	categoryFilter: CategoryFilter;
	density: BalanceDensity;
	saldoMode: SaldoMode;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const EMPTY_DAY: DayEntry = {
	entradas: 0,
	saidas: 0,
	diario: 0,
	economias: 0,
};

interface SelectedDay {
	year: number;
	month: number;
	day: number;
}

function getSaldoInicialFromFirstDay(day: DayEntry | undefined): number {
	if (!day || day.saldo === undefined) return 0;
	return day.saldo - day.entradas + day.saidas + day.diario + day.economias;
}

export function MonthGrid({
	year,
	categoryFilter,
	density,
	saldoMode,
}: MonthGridProps) {
	const { data: financeYear, isLoading, isError } = useFinanceYear(year);
	const {
		addTransaction: addTx,
		deleteTransaction: deleteTx,
		getTransactions,
	} = useTransactions(year);
	const containerRef = useRef<HTMLDivElement>(null);
	const monthRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const focusedYearRef = useRef<number | null>(null);
	const closeDrawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const saldosIniciaisMes = useMemo(() => {
		if (!financeYear) return {};

		const result: Record<number, number> = {};

		MONTHS.forEach((m) => {
			const monthData = financeYear.months[m];
			result[m] = getSaldoInicialFromFirstDay(monthData?.days[1]);
		});

		return result;
	}, [financeYear]);

	const targetMonth = useMemo(() => {
		const now = new Date();
		return year === now.getFullYear() ? now.getMonth() + 1 : 1;
	}, [year]);

	const monthScrollLeft = useCallback((month: number) => {
		const container = containerRef.current;
		const el = monthRefs.current[month];
		if (!container || !el) return 0;
		return Math.max(0, el.offsetLeft - container.offsetLeft - 8);
	}, []);

	const scrollToMonth = useCallback(
		(month: number, behavior: ScrollBehavior = "smooth") => {
			const container = containerRef.current;
			const el = monthRefs.current[month];
			if (!container || !el) return;
			container.scrollTo({ left: monthScrollLeft(month), behavior });
			el.focus({ preventScroll: true });
		},
		[monthScrollLeft],
	);

	useEffect(() => {
		if (!financeYear) return;
		if (focusedYearRef.current === year) return;
		if (!containerRef.current || !monthRefs.current[targetMonth]) return;

		scrollToMonth(targetMonth, "auto");
		focusedYearRef.current = year;
	}, [year, targetMonth, financeYear, scrollToMonth]);

	useEffect(() => {
		if (!selectedDay || selectedDay.year === year) return;
		setIsDrawerOpen(false);
		setSelectedDay(null);
	}, [selectedDay, year]);

	useEffect(() => {
		return () => {
			if (closeDrawerTimeoutRef.current) {
				clearTimeout(closeDrawerTimeoutRef.current);
			}
		};
	}, []);

	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollIndicators = useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 20);
		setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
	}, []);

	const getFocusedMonth = useCallback(() => {
		const container = containerRef.current;
		if (!container) return targetMonth;

		const { scrollLeft } = container;
		let closest = MONTHS[0];
		let minDistance = Number.POSITIVE_INFINITY;
		for (const month of MONTHS) {
			if (!monthRefs.current[month]) continue;
			const distance = Math.abs(monthScrollLeft(month) - scrollLeft);
			if (distance < minDistance) {
				minDistance = distance;
				closest = month;
			}
		}
		return closest;
	}, [monthScrollLeft, targetMonth]);

	const scrollByMonths = useCallback(
		(direction: -1 | 1) => {
			const current = getFocusedMonth();
			const next = Math.min(12, Math.max(1, current + direction));
			scrollToMonth(next);
		},
		[getFocusedMonth, scrollToMonth],
	);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.addEventListener("scroll", updateScrollIndicators, { passive: true });
		updateScrollIndicators();
		return () => el.removeEventListener("scroll", updateScrollIndicators);
	}, [updateScrollIndicators]);

	useEffect(() => {
		if (!financeYear) return;
		const frame = requestAnimationFrame(updateScrollIndicators);
		return () => cancelAnimationFrame(frame);
	}, [financeYear, updateScrollIndicators]);

	const selectedMonthDays = selectedDay
		? (financeYear?.months[selectedDay.month]?.days ?? {})
		: {};
	const selectedEntry = selectedDay
		? (selectedMonthDays[selectedDay.day] ?? EMPTY_DAY)
		: null;
	const selectedSaldo = selectedDay
		? (selectedMonthDays[selectedDay.day]?.saldo ??
			saldosIniciaisMes[selectedDay.month] ??
			0)
		: 0;
	const selectedDailyBudget = useMemo(() => {
		if (!selectedDay || !financeYear) return 0;
		const days = financeYear.months[selectedDay.month]?.days ?? {};
		const entries = Object.values(days);
		return (
			entries.find((entry) => (entry.diarioProjetado ?? 0) > 0)
				?.diarioProjetado ??
			entries.find((entry) => entry.diario > 0)?.diario ??
			0
		);
	}, [financeYear, selectedDay]);

	const handleSelectDay = useCallback((day: SelectedDay) => {
		if (closeDrawerTimeoutRef.current) {
			clearTimeout(closeDrawerTimeoutRef.current);
			closeDrawerTimeoutRef.current = null;
		}
		const daysInMonth = getDiasNoMes(day.year, day.month);
		setSelectedDay({
			year: day.year,
			month: day.month,
			day: Math.min(daysInMonth, Math.max(1, day.day)),
		});
		setIsDrawerOpen(true);
	}, []);

	const handleCloseDrawer = useCallback(() => {
		if (closeDrawerTimeoutRef.current) {
			clearTimeout(closeDrawerTimeoutRef.current);
		}
		setIsDrawerOpen(false);
		closeDrawerTimeoutRef.current = setTimeout(() => {
			setSelectedDay(null);
			closeDrawerTimeoutRef.current = null;
		}, 200);
	}, []);

	if (isLoading) {
		return (
			<div className="flex gap-4 overflow-x-auto pb-4">
				{MONTHS.map((m) => (
					<div
						key={m}
						className="min-w-90 shrink-0 overflow-hidden rounded-lg border border-border"
					>
						<Skeleton className="h-8 w-full rounded-none" />
						<Skeleton className="h-[calc(31*1.75rem+3rem)] w-full rounded-none" />
					</div>
				))}
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
		<div className="relative">
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={() => scrollByMonths(-1)}
				disabled={!canScrollLeft}
				aria-label="Mês anterior"
				className={cn(
					"absolute top-[45vh] left-3 z-30 hidden rounded-full bg-background/95 shadow-xl backdrop-blur transition-opacity md:inline-flex",
					!canScrollLeft && "opacity-0",
				)}
			>
				<ChevronLeft />
			</Button>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onClick={() => scrollByMonths(1)}
				disabled={!canScrollRight}
				aria-label="Próximo mês"
				className={cn(
					"absolute top-[45vh] right-3 z-30 hidden rounded-full bg-background/95 shadow-xl backdrop-blur transition-opacity md:inline-flex",
					!canScrollRight && "opacity-0",
				)}
			>
				<ChevronRight />
			</Button>
			<div
				ref={containerRef}
				className="flex gap-4 overflow-x-auto pb-4 lg:sticky lg:top-header lg:max-h-[calc(100dvh-var(--spacing-header))] lg:overflow-y-auto"
			>
				{MONTHS.map((m) => {
					const table = (
						<MonthTable
							month={m}
							year={year}
							financeYear={financeYear}
							saldoInicialMes={saldosIniciaisMes[m] ?? 0}
							categoryFilter={categoryFilter}
							density={density}
							saldoMode={saldoMode}
							onSelectDay={handleSelectDay}
						/>
					);

					return (
						<div
							key={m}
							ref={(el) => {
								monthRefs.current[m] = el;
							}}
							tabIndex={-1}
							className="rounded-lg outline-none"
						>
							{m === targetMonth ? (
								table
							) : (
								<LazyMonth month={m} year={year}>
									{table}
								</LazyMonth>
							)}
						</div>
					);
				})}
			</div>
			<DayDrawer
				open={isDrawerOpen}
				selectedDay={selectedDay}
				entry={selectedEntry}
				saldo={selectedSaldo}
				dailyBudget={selectedDailyBudget}
				onClose={handleCloseDrawer}
				onNavigate={handleSelectDay}
				onAddTransaction={addTx}
				onDeleteTransaction={deleteTx}
				onGetTransactions={getTransactions}
			/>
		</div>
	);
}
