import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
} from "@/services/agentClient";
import { Agent } from "@/types/agent";

const AGENTS_QUERY_KEY = ["custom-agents"];

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: fetchAgents,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agent: Partial<Agent>) => createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });
    },
  });
}
