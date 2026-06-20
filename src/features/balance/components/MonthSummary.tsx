import * as React from "react";
import { TableCell, TableFooter, TableRow } from "#/components/ui/table";
import type { MonthTotals } from "#/lib/finance";
import { formatBRL } from "#/lib/finance";
import type { CategoryFilter } from "../types/preferences";
import type { TransactionCategory } from "../types/transaction";

interface MonthSummaryProps {
	totals: MonthTotals;
	categoryFilter: CategoryFilter;
	saldoFim: number;
}

const CATEGORIES: TransactionCategory[] = [
	"entradas",
	"saidas",
	"diario",
	"economias",
];

const MonthSummary = React.memo(function MonthSummary({
	totals,
	categoryFilter,
	saldoFim,
}: MonthSummaryProps) {
	const visibleCategories = CATEGORIES.filter(
		(category) => categoryFilter === "todas" || categoryFilter === category,
	);

	return (
		<TableFooter>
			<TableRow>
				<TableCell className="text-xs font-bold uppercase tracking-wide">
					Total
				</TableCell>
				{visibleCategories.map((category) => (
					<TableCell
						key={category}
						className="text-right text-xs font-semibold tabular-nums"
					>
						{formatBRL(totals[category])}
					</TableCell>
				))}
				<TableCell className="text-right text-xs font-bold tabular-nums">
					{formatBRL(saldoFim)}
				</TableCell>
			</TableRow>
		</TableFooter>
	);
});

export { MonthSummary };
