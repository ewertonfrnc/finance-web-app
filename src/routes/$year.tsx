import { createFileRoute, redirect } from "@tanstack/react-router";
import { MonthGrid } from "#/features/balance/components/MonthGrid";
import { YearNav } from "#/features/year-navigation/components/YearNav";
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

	return (
		<main className="mx-auto max-w-full px-4 py-2">
			<YearNav year={year} />
			<MonthGrid year={year} />
		</main>
	);
}
