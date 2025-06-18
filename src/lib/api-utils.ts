import { NextResponse } from "next/server";
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";
// Standard error types
export enum ErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

// Standard error response structure
export interface ApiError<TDetails = unknown> {
  error: {
    type: ErrorType;
    message: string;
    details?: TDetails;
  };
}

// HTTP status codes mapped to error types
const errorStatusCodes: Record<ErrorType, number> = {
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.BAD_REQUEST]: 400,
  [ErrorType.INTERNAL_ERROR]: 500,
  [ErrorType.VALIDATION_ERROR]: 422,
  [ErrorType.RATE_LIMITED]: 429,
  [ErrorType.SERVICE_UNAVAILABLE]: 503,
};

// Create a standardized error response
export function createErrorResponse<TDetails = unknown>(
  type: ErrorType,
  message: string,
  details?: TDetails
): NextResponse<ApiError<TDetails>> {
  console.error(`API Error [${type}]: ${message}`, details ? { details } : "");

  return NextResponse.json(
    {
      error: {
        type,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status: errorStatusCodes[type] }
  );
}

// Create a standardized success response
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

// Log API request for monitoring
export function logApiRequest(
  method: HttpMethod,
  path: string,
  userId?: string | null
) {
  console.log(
    `API Request: ${method} ${path}${userId ? ` | User: ${userId}` : ""}`
  );
}
