import { formatBRL } from "#/lib/finance";
import { cn } from "#/lib/utils";
import { getTodayBalance, getYearSeries } from "../lib/yearStats";
import type { FinanceYear } from "../types/models";
import type { CategoryFilter } from "../types/preferences";
import type { TransactionCategory } from "../types/transaction";
import { CategoryMark } from "./CategoryMark";

const FILTERS: Array<{
	value: CategoryFilter;
	label: string;
	category?: TransactionCategory;
}> = [
	{ value: "todas", label: "Todas" },
	{ value: "entradas", label: "Entradas", category: "entradas" },
	{ value: "saidas", label: "Saídas", category: "saidas" },
	{ value: "diario", label: "Diários", category: "diario" },
	{ value: "economias", label: "Economias", category: "economias" },
];

interface BalanceToolbarProps {
	year: number;
	financeYear: FinanceYear | undefined;
	filter: CategoryFilter;
	onFilterChange: (filter: CategoryFilter) => void;
}

export function BalanceToolbar({
	year,
	financeYear,
	filter,
	onFilterChange,
}: BalanceToolbarProps) {
	const series = financeYear ? getYearSeries(year, financeYear) : [];
	const todayBalance = financeYear ? getTodayBalance(year, financeYear) : null;
	const currentBalance = todayBalance ?? series.at(-1)?.saldo ?? 0;

	return (
		<section className="border-border border-b bg-background px-4 py-2.5 lg:px-6">
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-wrap items-center gap-1.5">
					{FILTERS.map((item) => {
						const active = filter === item.value;
						return (
							<button
								key={item.value}
								type="button"
								onClick={() => onFilterChange(item.value)}
								className={cn(
									"inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-bold text-xs transition",
									active
										? "border-foreground bg-foreground text-background"
										: "border-border bg-background text-muted-foreground hover:text-foreground",
								)}
							>
								{item.category ? (
									<CategoryMark category={item.category} active />
								) : null}
								{item.label}
							</button>
						);
					})}
				</div>

				<div className="flex flex-wrap items-center justify-end gap-3">
					<div className="text-right">
						<p className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest">
							Saldo · Hoje
						</p>
						<p className="font-mono font-bold text-lg text-emerald-950 tracking-widest dark:text-emerald-100">
							{formatBRL(currentBalance)}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
