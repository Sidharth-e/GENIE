"use client";

import React, { useState } from "react";
import { Agent } from "@/types/agent";
import { Loader2, Server, Wrench, Users, Bot } from "lucide-react";
import { useMCPTools } from "@/hooks/useMCPTools";
import { useAgents } from "@/hooks/useAgents";
import { PROVIDER_CONFIG } from "@/constants/providers";
import { config } from "@/constants/config";

interface AgentFormProps {
  initialData?: Partial<Agent>;
  onSubmit: (data: Partial<Agent>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AgentForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AgentFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [systemPrompt, setSystemPrompt] = useState(
    initialData?.systemPrompt || "",
  );
  const [provider, setProvider] = useState(
    initialData?.provider || config.DEFAULT_MODEL_PROVIDER,
  );
  const [modelName, setModelName] = useState(
    initialData?.modelName || config.DEFAULT_MODEL_NAME,
  );
  const [selectedTools, setSelectedTools] = useState<string[]>(
    initialData?.tools || [],
  );
  const [selectedSubAgents, setSelectedSubAgents] = useState<string[]>(
    initialData?.subAgentIds || [],
  );
  const [recursionLimit, setRecursionLimit] = useState<number>(
    initialData?.recursionLimit || 25,
  );
  const { data: mcpToolsData } = useMCPTools();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();

  // Filter out self from available sub-agents
  const availableSubAgents = agents.filter(
    (agent) => agent.id !== initialData?.id,
  );

  const handleToolToggle = (fullToolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(fullToolName)
        ? prev.filter((t) => t !== fullToolName)
        : [...prev, fullToolName],
    );
  };

  const handleSubAgentToggle = (agentId: string) => {
    setSelectedSubAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description,
      systemPrompt,
      provider,
      modelName,
      tools: selectedTools,
      subAgentIds: selectedSubAgents,
      recursionLimit: selectedSubAgents.length > 0 ? recursionLimit : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => {
              const newProvider = e.target.value;
              setProvider(newProvider);
              // Reset model to first available for this provider
              if (
                PROVIDER_CONFIG[newProvider] &&
                PROVIDER_CONFIG[newProvider].models.length > 0
              ) {
                setModelName(PROVIDER_CONFIG[newProvider].models[0].id);
              }
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {PROVIDER_CONFIG[provider]?.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Allowed Tools
        </label>
        <div className="rounded-md border border-gray-300 p-4 dark:border-gray-600 dark:bg-gray-800">
          {!mcpToolsData ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : mcpToolsData.totalCount === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No tools available.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(mcpToolsData.serverGroups).map(
                ([serverName, group]) => (
                  <div key={serverName} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Server className="h-4 w-4 text-gray-500" />
                      <span className="capitalize">{serverName}</span>
                      <span className="text-xs text-gray-500">
                        ({group.count})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.tools.map((tool) => {
                        const fullToolName = `${serverName}__${tool.name}`;
                        return (
                          <label
                            key={fullToolName}
                            className="flex items-start gap-2 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTools.includes(fullToolName)}
                              onChange={() => handleToolToggle(fullToolName)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <div className="text-sm">
                              <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
                                <Wrench className="h-3 w-3" />
                                {tool.name}
                              </div>
                              {tool.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                                  {tool.description}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-Agents Selection (Multi-Agent Mode) */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sub-Agents (Multi-Agent Mode)
          </span>
        </label>

        {selectedSubAgents.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-purple-50 p-3 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
            <Bot className="h-4 w-4" />
            <span>
              <strong>Supervisor Mode:</strong> This agent will delegate tasks
              to {selectedSubAgents.length} sub-agent(s)
            </span>
          </div>
        )}

        {selectedSubAgents.length > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Max Iterations:
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={recursionLimit}
              onChange={(e) =>
                setRecursionLimit(Math.max(1, parseInt(e.target.value) || 25))
              }
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Controls max rounds between supervisor and sub-agents
            </span>
          </div>
        )}

        <div className="rounded-md border border-gray-300 p-4 dark:border-gray-600 dark:bg-gray-800">
          {agentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : availableSubAgents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No other agents available. Create more agents to enable
              multi-agent mode.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select agents to delegate tasks to. The agent will act as a
                supervisor and coordinate with these sub-agents.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {availableSubAgents.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex items-start gap-2 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubAgents.includes(agent.id)}
                      onChange={() => handleSubAgentToggle(agent.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <div className="text-sm">
                      <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
                        <Bot className="h-3 w-3" />
                        {agent.name}
                      </div>
                      {agent.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                          {agent.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {agent.provider} • {agent.modelName}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Agent"
          )}
        </button>
      </div>
    </form>
  );
};
