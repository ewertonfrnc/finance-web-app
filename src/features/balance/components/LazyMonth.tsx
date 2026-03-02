import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { getNomeMes } from "#/lib/finance";

interface LazyMonthProps {
	month: number;
	year: number;
	children: React.ReactNode;
}

/**
 * Wraps a MonthTable and only renders the full content once the
 * placeholder scrolls into (or near) the viewport. Uses a generous
 * rootMargin so the table is ready before the user scrolls to it.
 */
const LazyMonth = React.memo(function LazyMonth({
	month,
	year,
	children,
}: LazyMonthProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	if (!visible) {
		return (
			<div
				ref={ref}
				className="min-w-90 shrink-0 overflow-hidden rounded-lg border border-border"
			>
				<div className="border-b border-border bg-muted/60 px-3 py-2 text-sm font-bold">
					{getNomeMes(month)}/{year}
				</div>
				<div className="h-[calc(31*1.75rem+3rem)] w-full" />
			</div>
		);
	}

	return <>{children}</>;
});

export { LazyMonth };
