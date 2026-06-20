const AUTH_TOKEN_KEY = "finance_auth_token";

export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
	window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
	window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
	return Boolean(getAuthToken());
}
