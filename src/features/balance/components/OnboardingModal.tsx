import { useId, useState } from "react";
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
import { Label } from "#/components/ui/label";
import { formatBRL } from "#/lib/finance";

interface OnboardingModalProps {
	open: boolean;
	onComplete: (gastos: {
		transporte: number;
		mercado: number;
		farmacia: number;
		lazer: number;
	}) => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
	const id = useId();
	const [transporte, setTransporte] = useState(0);
	const [mercado, setMercado] = useState(0);
	const [farmacia, setFarmacia] = useState(0);
	const [lazer, setLazer] = useState(0);

	const total =
		fromCents(transporte) +
		fromCents(mercado) +
		fromCents(farmacia) +
		fromCents(lazer);

	const diarioValue = total / 30;
	const canSubmit = total > 0;

	const handleSubmit = () => {
		if (!canSubmit) return;

		onComplete({
			transporte: fromCents(transporte),
			mercado: fromCents(mercado),
			farmacia: fromCents(farmacia),
			lazer: fromCents(lazer),
		});
	};

	return (
		<Dialog open={open}>
			<DialogContent
				className="sm:max-w-md"
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Configuração inicial</DialogTitle>
					<DialogDescription>
						Informe seus gastos mensais médios para calcular o valor diário
						projetado. Esse valor será usado para projetar o saldo nos dias
						futuros.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor={`${id}-transporte`}>Transporte (mensal)</Label>
						<CurrencyInput
							id={`${id}-transporte`}
							value={transporte}
							onValueChange={setTransporte}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor={`${id}-mercado`}>Mercado (mensal)</Label>
						<CurrencyInput
							id={`${id}-mercado`}
							value={mercado}
							onValueChange={setMercado}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor={`${id}-farmacia`}>Farmácia (mensal)</Label>
						<CurrencyInput
							id={`${id}-farmacia`}
							value={farmacia}
							onValueChange={setFarmacia}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor={`${id}-lazer`}>Lazer (mensal)</Label>
						<CurrencyInput
							id={`${id}-lazer`}
							value={lazer}
							onValueChange={setLazer}
						/>
					</div>

					<div className="bg-muted rounded-md p-3 text-sm">
						<p>
							Total mensal:{" "}
							<span className="font-semibold">{formatBRL(total)}</span>
						</p>
						<p>
							Valor diário:{" "}
							<span className="font-semibold">{formatBRL(diarioValue)}</span>
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button onClick={handleSubmit} disabled={!canSubmit}>
						Confirmar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
