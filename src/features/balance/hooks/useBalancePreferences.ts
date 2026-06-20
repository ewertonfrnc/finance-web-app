import { useEffect, useState } from "react";
import type { BalancePreferences } from "../types/preferences";

const LAYOUT_KEY = "finance_pref_layout";
const DENSITY_KEY = "finance_pref_density";
const SALDO_MODE_KEY = "finance_pref_saldo_mode";

const DEFAULT_PREFERENCES: BalancePreferences = {
	layout: "trilho",
	density: "confortavel",
	saldoMode: "tier",
};

function readPreferences(): BalancePreferences {
	if (typeof window === "undefined") return DEFAULT_PREFERENCES;

	const layout = window.localStorage.getItem(LAYOUT_KEY);
	const density = window.localStorage.getItem(DENSITY_KEY);
	const saldoMode = window.localStorage.getItem(SALDO_MODE_KEY);

	return {
		layout: layout === "foco" ? "foco" : "trilho",
		density: density === "compacto" ? "compacto" : "confortavel",
		saldoMode: saldoMode === "runway" ? "runway" : "tier",
	};
}

export function useBalancePreferences() {
	const [preferences, setPreferences] =
		useState<BalancePreferences>(DEFAULT_PREFERENCES);

	useEffect(() => {
		setPreferences(readPreferences());
	}, []);

	function updatePreferences(next: Partial<BalancePreferences>) {
		setPreferences((current) => {
			const updated = { ...current, ...next };
			window.localStorage.setItem(LAYOUT_KEY, updated.layout);
			window.localStorage.setItem(DENSITY_KEY, updated.density);
			window.localStorage.setItem(SALDO_MODE_KEY, updated.saldoMode);
			return updated;
		});
	}

	return { preferences, updatePreferences };
}
