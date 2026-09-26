import { ApiResponse, ApiErrorResponse } from '@stocksense/types';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly requestId: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const url = new URL(cleanEndpoint, cleanBase);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private generateRequestId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;
    const url = this.buildUrl(endpoint, params);
    const requestId = this.generateRequestId();

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Request-Id': requestId,
      ...headers,
    };

    // Note: Future auth token injection hook goes here in Phase 02
    // const token = getAuthToken();
    // if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

    const config: RequestInit = {
      ...customConfig,
      headers: requestHeaders,
    };

    try {
      const response = await fetch(url, config);
      const resRequestId = response.headers.get('x-request-id') || requestId;

      if (!response.ok) {
        let errorData: ApiErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch {
          // If response body is not JSON
        }

        const errorCode = errorData?.error?.code || `HTTP_${response.status}`;
        const errorMessage =
          errorData?.error?.message || response.statusText || 'An unexpected error occurred';
        const details = errorData?.error?.details;

        throw new ApiClientError(errorCode, errorMessage, response.status, resRequestId, details);
      }

      const data = await response.json();

      // If data is formatted with ApiResponse envelope, return data payload, otherwise return as-is
      if (
        data &&
        typeof data === 'object' &&
        'success' in data &&
        data.success === true &&
        'data' in data
      ) {
        return (data as ApiResponse<T>).data;
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unable to connect to StockSense API',
        0,
        requestId,
      );
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
