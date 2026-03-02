import { useCallback, useId, useState } from "react";
import { Button } from "#/components/ui/button";
import { CurrencyInput, fromCents } from "#/components/ui/currency-input";
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
}

export function AddEntryModal({
	open,
	category,
	defaultDay,
	month,
	year,
	onClose,
	onSave,
}: AddEntryModalProps) {
	const formId = useId();
	const [valueCents, setValueCents] = useState(0);
	const [description, setDescription] = useState("");
	const [day, setDay] = useState(String(defaultDay));
	const [recurrence, setRecurrence] = useState<TransactionRecurrence>("none");

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
						Adicionar novo lançamento de {label.toLowerCase()}
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
						<Input
							id={`${formId}-date`}
							type="text"
							readOnly
							value={`${day}/${month}/${year}`}
							className="bg-muted cursor-default"
						/>
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
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
