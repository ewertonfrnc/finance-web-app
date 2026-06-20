import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { BalanceToolbar } from "#/features/balance/components/BalanceToolbar";
import { BalanceTopBar } from "#/features/balance/components/BalanceTopBar";
import { MonthGrid } from "#/features/balance/components/MonthGrid";
import { useBalancePreferences } from "#/features/balance/hooks/useBalancePreferences";
import { useFinanceYear } from "#/features/balance/hooks/useFinanceYear";
import type { CategoryFilter } from "#/features/balance/types/preferences";
import { isAuthenticated } from "#/lib/auth";

export const Route = createFileRoute("/$year")({
	beforeLoad: ({ params }) => {
		if (!isAuthenticated()) {
			throw redirect({ to: "/login" });
		}

		const parsed = Number.parseInt(params.year, 10);
		if (Number.isNaN(parsed) || parsed < 1900 || parsed > 2100) {
			throw redirect({
				to: "/$year",
				params: { year: String(new Date().getFullYear()) },
			});
		}
	},
	component: YearPage,
});

function YearPage() {
	const { year: yearParam } = Route.useParams();
	const year = Number.parseInt(yearParam, 10);
	const { preferences, updatePreferences } = useBalancePreferences();
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas");
	const { data: financeYear } = useFinanceYear(year);

	return (
		<main className="min-h-dvh bg-background">
			<BalanceTopBar
				year={year}
				preferences={preferences}
				onPreferencesChange={updatePreferences}
			/>
			<BalanceToolbar
				year={year}
				financeYear={financeYear}
				filter={categoryFilter}
				onFilterChange={setCategoryFilter}
			/>
			<div className="mx-auto max-w-full px-4 py-4">
				<MonthGrid
					year={year}
					categoryFilter={categoryFilter}
					density={preferences.density}
					saldoMode={preferences.saldoMode}
				/>
			</div>
		</main>
	);
}
