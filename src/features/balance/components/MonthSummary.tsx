import * as React from "react";
import { TableCell, TableFooter, TableRow } from "#/components/ui/table";
import type { MonthTotals } from "#/lib/finance";
import { formatBRL } from "#/lib/finance";

interface MonthSummaryProps {
	totals: MonthTotals;
}

const MonthSummary = React.memo(function MonthSummary({
	totals,
}: MonthSummaryProps) {
	return (
		<TableFooter>
			<TableRow>
				<TableCell className="text-xs font-bold">Total</TableCell>
				<TableCell className="text-xs font-semibold tabular-nums">
					{formatBRL(totals.entradas)}
				</TableCell>
				<TableCell className="text-xs font-semibold tabular-nums">
					{formatBRL(totals.saidas)}
				</TableCell>
				<TableCell className="text-xs font-semibold tabular-nums">
					{formatBRL(totals.diario)}
				</TableCell>
				<TableCell className="text-xs font-semibold tabular-nums">
					{formatBRL(totals.economias)}
				</TableCell>
				<TableCell />
			</TableRow>
		</TableFooter>
	);
});

export { MonthSummary };
