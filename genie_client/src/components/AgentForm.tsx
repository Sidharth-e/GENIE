"use client";

import React, { useState, useMemo } from "react";
import { Agent } from "@/types/agent";
import {
  Loader2,
  Server,
  Wrench,
  Users,
  Bot,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
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

  // Search states
  const [toolSearch, setToolSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");

  const { data: mcpToolsData } = useMCPTools();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();

  // Filter out self from available sub-agents
  const availableSubAgents = agents.filter(
    (agent) => agent.id !== initialData?.id,
  );

  // Filter tools based on search
  const filteredServerGroups = useMemo(() => {
    if (!mcpToolsData?.serverGroups) return {};
    if (!toolSearch.trim()) return mcpToolsData.serverGroups;

    const searchLower = toolSearch.toLowerCase();
    const filtered: typeof mcpToolsData.serverGroups = {};

    for (const [serverName, group] of Object.entries(
      mcpToolsData.serverGroups,
    )) {
      const matchingTools = group.tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchLower) ||
          tool.description?.toLowerCase().includes(searchLower),
      );
      if (matchingTools.length > 0) {
        filtered[serverName] = { ...group, tools: matchingTools };
      }
    }
    return filtered;
  }, [mcpToolsData?.serverGroups, toolSearch]);

  // Filter sub-agents based on search
  const filteredSubAgents = useMemo(() => {
    if (!agentSearch.trim()) return availableSubAgents;
    const searchLower = agentSearch.toLowerCase();
    return availableSubAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description?.toLowerCase().includes(searchLower),
    );
  }, [availableSubAgents, agentSearch]);

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

  // Calculate total filtered tools
  const totalFilteredTools = Object.values(filteredServerGroups).reduce(
    (acc, group) => acc + group.tools.length,
    0,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Agent Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Research Assistant"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this agent does"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
          rows={4}
          placeholder="You are a helpful assistant that..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
        />
      </div>

      {/* Provider & Model Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => {
              const newProvider = e.target.value;
              setProvider(newProvider);
              if (
                PROVIDER_CONFIG[newProvider] &&
                PROVIDER_CONFIG[newProvider].models.length > 0
              ) {
                setModelName(PROVIDER_CONFIG[newProvider].models[0].id);
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Model
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {PROVIDER_CONFIG[provider]?.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tools Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Wrench className="h-4 w-4" />
            Allowed Tools
            <span className="text-xs font-normal text-gray-500">
              ({selectedTools.length} selected)
            </span>
          </label>
        </div>

        {/* Tool Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50 min-h-[240px]">
          {!mcpToolsData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : totalFilteredTools === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {toolSearch
                ? "No tools match your search."
                : "No tools available."}
            </p>
          ) : (
            <div className="space-y-4 max-h-[240px] overflow-y-auto">
              {Object.entries(filteredServerGroups).map(
                ([serverName, group]) => (
                  <div key={serverName}>
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      <Server className="h-3.5 w-3.5" />
                      <span>{serverName}</span>
                      <span className="text-gray-400 font-normal">
                        ({group.tools.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {group.tools.map((tool) => {
                        const fullToolName = `${serverName}__${tool.name}`;
                        const isSelected = selectedTools.includes(fullToolName);
                        return (
                          <button
                            key={fullToolName}
                            type="button"
                            onClick={() => handleToolToggle(fullToolName)}
                            className={`group relative flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:border-blue-400"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-0.5 text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                              <Wrench className="h-3.5 w-3.5 text-gray-500" />
                              <span className="truncate">{tool.name}</span>
                            </div>
                            {tool.description && (
                              <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                                {tool.description}
                              </p>
                            )}
                          </button>
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

      {/* Sub-Agents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Users className="h-4 w-4" />
            Sub-Agents
            <span className="text-xs font-normal text-gray-500">
              (Multi-Agent Mode)
            </span>
          </label>
        </div>

        {selectedSubAgents.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 p-3 text-sm dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="rounded-full bg-purple-100 p-1.5 dark:bg-purple-800">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-purple-800 dark:text-purple-200">
                Supervisor Mode Active
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                This agent will delegate tasks to {selectedSubAgents.length}{" "}
                sub-agent(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-purple-700 dark:text-purple-300 whitespace-nowrap">
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
                className="w-16 rounded-md border border-purple-200 bg-white px-2 py-1 text-sm text-center focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-purple-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Agent Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50 min-h-[200px]">
          {agentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredSubAgents.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {agentSearch
                ? "No agents match your search."
                : availableSubAgents.length === 0
                  ? "No other agents available. Create more agents to enable multi-agent mode."
                  : "No agents available."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-[200px] overflow-y-auto">
              {filteredSubAgents.map((agent) => {
                const isSelected = selectedSubAgents.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSubAgentToggle(agent.id)}
                    className={`group relative flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500 dark:bg-purple-900/20 dark:border-purple-400"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-2 top-2 rounded-full bg-purple-500 p-0.5 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                      <Bot className="h-3.5 w-3.5 text-gray-500" />
                      <span className="truncate">{agent.name}</span>
                    </div>
                    {agent.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                        {agent.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                      {agent.provider} • {agent.modelName}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
