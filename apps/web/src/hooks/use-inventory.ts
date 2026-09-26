import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import {
  ProductSummary,
  CategorySummary,
  WarehouseSummary,
  LocationSummary,
} from '@stocksense/types';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateLocationInput,
  UpdateLocationInput,
} from '@stocksense/validation';

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==============================================================================
// Products Hooks
// ==============================================================================

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => {
      const params: Record<string, string | number | undefined> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
      };
      return apiClient.get<PaginatedResult<ProductSummary>>('products', { params });
    },
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => apiClient.get<ProductSummary>(`products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) => apiClient.post<ProductSummary>('products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      apiClient.patch<ProductSummary>(`products/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
}

// ==============================================================================
// Categories Hooks
// ==============================================================================

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: () => {
      const params: Record<string, string | number | undefined> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 100,
        search: filters.search || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy || 'name',
        sortOrder: filters.sortOrder || 'asc',
      };
      return apiClient.get<PaginatedResult<CategorySummary>>('categories', { params });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => apiClient.post<CategorySummary>('categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      apiClient.patch<CategorySummary>(`categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ==============================================================================
// Warehouses Hooks
// ==============================================================================

export interface WarehouseFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useWarehouses(filters: WarehouseFilters = {}) {
  return useQuery({
    queryKey: ['warehouses', filters],
    queryFn: () => {
      const params: Record<string, string | number | undefined> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
        search: filters.search || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'asc',
      };
      return apiClient.get<PaginatedResult<WarehouseSummary>>('warehouses', { params });
    },
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWarehouseInput) =>
      apiClient.post<WarehouseSummary>('warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseInput }) =>
      apiClient.patch<WarehouseSummary>(`warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

// ==============================================================================
// Locations Hooks
// ==============================================================================

export interface LocationFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  warehouseId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useLocations(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: ['locations', filters],
    queryFn: () => {
      const params: Record<string, string | number | undefined> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 100,
        search: filters.search || undefined,
        status: filters.status || undefined,
        warehouseId: filters.warehouseId || undefined,
        sortBy: filters.sortBy || 'shortCode',
        sortOrder: filters.sortOrder || 'asc',
      };
      return apiClient.get<PaginatedResult<LocationSummary>>('locations', { params });
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLocationInput) => apiClient.post<LocationSummary>('locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationInput }) =>
      apiClient.patch<LocationSummary>(`locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}
