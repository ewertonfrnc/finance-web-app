import { useCallback, useEffect, useId, useState } from "react";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { getDiasNoMes } from "#/lib/finance";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../lib/categoryMeta";
import type {
	TransactionCategory,
	TransactionRecurrence,
} from "../types/transaction";

interface AddEntryModalProps {
	open: boolean;
	category: TransactionCategory;
	defaultDay: number;
	month: number;
	year: number;
	onClose: () => void;
	onSave: (data: {
		value: number;
		description: string;
		day: number;
		recurrence: TransactionRecurrence;
	}) => void;
	/** When set, the modal opens in edit mode with pre-filled values */
	editData?: {
		value: number;
		description: string;
		recurrence: TransactionRecurrence;
	};
}

export function AddEntryModal({
	open,
	category,
	defaultDay,
	month,
	year,
	onClose,
	onSave,
	editData,
}: AddEntryModalProps) {
	const formId = useId();
	const [valueCents, setValueCents] = useState(0);
	const [description, setDescription] = useState("");
	const [day, setDay] = useState(String(defaultDay));
	const [recurrence, setRecurrence] = useState<TransactionRecurrence>("none");

	const daysInMonth = getDiasNoMes(year, month);
	const isEditing = Boolean(editData);

	useEffect(() => {
		if (open && editData) {
			setValueCents(toCents(editData.value));
			setDescription(editData.description);
			setDay(String(defaultDay));
			setRecurrence(editData.recurrence);
		} else if (open) {
			setValueCents(0);
			setDescription("");
			setDay(String(defaultDay));
			setRecurrence("none");
		}
	}, [open, editData, defaultDay]);

	const resetAndClose = useCallback(() => {
		setValueCents(0);
		setDescription("");
		setDay(String(defaultDay));
		setRecurrence("none");
		onClose();
	}, [onClose, defaultDay]);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const parsed = fromCents(valueCents);
			if (parsed <= 0) return;

			onSave({
				value: parsed,
				description: description.trim(),
				day: Number.parseInt(day, 10),
				recurrence,
			});

			setValueCents(0);
			setDescription("");
			setRecurrence("none");
		},
		[valueCents, description, day, recurrence, onSave],
	);

	const handleDayChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value.replace(/\D/g, "");
			if (raw === "") {
				setDay("");
				return;
			}
			const num = Number.parseInt(raw, 10);
			if (num >= 1 && num <= daysInMonth) {
				setDay(String(num));
			}
		},
		[daysInMonth],
	);

	const label = CATEGORY_LABELS[category];
	const colorClass = CATEGORY_COLORS[category];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg">
						<span
							className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
						>
							{label.charAt(0).toUpperCase()}
						</span>
						{label}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{isEditing ? "Editar" : "Adicionar novo"} lançamento de{" "}
						{label.toLowerCase()}
					</DialogDescription>
				</DialogHeader>

				<form id={formId} onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`${formId}-value`}>Valor (R$)</Label>
						<CurrencyInput
							id={`${formId}-value`}
							value={valueCents}
							onValueChange={setValueCents}
							autoFocus
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-desc`}>Descrição</Label>
						<Input
							id={`${formId}-desc`}
							type="text"
							placeholder="Descrição"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-date`}>Data</Label>
						<div className="flex items-baseline gap-1">
							<Input
								id={`${formId}-date`}
								type="text"
								inputMode="numeric"
								value={day}
								onChange={handleDayChange}
								className="h-8 w-10 px-1 text-center text-sm"
								aria-label="Dia"
							/>
							<span className="text-sm text-muted-foreground">
								/ {month} / {year}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-recurrence`}>Repetição</Label>
						<Select
							value={recurrence}
							onValueChange={(value) =>
								setRecurrence(value as TransactionRecurrence)
							}
						>
							<SelectTrigger id={`${formId}-recurrence`} className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="monthly">Todo mês</SelectItem>
								<SelectItem value="weekly">Toda semana</SelectItem>
								<SelectItem value="daily">Todo dia</SelectItem>
								<SelectItem value="none">Não repetir</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</form>

				<DialogFooter>
					<Button type="button" variant="ghost" onClick={resetAndClose}>
						Cancelar
					</Button>
					<Button type="submit" form={formId}>
						{isEditing ? "Atualizar" : "Salvar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
