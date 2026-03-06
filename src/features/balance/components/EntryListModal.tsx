import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { formatBRL } from "#/lib/finance";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../lib/categoryMeta";
import type { Transaction, TransactionCategory } from "../types/transaction";

interface EntryListModalProps {
	open: boolean;
	category: TransactionCategory;
	day: number;
	month: number;
	year: number;
	transactions: Transaction[];
	onClose: () => void;
	onDelete: (tx: Transaction) => void;
	onEdit: (tx: Transaction) => void;
}

export function EntryListModal({
	open,
	category,
	day,
	month,
	year,
	transactions,
	onClose,
	onDelete,
	onEdit,
}: EntryListModalProps) {
	const label = CATEGORY_LABELS[category];
	const colorClass = CATEGORY_COLORS[category];
	const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(
		null,
	);

	return (
		<>
			<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between">
							<span className="flex items-center gap-2 text-lg">
								<span
									className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
								>
									{label.charAt(0).toUpperCase()}
								</span>
								{label}s — {day}/{month}/{year}
							</span>
						</DialogTitle>
						<DialogDescription className="sr-only">
							Lançamentos de {label.toLowerCase()} do dia {day}/{month}/{year}
						</DialogDescription>
					</DialogHeader>

					{transactions.length === 0 ? (
						<p className="py-6 text-center text-sm text-muted-foreground">
							Nenhum lançamento registrado.
						</p>
					) : (
						<ul className="divide-y divide-border">
							{transactions.map((tx) => (
								<li
									key={tx.id}
									className="flex items-center justify-between py-3"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{tx.description || "Sem descrição"}
										</p>
										<p className="text-xs text-muted-foreground">
											{tx.day}/{tx.month < 10 ? `0${tx.month}` : tx.month}
										</p>
									</div>
									<div className="flex items-center gap-1">
										<span className="mr-1 text-sm font-semibold tabular-nums">
											{formatBRL(tx.value)}
										</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-muted-foreground hover:text-foreground"
											onClick={() => onEdit(tx)}
											aria-label={`Editar ${tx.description}`}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
											onClick={() => setPendingDeleteTx(tx)}
											aria-label={`Excluir ${tx.description}`}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={pendingDeleteTx !== null}
				onOpenChange={(isOpen) => !isOpen && setPendingDeleteTx(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
						<AlertDialogDescription>
							Deseja excluir "{pendingDeleteTx?.description || "Sem descrição"}"
							de {formatBRL(pendingDeleteTx?.value ?? 0)}? Esta ação não pode
							ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 text-white hover:bg-red-700"
							onClick={() => {
								if (pendingDeleteTx) {
									onDelete(pendingDeleteTx);
								}
								setPendingDeleteTx(null);
							}}
						>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
