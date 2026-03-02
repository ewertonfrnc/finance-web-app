import { cn } from "#/lib/utils";
import type { TransactionCategory } from "../types/transaction";

interface CategoryMarkProps {
	category: TransactionCategory;
	active?: boolean;
	className?: string;
}

const META: Record<
	TransactionCategory,
	{ label: string; activeClass: string; inactiveClass: string }
> = {
	entradas: {
		label: "↙",
		activeClass: "finance-category-entradas",
		inactiveClass: "finance-category-inactive",
	},
	saidas: {
		label: "↗",
		activeClass: "finance-category-saidas",
		inactiveClass: "finance-category-inactive",
	},
	diario: {
		label: "D",
		activeClass: "finance-category-diario",
		inactiveClass: "finance-category-inactive",
	},
	economias: {
		label: "E",
		activeClass: "finance-category-economias",
		inactiveClass: "finance-category-inactive",
	},
};

export function CategoryMark({
	category,
	active = false,
	className,
}: CategoryMarkProps) {
	const meta = META[category];

	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold leading-none",
				active ? meta.activeClass : meta.inactiveClass,
				className,
			)}
		>
			{meta.label}
		</span>
	);
}
