export interface ErrorResponse {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
}
