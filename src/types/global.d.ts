// Tipos globais para a aplicação
export type SuccessResponse<T = unknown> = T;

export type ErrorResponse = {
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
};

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
