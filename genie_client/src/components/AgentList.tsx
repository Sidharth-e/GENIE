"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Edit2, Bot, Search } from "lucide-react";
import { Agent } from "@/types/agent";
import { AgentForm } from "./AgentForm";
import {
  useAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from "@/hooks/useAgents";

interface AgentListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (agent: Agent) => void;
}

export const AgentList = ({ isOpen, onClose, onSelect }: AgentListProps) => {
  const { data: agents = [], isLoading } = useAgents();
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter agents based on search
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Reset editing state when modal closes
  const handleClose = () => {
    setIsEditing(false);
    setSelectedAgent(undefined);
    setError(null);
    setSearchQuery("");
    onClose();
  };

  const handleCreate = () => {
    setSelectedAgent(undefined);
    setIsEditing(true);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await deleteAgentMutation.mutateAsync(id);
      setError(null);
    } catch (err) {
      console.error("Failed to delete agent", err);
      setError("Failed to delete agent");
    }
  };

  const handleSubmit = async (data: Partial<Agent>) => {
    try {
      if (selectedAgent) {
        await updateAgentMutation.mutateAsync({
          id: selectedAgent.id,
          data,
        });
      } else {
        await createAgentMutation.mutateAsync(data);
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Failed to save agent", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to save agent: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  const isMutating =
    createAgentMutation.isPending ||
    updateAgentMutation.isPending ||
    deleteAgentMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl dark:bg-gray-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing
              ? selectedAgent
                ? "Edit Agent"
                : "Create Agent"
              : "Custom Agents"}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {isEditing ? (
            <AgentForm
              initialData={selectedAgent}
              onSubmit={handleSubmit}
              onCancel={() => setIsEditing(false)}
              isLoading={isMutating}
            />
          ) : (
            <div className="space-y-4">
              {/* Search and Create */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Agent</span>
                </button>
              </div>

              {/* Agents Grid */}
              <div className="grid gap-3 sm:grid-cols-2 min-h-[400px] content-start">
                {isLoading ? (
                  <div className="col-span-full py-8 text-center text-gray-500">
                    Loading agents...
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-gray-500">
                    {searchQuery
                      ? "No agents match your search."
                      : "No agents found. Create your first agent!"}
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="group relative flex flex-col rounded-xl border bg-gradient-to-br from-white to-gray-50 p-4 transition-all hover:shadow-lg hover:border-blue-200 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800 dark:hover:border-blue-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 text-white shadow-md">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {agent.description || "No description"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {agent.provider}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {agent.modelName}
                        </span>
                        {agent.tools && agent.tools.length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {agent.tools.length} tools
                          </span>
                        )}
                        {agent.subAgentIds && agent.subAgentIds.length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Supervisor
                          </span>
                        )}
                      </div>

                      {/* Action buttons - visible on hover */}
                      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {onSelect && (
                          <button
                            onClick={() => onSelect(agent)}
                            className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Select
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(agent)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          disabled={deleteAgentMutation.isPending}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
