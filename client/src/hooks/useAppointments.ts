import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/appointments';
import type { AppointmentFilters, AppointmentStatus, CreateAppointmentPayload } from '../types';

export const useAppointments = (filters: AppointmentFilters, limit = api.PAGE_SIZE) =>
  useQuery({
    queryKey: ['appointments', filters, limit],
    queryFn: () => api.fetchAppointments(filters, limit),
    placeholderData: keepPreviousData,
  });

export const useStats = () => useQuery({ queryKey: ['stats'], queryFn: api.fetchStats });

export const useServices = () =>
  useQuery({ queryKey: ['services'], queryFn: api.fetchServices, staleTime: Infinity });

function useInvalidateAppointmentData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
    ]);
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAppointmentData();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => api.createAppointment(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStatus() {
  const invalidate = useInvalidateAppointmentData();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => api.updateAppointmentStatus(id, status),
    onSuccess: invalidate,
  });
}
