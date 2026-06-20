import { useNavigate } from "@tanstack/react-router";
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Columns3,
	LayoutGrid,
	PanelRight,
	Plus,
	Settings,
} from "lucide-react";
import { useState } from "react";
import ThemeToggle from "#/components/ThemeToggle";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import type { BalancePreferences } from "../types/preferences";

interface BalanceTopBarProps {
	year: number;
	preferences: BalancePreferences;
	onPreferencesChange: (next: Partial<BalancePreferences>) => void;
}

export function BalanceTopBar({
	year,
	preferences,
	onPreferencesChange,
}: BalanceTopBarProps) {
	const navigate = useNavigate();
	const [settingsOpen, setSettingsOpen] = useState(false);

	function goToYear(nextYear: number) {
		navigate({ to: "/$year", params: { year: String(nextYear) } });
	}

	return (
		<header className="sticky top-0 z-30 border-border border-b bg-background/95 backdrop-blur-xl">
			<div className="flex flex-col gap-2.5 px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
				<div className="flex items-center gap-3">
					<div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
						<span className="size-2.5 rounded-full bg-current" />
					</div>
					<div>
						<h1 className="font-extrabold text-lg leading-tight tracking-tight">
							Folga
						</h1>
						<p className="text-muted-foreground text-xs">diário</p>
					</div>
				</div>

				<nav className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => goToYear(year - 1)}
						aria-label={`Ir para ${year - 1}`}
					>
						<ChevronLeft />
					</Button>
					<div className="flex items-center gap-2 font-mono font-bold text-xl tracking-wide">
						<CalendarDays className="size-4 text-emerald-700 dark:text-emerald-300" />
						{year}
					</div>
					<Button
						variant="outline"
						size="icon"
						onClick={() => goToYear(year + 1)}
						aria-label={`Ir para ${year + 1}`}
					>
						<ChevronRight />
					</Button>
				</nav>

				<div className="flex flex-wrap items-center justify-end gap-2">
					<Button className="h-9 rounded-xl bg-emerald-950 px-3.5 text-sm text-white hover:bg-emerald-900 dark:bg-emerald-200 dark:text-emerald-950">
						<Plus />
						Novo
					</Button>

					<div className="flex rounded-xl bg-muted p-0.5">
						<button
							type="button"
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-sm transition",
								preferences.layout === "trilho" && "bg-background shadow-sm",
							)}
							onClick={() => onPreferencesChange({ layout: "trilho" })}
						>
							<Columns3 className="size-4" />
							Trilho
						</button>
						<button
							type="button"
							disabled
							className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-muted-foreground text-sm opacity-60"
						>
							<LayoutGrid className="size-4" />
							Ano
						</button>
						<button
							type="button"
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-sm transition",
								preferences.layout === "foco" && "bg-background shadow-sm",
							)}
							onClick={() => onPreferencesChange({ layout: "foco" })}
						>
							<PanelRight className="size-4" />
							Foco
						</button>
					</div>

					<ThemeToggle />
					<div className="relative">
						<Button
							variant="outline"
							size="icon"
							className="rounded-xl"
							onClick={() => setSettingsOpen((open) => !open)}
							aria-expanded={settingsOpen}
							aria-label="Abrir ajustes"
						>
							<Settings />
						</Button>
						{settingsOpen ? (
							<div className="absolute top-14 right-0 z-40 w-80 rounded-3xl border bg-background p-6 shadow-2xl">
								<h2 className="font-bold text-xl">Ajustes</h2>
								<p className="mt-5 font-bold text-muted-foreground text-xs uppercase tracking-widest">
									Cor do saldo
								</p>
								<div className="mt-3 grid grid-cols-2 gap-2">
									<Button
										variant={
											preferences.saldoMode === "runway" ? "default" : "outline"
										}
										onClick={() => onPreferencesChange({ saldoMode: "runway" })}
									>
										Gradiente
									</Button>
									<Button
										variant={
											preferences.saldoMode === "tier" ? "default" : "outline"
										}
										onClick={() => onPreferencesChange({ saldoMode: "tier" })}
									>
										5 faixas
									</Button>
								</div>
								<p className="mt-5 font-bold text-muted-foreground text-xs uppercase tracking-widest">
									Densidade
								</p>
								<div className="mt-3 grid grid-cols-2 gap-2">
									<Button
										variant={
											preferences.density === "confortavel"
												? "default"
												: "outline"
										}
										onClick={() =>
											onPreferencesChange({ density: "confortavel" })
										}
									>
										Confortável
									</Button>
									<Button
										variant={
											preferences.density === "compacto" ? "default" : "outline"
										}
										onClick={() => onPreferencesChange({ density: "compacto" })}
									>
										Compacto
									</Button>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</header>
	);
}
