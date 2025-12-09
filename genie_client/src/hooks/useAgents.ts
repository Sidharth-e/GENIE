import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agentClient";
import { Agent } from "@/types/agent";

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["custom-agents"],
    queryFn: fetchAgents,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
