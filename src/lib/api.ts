import { create, isAxiosError } from "axios";
import { getAuthToken } from "#/lib/auth";

export const API_BASE_URL =
	"https://finance-api-197306766144.southamerica-east1.run.app";

export interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export const apiClient = create({
	baseURL: API_BASE_URL,
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
});

apiClient.interceptors.request.use((config) => {
	const token = getAuthToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		if (isAxiosError(error)) {
			if (error.response) {
				const data = error.response.data as { error?: string } | undefined;
				return Promise.reject(
					new Error(data?.error ?? `Erro ${error.response.status}`),
				);
			}
			if (error.request) {
				return Promise.reject(new Error("Servidor indisponível"));
			}
		}
		return Promise.reject(error);
	},
);

export function unwrapApiData<T>(response: ApiResponse<T>): T {
	if (!response.success) {
		throw new Error("Resposta inválida da API");
	}
	return response.data;
}

export function centsToReais(value: number): number {
	return value / 100;
}

export function reaisToCents(value: number): number {
	return Math.round(value * 100);
}
