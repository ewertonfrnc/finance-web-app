import * as React from "react";
import { useCallback, useState } from "react";
import {
	CurrencyInput,
	fromCents,
	toCents,
} from "#/components/ui/currency-input";
import { formatBRL } from "#/lib/finance";
import { cn } from "#/lib/utils";

interface EditableCellProps {
	value: number;
	ariaLabel: string;
	onSave: (value: number) => void;
	className?: string;
}

const EditableCell = React.memo(function EditableCell({
	value,
	ariaLabel,
	onSave,
	className,
}: EditableCellProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [inputCents, setInputCents] = useState(toCents(value));

	const displayValue = formatBRL(value);

	const handleDoubleClick = useCallback(() => {
		setInputCents(toCents(value));
		setIsEditing(true);
	}, [value]);

	const handleBlur = useCallback(() => {
		setIsEditing(false);
		const newValue = fromCents(inputCents);

		if (newValue !== value) {
			onSave(newValue);
		}
	}, [inputCents, value, onSave]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Escape") {
				setInputCents(toCents(value));
				setIsEditing(false);
			}
		},
		[value],
	);

	if (isEditing) {
		return (
			<CurrencyInput
				value={inputCents}
				onValueChange={setInputCents}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				aria-label={ariaLabel}
				className="h-6 w-20 px-1 text-xs tabular-nums"
				autoFocus
			/>
		);
	}

	return (
		<button
			type="button"
			onDoubleClick={handleDoubleClick}
			aria-label={ariaLabel}
			className={cn(
				"w-full cursor-pointer text-left text-xs tabular-nums rounded-sm px-1 hover:bg-muted/50",
				className,
			)}
		>
			{displayValue}
		</button>
	);
});

export { EditableCell };
