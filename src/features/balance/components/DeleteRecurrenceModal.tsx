import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { formatBRL } from "#/lib/finance";
import type { Transaction } from "../types/transaction";

interface DeleteRecurrenceModalProps {
	open: boolean;
	tx: Transaction | null;
	onClose: () => void;
	onDeleteSingle: () => void;
	onDeleteThisAndNext: () => void;
}

const RECURRENCE_LABELS = {
	daily: "diaria",
	weekly: "semanal",
	monthly: "mensal",
	none: "sem repeticao",
} as const;

export function DeleteRecurrenceModal({
	open,
	tx,
	onClose,
	onDeleteSingle,
	onDeleteThisAndNext,
}: DeleteRecurrenceModalProps) {
	const recurrenceLabel = tx?.recurrence
		? RECURRENCE_LABELS[tx.recurrence]
		: "recorrente";

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Excluir lancamento recorrente</DialogTitle>
					<DialogDescription>
						Escolha como deseja remover este lancamento com repeticao.
					</DialogDescription>
				</DialogHeader>

				{tx ? (
					<div className="rounded-md border bg-muted/30 p-3 text-sm">
						<p className="font-medium">{tx.description || "Sem descricao"}</p>
						<p className="text-muted-foreground">
							{tx.day}/{tx.month < 10 ? `0${tx.month}` : tx.month}/{tx.year}
							{" - "}
							{formatBRL(tx.value)}
						</p>
						<p className="text-muted-foreground">
							Repeticao: {recurrenceLabel}
						</p>
					</div>
				) : null}

				<DialogFooter className="sm:justify-between">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancelar
					</Button>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button type="button" variant="outline" onClick={onDeleteSingle}>
							Apenas este
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={onDeleteThisAndNext}
						>
							Este e proximos
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
