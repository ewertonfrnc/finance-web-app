import * as React from "react";
import { useCallback } from "react";
import { TableCell, TableRow } from "#/components/ui/table";
import {
	formatBRL,
	formatWeekday,
	isFutureDate,
	isToday,
	saldoColour,
} from "#/lib/finance";
import { cn } from "#/lib/utils";
import type { DayEntry } from "../types/models";
import type { CategoryFilter, SaldoMode } from "../types/preferences";
import type { TransactionCategory } from "../types/transaction";
import { CategoryMark } from "./CategoryMark";

interface DayRowProps {
	day: number;
	month: number;
	year: number;
	entry: DayEntry;
	saldo: number;
	saldoInicial: number;
	dailyBudget: number;
	saldoMode: SaldoMode;
	categoryFilter: CategoryFilter;
	onSelectDay: () => void;
}

const CATEGORIES: TransactionCategory[] = [
	"entradas",
	"saidas",
	"diario",
	"economias",
];

const SALDO_COLOR_LABELS = {
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
	dailyBudget,
	saldoMode,
	categoryFilter,
	onSelectDay,
}: DayRowProps) {
	const dayIsToday = isToday(year, month, day);
	const dayIsFuture = isFutureDate(year, month, day);
	const dayOfWeek = new Date(year, month - 1, day).getDay();
	const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
	const saldoColor = saldoColour(saldo, {
		mode: saldoMode,
		diario: dailyBudget,
		saldoInicial,
		future: dayIsFuture,
	});
	const weekday = formatWeekday(year, month, day);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTableRowElement>) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			onSelectDay();
		},
		[onSelectDay],
	);

	const rowClass = cn(
		"group relative transition-colors",
		dayIsToday && "bg-emerald-500/8 font-semibold",
		dayIsFuture && "text-muted-foreground",
	);
	const dayCellClass = cn(
		"relative w-10 text-center font-medium",
		"py-(--balance-row-py)",
		dayIsToday ? "bg-emerald-500/10" : "",
		isWeekend && !dayIsToday && "bg-muted/35",
	);

	const values: Record<TransactionCategory, number> = {
		entradas: entry.entradas,
		saidas: entry.saidas,
		diario: entry.diario,
		economias: entry.economias,
	};
	const visibleCategories = CATEGORIES.filter(
		(category) => categoryFilter === "todas" || categoryFilter === category,
	);
	const saldoLabel = `${formatBRL(saldo)} — ${SALDO_COLOR_LABELS[saldoColor.tier]}`;

	return (
		<TableRow
			className={rowClass}
			onClick={onSelectDay}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={`Abrir detalhes de ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`}
		>
			<TableCell className={dayCellClass}>
				{dayIsToday && (
					<span className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full bg-emerald-500" />
				)}
				<span className="flex flex-col items-center leading-none">
					<span className=" font-bold text-(length:--balance-day-size) tabular-nums">
						{String(day).padStart(2, "0")}
					</span>
					<span className="mt-0.5 text-[9px] font-bold text-muted-foreground tracking-wider">
						{weekday}
					</span>
				</span>
			</TableCell>
			{visibleCategories.map((cat) => (
				<TableCell
					key={cat}
					className={cn(
						"w-28 py-(--balance-row-py)",
						dayIsFuture && cat === "diario" && "opacity-70",
					)}
				>
					<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
						<CategoryMark category={cat} active={values[cat] > 0} />
						<span className="text-right tabular-nums">
							{formatBRL(values[cat])}
						</span>
					</span>
				</TableCell>
			))}
			<TableCell
				aria-label={saldoLabel}
				style={{
					backgroundColor: saldoColor.fill,
					color: saldoColor.ink,
				}}
				className={cn(
					"w-28 py-(--balance-row-py) text-right text-xs font-semibold tabular-nums transition-colors duration-200 ease-out",
				)}
			>
				{formatBRL(saldo)}
			</TableCell>
		</TableRow>
	);
});

export { DayRow };
