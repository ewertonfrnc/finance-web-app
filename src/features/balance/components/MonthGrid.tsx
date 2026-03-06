import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import { calcularSaldosMes, getDiasNoMes } from "#/lib/finance";
import { cn } from "#/lib/utils";
import { useFinanceYear } from "../hooks/useFinanceYear";
import { LazyMonth } from "./LazyMonth";
import { MonthTable } from "./MonthTable";

interface MonthGridProps {
	year: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function MonthGrid({ year }: MonthGridProps) {
	const { data: financeYear, isLoading, isError } = useFinanceYear(year);
	const containerRef = useRef<HTMLDivElement>(null);
	const monthRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const focusedYearRef = useRef<number | null>(null);

	const saldosIniciaisMes = useMemo(() => {
		if (!financeYear) return {};

		const result: Record<number, number> = {};
		let carryOver = financeYear.saldoInicial;

		MONTHS.forEach((m) => {
			result[m] = carryOver;

			const monthData = financeYear.months[m];
			if (monthData) {
				const daysInMonth = getDiasNoMes(year, m);
				const saldos = calcularSaldosMes(
					monthData.days,
					carryOver,
					daysInMonth,
				);
				carryOver = saldos[daysInMonth] ?? carryOver;
			}
		});

		return result;
	}, [financeYear, year]);

	const targetMonth = useMemo(() => {
		const now = new Date();
		return year === now.getFullYear() ? now.getMonth() + 1 : 1;
	}, [year]);

	useEffect(() => {
		if (!financeYear) return;
		if (focusedYearRef.current === year) return;

		const container = containerRef.current;
		const el = monthRefs.current[targetMonth];
		if (!container || !el) return;

		const left = el.offsetLeft - container.offsetLeft;
		container.scrollTo({
			left: Math.max(0, left - 8),
			behavior: "auto",
		});

		el.focus({ preventScroll: true });
		focusedYearRef.current = year;
	}, [year, targetMonth, financeYear]);

	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollIndicators = useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 20);
		setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
	}, []);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.addEventListener("scroll", updateScrollIndicators, { passive: true });
		updateScrollIndicators();
		return () => el.removeEventListener("scroll", updateScrollIndicators);
	}, [updateScrollIndicators]);

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
			<div
				className={cn(
					"pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-background to-transparent transition-opacity duration-200",
					canScrollLeft ? "opacity-100" : "opacity-0",
				)}
			/>
			<div
				className={cn(
					"pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-background to-transparent transition-opacity duration-200",
					canScrollRight ? "opacity-100" : "opacity-0",
				)}
			/>
			<div ref={containerRef} className="flex gap-4 overflow-x-auto pb-4">
				{MONTHS.map((m) => {
					const table = (
						<MonthTable
							month={m}
							year={year}
							financeYear={financeYear}
							saldoInicialMes={saldosIniciaisMes[m] ?? 0}
						/>
					);

					return (
						<div
							key={m}
							ref={(el) => {
								monthRefs.current[m] = el;
							}}
							tabIndex={-1}
							className="rounded-lg"
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
		</div>
	);
}
