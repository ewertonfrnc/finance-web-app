import * as React from "react";
import { useCallback, useRef } from "react";
import { formatBRL } from "#/lib/finance";
import { cn } from "#/lib/utils";
import type { TransactionCategory } from "../types/transaction";
import { CategoryMark } from "./CategoryMark";

interface ClickableCellProps {
	category: TransactionCategory;
	value: number;
	ariaLabel: string;
	onClick: () => void;
	onDoubleClick: () => void;
	className?: string;
}

const CLICK_DELAY = 250;

const ClickableCell = React.memo(function ClickableCell({
	category,
	value,
	ariaLabel,
	onClick,
	onDoubleClick,
	className,
}: ClickableCellProps) {
	const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleClick = useCallback(() => {
		if (clickTimer.current) {
			clearTimeout(clickTimer.current);
			clickTimer.current = null;
			onDoubleClick();
		} else {
			clickTimer.current = setTimeout(() => {
				clickTimer.current = null;
				onClick();
			}, CLICK_DELAY);
		}
	}, [onClick, onDoubleClick]);

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label={ariaLabel}
			className={cn(
				"w-full cursor-pointer rounded-sm px-0.5 py-0.5 text-right text-xs tabular-nums hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				value > 0 ? "font-medium text-foreground" : "text-muted-foreground",
				className,
			)}
		>
			<span className="grid w-full grid-cols-[1rem_1fr] items-center gap-1.5">
				<CategoryMark category={category} active={value > 0} />
				<span className="text-right">{formatBRL(value)}</span>
			</span>
		</button>
	);
});

export { ClickableCell };
