import { useQuery } from "@tanstack/react-query";
import { isAuthenticated } from "#/lib/auth";
import { getFinanceYearFromApi } from "../service/balanceApi";
import type { FinanceYear } from "../types/models";

export function useFinanceYear(year: number) {
	return useQuery<FinanceYear>({
		queryKey: ["balance", year],
		queryFn: () => getFinanceYearFromApi(year),
		enabled: isAuthenticated(),
		staleTime: 60_000,
	});
}
