import { Calendar, RotateCcw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	CurrencyInput,
	fromCents,
	toCents,
} from "#/components/ui/currency-input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { getNomeMes } from "#/lib/finance";
import { cn } from "#/lib/utils";
import type {
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";

const CATEGORY_OPTIONS: Array<{
	key: TransactionCategory;
	label: string;
	glyph: string;
}> = [
	{ key: "entradas", label: "Entrada", glyph: "↙" },
	{ key: "saidas", label: "Saída", glyph: "↗" },
	{ key: "diario", label: "Diário", glyph: "D" },
	{ key: "economias", label: "Economia", glyph: "E" },
];

const RECURRENCE_OPTIONS: Array<{
	key: TransactionRecurrence;
	label: string;
	hasIcon: boolean;
}> = [
	{ key: "none", label: "Não repete", hasIcon: false },
	{ key: "weekly", label: "Semanal", hasIcon: true },
	{ key: "monthly", label: "Mensal", hasIcon: true },
	{ key: "yearly", label: "Anual", hasIcon: true },
];

const TAG_PRESETS = ["Assinatura", "Fixo", "Bônus", "Reembolso"] as const;

const CATEGORY_BG_VAR: Record<TransactionCategory, string> = {
	entradas: "var(--finance-category-entradas-bg)",
	saidas: "var(--finance-category-saidas-bg)",
	diario: "var(--finance-category-diario-bg)",
	economias: "var(--finance-category-economias-bg)",
};

const CATEGORY_FG_VAR: Record<TransactionCategory, string> = {
	entradas: "var(--finance-category-entradas-fg)",
	saidas: "var(--finance-category-saidas-fg)",
	diario: "var(--finance-category-diario-fg)",
	economias: "var(--finance-category-economias-fg)",
};

function pad(n: number) {
	return String(n).padStart(2, "0");
}

function toIsoDate(y: number, m: number, d: number) {
	return `${y}-${pad(m)}-${pad(d)}`;
}

function fromIsoDate(iso: string) {
	const [y, m, d] = iso.split("-").map(Number);
	return { year: y ?? 0, month: m ?? 0, day: d ?? 0 };
}

function formatDisplayDate(iso: string): string {
	const { year, month, day } = fromIsoDate(iso);
	return `${pad(day)}/${pad(month)}/${year}`;
}

function datePreset(daysAgo: number) {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function isSameDate(
	a: { year: number; month: number; day: number },
	b: { year: number; month: number; day: number },
) {
	return a.year === b.year && a.month === b.month && a.day === b.day;
}

export interface TransactionEditorSaveData {
	category: TransactionCategory;
	value: number;
	description: string;
	date: { year: number; month: number; day: number };
	recurrence: TransactionRecurrence;
	recurrenceEndDate?: string;
	tag: string;
}

export interface TransactionEditorEditData {
	category: TransactionCategory;
	value: number;
	description: string;
	date: { year: number; month: number; day: number };
	recurrence: TransactionRecurrence;
	recurrenceEndDate?: string;
	tag?: string;
}

interface TransactionEditorProps {
	open: boolean;
	defaultCategory: TransactionCategory;
	defaultDate: { year: number; month: number; day: number };
	onClose: () => void;
	onSave: (data: TransactionEditorSaveData) => void;
	editData?: TransactionEditorEditData;
	onDelete?: () => void;
}

const SECTION_LABEL =
	"text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase";

export function TransactionEditor({
	open,
	defaultCategory,
	defaultDate,
	onClose,
	onSave,
	editData,
	onDelete,
}: TransactionEditorProps) {
	const formId = useId();
	const dateInputRef = useRef<HTMLInputElement>(null);
	const endDateInputRef = useRef<HTMLInputElement>(null);
	const isEditing = Boolean(editData);

	const [category, setCategory] =
		useState<TransactionCategory>(defaultCategory);
	const [valueCents, setValueCents] = useState(0);
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(defaultDate);
	const [tag, setTag] = useState("");
	const [recurrence, setRecurrence] = useState<TransactionRecurrence>("none");
	const [recurrenceEndDate, setRecurrenceEndDate] = useState<
		string | undefined
	>(undefined);

	useEffect(() => {
		if (!open) return;
		if (editData) {
			setCategory(editData.category);
			setValueCents(toCents(editData.value));
			setDescription(editData.description);
			setDate(editData.date);
			setTag(editData.tag ?? "");
			setRecurrence(editData.recurrence);
			setRecurrenceEndDate(editData.recurrenceEndDate);
		} else {
			setCategory(defaultCategory);
			setValueCents(0);
			setDescription("");
			setDate(defaultDate);
			setTag("");
			setRecurrence("none");
			setRecurrenceEndDate(undefined);
		}
	}, [open, editData, defaultCategory, defaultDate]);

	const reset = useCallback(() => {
		setCategory(defaultCategory);
		setValueCents(0);
		setDescription("");
		setDate(defaultDate);
		setTag("");
		setRecurrence("none");
		setRecurrenceEndDate(undefined);
	}, [defaultCategory, defaultDate]);

	const handleClose = useCallback(() => {
		reset();
		onClose();
	}, [reset, onClose]);

	const handleRecurrenceChange = useCallback((next: TransactionRecurrence) => {
		setRecurrence(next);
		if (next === "none") setRecurrenceEndDate(undefined);
	}, []);

	const canSubmit = valueCents > 0 && description.trim().length > 0;

	const handleSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (!canSubmit) return;
			onSave({
				category,
				value: fromCents(valueCents),
				description: description.trim(),
				date,
				recurrence,
				recurrenceEndDate:
					recurrence === "none" ? undefined : recurrenceEndDate,
				tag: tag.trim(),
			});
			reset();
		},
		[
			canSubmit,
			category,
			valueCents,
			description,
			date,
			recurrence,
			recurrenceEndDate,
			tag,
			onSave,
			reset,
		],
	);

	const catBg = CATEGORY_BG_VAR[category];
	const catFg = CATEGORY_FG_VAR[category];
	const subtitle = `${getNomeMes(date.month)} · dia ${pad(date.day)}, ${date.year}`;

	const TODAY = datePreset(0);
	const YESTERDAY = datePreset(1);
	const DAYBEFOREYESTERDAY = datePreset(2);

	const startDateIso = toIsoDate(date.year, date.month, date.day);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent
				showCloseButton={false}
				className="gap-0 overflow-hidden p-0 sm:max-w-[580px]"
			>
				{/* ── Header ── */}
				<div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5">
					<div>
						<DialogTitle className="text-xl font-bold leading-tight">
							{isEditing ? "Editar lançamento" : "Novo lançamento"}
						</DialogTitle>
						<p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="mt-0.5 shrink-0"
						onClick={handleClose}
						aria-label="Fechar editor"
					>
						<X />
					</Button>
				</div>

				<DialogDescription className="sr-only">
					{isEditing ? "Editar" : "Criar"} um lançamento financeiro
				</DialogDescription>

				{/* ── Form ── */}
				<form
					id={formId}
					onSubmit={handleSubmit}
					className="max-h-[calc(100svh-10rem)] space-y-6 overflow-y-auto px-6 pb-2"
				>
					{/* TIPO */}
					<div className="space-y-3">
						<p className={SECTION_LABEL}>Tipo</p>
						<div className="grid grid-cols-4 gap-2">
							{CATEGORY_OPTIONS.map((opt) => {
								const active = category === opt.key;
								return (
									<button
										key={opt.key}
										type="button"
										onClick={() => setCategory(opt.key)}
										className={cn(
											"flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											active
												? "border-transparent shadow-sm"
												: "border-border bg-background text-foreground/70 hover:bg-muted/40",
										)}
										style={
											active
												? {
														backgroundColor: CATEGORY_BG_VAR[opt.key],
														color: CATEGORY_FG_VAR[opt.key],
													}
												: undefined
										}
									>
										<span
											className={cn(
												"inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none",
												active
													? "bg-white/25"
													: "bg-muted text-muted-foreground",
											)}
										>
											{opt.glyph}
										</span>
										<span className="truncate">{opt.label}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* VALOR */}
					<div className="space-y-2">
						<p className={SECTION_LABEL}>Valor</p>
						<CurrencyInput
							value={valueCents}
							onValueChange={setValueCents}
							autoFocus
							className="h-auto rounded-none border-0 border-b-2 bg-transparent pb-3 pt-1 text-left text-5xl font-bold tabular-nums shadow-none focus-visible:ring-0"
							style={{
								color: catBg,
								borderColor: `color-mix(in srgb, ${catBg} 35%, transparent)`,
							}}
						/>
					</div>

					{/* DESCRIÇÃO */}
					<div className="space-y-2">
						<p className={SECTION_LABEL}>Descrição</p>
						<Input
							type="text"
							placeholder="Onde foi parar essa grana?"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={200}
							className="rounded-xl"
						/>
					</div>

					{/* DATA + ETIQUETA — 2 colunas */}
					<div className="grid grid-cols-2 gap-5">
						{/* DATA */}
						<div className="space-y-2">
							<p className={SECTION_LABEL}>Data</p>
							<button
								type="button"
								onClick={() => dateInputRef.current?.showPicker?.()}
								className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm tabular-nums transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<Calendar className="size-3.5 shrink-0 text-muted-foreground" />
								{pad(date.day)}/{pad(date.month)}/{date.year}
							</button>
							<input
								ref={dateInputRef}
								type="date"
								className="sr-only"
								value={startDateIso}
								onChange={(e) => {
									if (e.target.value) setDate(fromIsoDate(e.target.value));
								}}
							/>
							<div className="flex gap-1.5">
								{[
									{ label: "Hoje", preset: TODAY },
									{ label: "Ontem", preset: YESTERDAY },
									{ label: "Anteontem", preset: DAYBEFOREYESTERDAY },
								].map(({ label, preset }) => {
									const active = isSameDate(date, preset);
									return (
										<button
											key={label}
											type="button"
											onClick={() => setDate(preset)}
											className={cn(
												"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
												active
													? "border-transparent font-semibold"
													: "border-border bg-background text-muted-foreground hover:text-foreground",
											)}
											style={
												active
													? {
															backgroundColor: `color-mix(in srgb, ${catBg} 15%, transparent)`,
															color: catBg,
															borderColor: `color-mix(in srgb, ${catBg} 35%, transparent)`,
														}
													: undefined
											}
										>
											{label}
										</button>
									);
								})}
							</div>
						</div>

						{/* ETIQUETA */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className={SECTION_LABEL}>Etiqueta</p>
								<span className="text-[10px] text-muted-foreground">
									opcional
								</span>
							</div>
							<Input
								type="text"
								placeholder="Ex.: Assinatura"
								value={tag}
								onChange={(e) => setTag(e.target.value)}
								maxLength={50}
								className="rounded-xl"
							/>
							<div className="flex flex-wrap gap-1.5">
								{TAG_PRESETS.map((preset) => {
									const active = tag === preset;
									return (
										<button
											key={preset}
											type="button"
											onClick={() => setTag(active ? "" : preset)}
											className={cn(
												"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
												active
													? "border-transparent font-semibold"
													: "border-border bg-background text-muted-foreground hover:text-foreground",
											)}
											style={
												active
													? {
															backgroundColor: `color-mix(in srgb, ${catBg} 15%, transparent)`,
															color: catBg,
															borderColor: `color-mix(in srgb, ${catBg} 35%, transparent)`,
														}
													: undefined
											}
										>
											{preset}
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* RECORRÊNCIA */}
					<div className="space-y-2">
						<p className={SECTION_LABEL}>Recorrência</p>
						<div className="flex flex-wrap gap-2">
							{RECURRENCE_OPTIONS.map((opt) => {
								const active = recurrence === opt.key;
								return (
									<button
										key={opt.key}
										type="button"
										onClick={() => handleRecurrenceChange(opt.key)}
										className={cn(
											"flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											active
												? "border-transparent font-semibold shadow-sm"
												: "border-border bg-background text-muted-foreground hover:text-foreground",
										)}
										style={
											active
												? {
														backgroundColor: `color-mix(in srgb, ${catBg} 15%, transparent)`,
														color: catBg,
														borderColor: `color-mix(in srgb, ${catBg} 35%, transparent)`,
													}
												: undefined
										}
									>
										{opt.hasIcon && (
											<RotateCcw
												className="size-3 shrink-0"
												style={active ? { color: catBg } : undefined}
											/>
										)}
										{opt.label}
									</button>
								);
							})}
						</div>
					</div>

					{/* TERMINA EM — aparece quando há recorrência */}
					{recurrence !== "none" && (
						<div
							className="space-y-2 rounded-r-lg border-l-2 py-1 pl-4"
							style={{
								borderColor: `color-mix(in srgb, ${catBg} 45%, transparent)`,
							}}
						>
							<div className="flex items-center justify-between">
								<p className={SECTION_LABEL}>Termina em</p>
								<span className="text-[10px] text-muted-foreground">
									opcional
								</span>
							</div>

							<div className="flex items-center justify-between gap-2">
								<button
									type="button"
									onClick={() => endDateInputRef.current?.showPicker?.()}
									className="flex flex-1 items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm tabular-nums transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<Calendar className="size-3.5 shrink-0 text-muted-foreground" />
									{recurrenceEndDate ? (
										<span>{formatDisplayDate(recurrenceEndDate)}</span>
									) : (
										<span className="text-muted-foreground">
											Sem data — repete pra sempre
										</span>
									)}
								</button>
								{recurrenceEndDate && (
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() => setRecurrenceEndDate(undefined)}
										aria-label="Remover data de término"
									>
										<X />
									</Button>
								)}
							</div>

							{recurrenceEndDate && (
								<p className="text-xs text-muted-foreground">
									Última ocorrência nesta data. Ideal pra parcelas ou
									empréstimos.
								</p>
							)}

							<input
								ref={endDateInputRef}
								type="date"
								className="sr-only"
								min={startDateIso}
								value={recurrenceEndDate ?? ""}
								onChange={(e) =>
									setRecurrenceEndDate(e.target.value || undefined)
								}
							/>
						</div>
					)}

					{/* Espaço final para não colar no scroll */}
					<div className="pb-1" />
				</form>

				{/* ── Footer ── */}
				<div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
					{isEditing && onDelete && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="mr-auto gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={onDelete}
						>
							<Trash2 className="size-3.5" />
							Excluir
						</Button>
					)}
					<Button type="button" variant="ghost" onClick={handleClose}>
						Cancelar
					</Button>
					<Button
						type="submit"
						form={formId}
						disabled={!canSubmit}
						className="min-w-[90px]"
						style={
							canSubmit ? { backgroundColor: catBg, color: catFg } : undefined
						}
					>
						{isEditing ? "Salvar" : "Lançar"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
