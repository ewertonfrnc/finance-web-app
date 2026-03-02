import { useCallback, useRef, useState } from "react";
import { cn } from "#/lib/utils";

interface CurrencyInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"type" | "value" | "onChange"
	> {
	/** Value in cents (integer). 12345 = R$ 123,45 */
	value: number;
	onValueChange: (cents: number) => void;
}

function formatCents(cents: number): string {
	const abs = Math.abs(cents);
	const reais = Math.floor(abs / 100);
	const centavos = abs % 100;

	const reaisStr = reais.toLocaleString("pt-BR");
	const centavosStr = String(centavos).padStart(2, "0");

	return `R$ ${reaisStr},${centavosStr}`;
}

function CurrencyInput({
	value,
	onValueChange,
	className,
	...props
}: CurrencyInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [focused, setFocused] = useState(false);

	const display = formatCents(value);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			// Allow navigation keys
			if (
				e.key === "Tab" ||
				e.key === "Escape" ||
				e.key === "Enter" ||
				e.key === "ArrowLeft" ||
				e.key === "ArrowRight"
			) {
				if (e.key === "Enter") {
					e.currentTarget.blur();
				}
				return;
			}

			e.preventDefault();

			if (e.key === "Backspace") {
				// Remove last digit
				onValueChange(Math.floor(value / 10));
				return;
			}

			// Only accept digits
			if (!/^\d$/.test(e.key)) return;

			const digit = Number.parseInt(e.key, 10);
			const next = value * 10 + digit;

			// Cap at 999999999 (R$ 9.999.999,99)
			if (next > 999999999) return;

			onValueChange(next);
		},
		[value, onValueChange],
	);

	const handleFocus = useCallback(() => setFocused(true), []);

	const handleBlur = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			setFocused(false);
			props.onBlur?.(e);
		},
		[props.onBlur],
	);

	return (
		<input
			ref={inputRef}
			type="text"
			inputMode="numeric"
			data-slot="input"
			value={display}
			onKeyDown={handleKeyDown}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onChange={() => {}} // controlled — changes happen via onKeyDown
			className={cn(
				"placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base tabular-nums shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
				focused && value === 0 && "text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

/** Convert a float (e.g., 21.23) to cents (2123) */
function toCents(float: number): number {
	return Math.round(float * 100);
}

/** Convert cents (2123) to a float (21.23) */
function fromCents(cents: number): number {
	return cents / 100;
}

export { CurrencyInput, formatCents, toCents, fromCents };
