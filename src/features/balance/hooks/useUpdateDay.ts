import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDay } from "../service/financeService";
import type { DayApiData } from "../types/api";

interface UpdateDayParams {
	year: number;
	month: number;
	day: number;
	field: keyof DayApiData;
	value: number;
}

export function useUpdateDay(year: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ year, month, day, field, value }: UpdateDayParams) =>
			updateDay(year, month, day, field, value),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finances", year] });
		},
	});
}
