import { type ApiResponse, apiClient, unwrapApiData } from "#/lib/api";

export interface LoginPayload {
	email: string;
	password: string;
}

interface LoginResponse {
	token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
	const response = await apiClient.post<ApiResponse<LoginResponse>>(
		"/v1/auth/login",
		payload,
	);
	return unwrapApiData(response.data);
}
