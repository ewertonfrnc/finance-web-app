import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useId, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { login } from "#/features/auth/service/authService";
import { isAuthenticated, setAuthToken } from "#/lib/auth";

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		if (isAuthenticated()) {
			throw redirect({
				to: "/$year",
				params: { year: String(new Date().getFullYear()) },
			});
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const emailId = useId();
	const passwordId = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await login({ email, password });
			setAuthToken(result.token);
			await navigate({
				to: "/$year",
				params: { year: String(new Date().getFullYear()) },
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao entrar");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
			>
				<div className="mb-6 space-y-2">
					<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.24em]">
						Folga
					</p>
					<h1 className="font-bold text-2xl">Entrar</h1>
					<p className="text-muted-foreground text-sm">
						Login real via finance-api. Esta tela será refinada depois.
					</p>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={emailId}>Email</Label>
						<Input
							id={emailId}
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete="email"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={passwordId}>Senha</Label>
						<Input
							id={passwordId}
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="current-password"
							required
						/>
					</div>
				</div>

				{error ? (
					<p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
						{error}
					</p>
				) : null}

				<Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
					{isSubmitting ? "Entrando..." : "Entrar"}
				</Button>
			</form>
		</main>
	);
}
