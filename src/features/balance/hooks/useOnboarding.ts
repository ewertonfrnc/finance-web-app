import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
	isOnboardingDone,
	markOnboardingDone,
	writeGlobalDiarioValue,
	writeMonthConfig,
} from "../service/localStorageAdapter";

function roundCurrency(value: number): number {
	return Math.round(value * 100) / 100;
}

export function useOnboarding() {
	const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());
	const queryClient = useQueryClient();

	const completeOnboarding = useCallback(
		(gastos: {
			transporte: number;
			mercado: number;
			farmacia: number;
			lazer: number;
		}) => {
			const total =
				gastos.transporte + gastos.mercado + gastos.farmacia + gastos.lazer;
			const diarioValue = roundCurrency(total / 30);

			const currentYear = new Date().getFullYear();
			const currentMonth = new Date().getMonth() + 1;

			Array.from(
				{ length: 12 - currentMonth + 1 },
				(_, i) => currentMonth + i,
			).forEach((m) => {
				writeMonthConfig(currentYear, m, { diario_value: diarioValue });
			});

			writeGlobalDiarioValue(diarioValue);

			markOnboardingDone();
			setShowOnboarding(false);

			queryClient.invalidateQueries({ queryKey: ["finances"] });
		},
		[queryClient],
	);

	return { showOnboarding, completeOnboarding };
}
