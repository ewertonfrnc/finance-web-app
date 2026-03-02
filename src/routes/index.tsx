import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		const currentYear = new Date().getFullYear();
		throw redirect({ to: "/$year", params: { year: String(currentYear) } });
	},
	component: () => null,
});
