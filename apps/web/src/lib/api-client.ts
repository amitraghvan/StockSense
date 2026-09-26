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
  skipAuth?: boolean;
}

class ApiClient {
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private activeTenantId: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    // Hydrate tokens from localStorage on client-side
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('stocksense_access_token');
      this.refreshToken = localStorage.getItem('stocksense_refresh_token');
      this.activeTenantId = localStorage.getItem('stocksense_tenant_id');
    }
  }

  setTokens(accessToken: string | null, refreshToken?: string | null) {
    this.accessToken = accessToken;
    if (typeof window !== 'undefined') {
      if (accessToken) {
        localStorage.setItem('stocksense_access_token', accessToken);
        document.cookie = `stocksense_access_token=${encodeURIComponent(accessToken)}; path=/; SameSite=Lax; max-age=604800`;
      } else {
        localStorage.removeItem('stocksense_access_token');
        document.cookie = 'stocksense_access_token=; path=/; max-age=0';
      }
    }

    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
      if (typeof window !== 'undefined') {
        if (refreshToken) {
          localStorage.setItem('stocksense_refresh_token', refreshToken);
        } else {
          localStorage.removeItem('stocksense_refresh_token');
        }
      }
    }
  }

  setActiveTenant(tenantId: string | null) {
    this.activeTenantId = tenantId;
    if (typeof window !== 'undefined') {
      if (tenantId) {
        localStorage.setItem('stocksense_tenant_id', tenantId);
      } else {
        localStorage.removeItem('stocksense_tenant_id');
      }
    }
  }

  getActiveTenant(): string | null {
    return this.activeTenantId;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.activeTenantId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stocksense_access_token');
      localStorage.removeItem('stocksense_refresh_token');
      localStorage.removeItem('stocksense_tenant_id');
      document.cookie = 'stocksense_access_token=; path=/; max-age=0';
    }
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

  private async refreshSession(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const res = await fetch(this.buildUrl('auth/refresh'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!res.ok) {
          this.clearAuth();
          if (this.onUnauthorizedCallback) this.onUnauthorizedCallback();
          return null;
        }

        const data = await res.json();
        const tokens = data?.data?.tokens || data?.tokens;
        if (tokens?.accessToken) {
          this.setTokens(tokens.accessToken, tokens.refreshToken);
          return tokens.accessToken;
        }
        return null;
      } catch {
        this.clearAuth();
        if (this.onUnauthorizedCallback) this.onUnauthorizedCallback();
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, skipAuth, ...customConfig } = options;
    const url = this.buildUrl(endpoint, params);
    const requestId = this.generateRequestId();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Request-Id': requestId,
      ...((headers as Record<string, string>) || {}),
    };

    if (!skipAuth) {
      if (this.accessToken) {
        requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
      }
      if (this.activeTenantId) {
        requestHeaders['X-Tenant-Id'] = this.activeTenantId;
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers: requestHeaders,
    };

    try {
      let response = await fetch(url, config);

      // Handle 401 Unauthorized by attempting a token refresh
      if (
        response.status === 401 &&
        !skipAuth &&
        this.refreshToken &&
        !endpoint.includes('auth/')
      ) {
        const newAccessToken = await this.refreshSession();
        if (newAccessToken) {
          requestHeaders['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, { ...config, headers: requestHeaders });
        }
      }

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

        if (response.status === 401 && this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }

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
