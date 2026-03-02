import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "#/components/ui/button";

interface YearNavProps {
	year: number;
}

export function YearNav({ year }: YearNavProps) {
	const navigate = useNavigate();

	const goToPreviousYear = () => {
		navigate({ to: "/$year", params: { year: String(year - 1) } });
	};

	const goToNextYear = () => {
		navigate({ to: "/$year", params: { year: String(year + 1) } });
	};

	return (
		<nav className="flex items-center justify-center gap-4 py-4">
			<Button
				variant="outline"
				size="icon"
				onClick={goToPreviousYear}
				aria-label={`Ir para ${year - 1}`}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>

			<h1 className="text-xl font-bold tabular-nums">
				Jan/{year} – Dez/{year}
			</h1>

			<Button
				variant="outline"
				size="icon"
				onClick={goToNextYear}
				aria-label={`Ir para ${year + 1}`}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</nav>
	);
}
