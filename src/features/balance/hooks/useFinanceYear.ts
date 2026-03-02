import { useQuery } from "@tanstack/react-query";
import { normalizeFinance } from "../data/normalizeFinance";
import { getFinanceYear } from "../service/financeService";
import type { FinanceYear } from "../types/models";

export function useFinanceYear(year: number) {
	return useQuery<FinanceYear>({
		queryKey: ["finances", year],
		queryFn: async () => {
			const raw = await getFinanceYear(year);
			return normalizeFinance(raw, year);
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
}
