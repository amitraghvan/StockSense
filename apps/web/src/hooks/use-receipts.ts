import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { ReceiptSummary, ReceiptStatusType } from '@stocksense/types';
import { CreateReceiptInput, UpdateReceiptInput } from '@stocksense/validation';
import { PaginatedResult } from './use-inventory';

export interface ReceiptFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReceiptStatusType;
  warehouseId?: string;
  scheduleDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useReceipts(filters: ReceiptFilters = {}) {
  return useQuery({
    queryKey: ['receipts', filters],
    queryFn: () => {
      const params: Record<string, string | number | undefined> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 25,
        search: filters.search || undefined,
        status: filters.status || undefined,
        warehouseId: filters.warehouseId || undefined,
        scheduleDate: filters.scheduleDate || undefined,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
      };
      return apiClient.get<PaginatedResult<ReceiptSummary>>('receipts', { params });
    },
  });
}

export function useReceipt(id: string | null | undefined) {
  return useQuery({
    queryKey: ['receipt', id],
    queryFn: () => {
      if (!id) throw new Error('Receipt ID is required');
      return apiClient.get<ReceiptSummary>(`receipts/${id}`);
    },
    enabled: Boolean(id),
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReceiptInput) => apiClient.post<ReceiptSummary>('receipts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}

export function useUpdateReceipt(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateReceiptInput) =>
      apiClient.patch<ReceiptSummary>(`receipts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
    },
  });
}

export function useValidateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<ReceiptSummary>(`receipts/${id}/validate`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
    },
  });
}

export function useCompleteReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<ReceiptSummary>(`receipts/${id}/complete`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCancelReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<ReceiptSummary>(`receipts/${id}/cancel`, { reason }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
    },
  });
}
