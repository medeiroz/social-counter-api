// Tipos globais para a aplicação
export type SuccessResponse<T = unknown> = {
	success: true;
	data: T;
};

export type ErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
};

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
