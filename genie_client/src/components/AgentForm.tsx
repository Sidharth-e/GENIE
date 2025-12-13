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
  ChevronDown,
  ChevronRight,
  Settings,
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

  // Collapsible section states
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [subAgentsExpanded, setSubAgentsExpanded] = useState(false);

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

  // Calculate totals
  const totalFilteredTools = Object.values(filteredServerGroups).reduce(
    (acc, group) => acc + group.tools.length,
    0,
  );
  const totalTools = mcpToolsData?.totalCount || 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[70vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Basic Info Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Basic Information
            </h3>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Research Assistant"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                System Prompt *
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                required
                rows={3}
                placeholder="You are a helpful assistant that..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Model
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {PROVIDER_CONFIG[provider]?.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Section - Collapsible */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-green-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Tools
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {selectedTools.length} / {totalTools}
              </span>
            </div>
            {toolsExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {toolsExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 pt-3">
              {/* Tool Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 py-1.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Tools List */}
              <div className="max-h-[200px] overflow-y-auto">
                {!mcpToolsData ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : totalFilteredTools === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {toolSearch
                      ? "No tools match your search."
                      : "No tools available."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(filteredServerGroups).map(
                      ([serverName, group]) => (
                        <div key={serverName}>
                          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            <Server className="h-3 w-3" />
                            {serverName}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {group.tools.map((tool) => {
                              const fullToolName = `${serverName}__${tool.name}`;
                              const isSelected =
                                selectedTools.includes(fullToolName);
                              return (
                                <button
                                  key={fullToolName}
                                  type="button"
                                  onClick={() => handleToolToggle(fullToolName)}
                                  title={tool.description || tool.name}
                                  className={`relative flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs transition-all ${
                                    isSelected
                                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600"
                                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{tool.name}</span>
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
          )}
        </div>

        {/* Sub-Agents Section - Collapsible */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setSubAgentsExpanded(!subAgentsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Sub-Agents
              </h3>
              {selectedSubAgents.length > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Supervisor • {selectedSubAgents.length} agent(s)
                </span>
              ) : (
                <span className="text-xs text-gray-500">Optional</span>
              )}
            </div>
            {subAgentsExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {subAgentsExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 pt-3">
              {selectedSubAgents.length > 0 && (
                <div className="flex items-center gap-3 mb-3 rounded-md bg-purple-50 p-2.5 text-sm dark:bg-purple-900/20">
                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="text-purple-700 dark:text-purple-300 text-xs">
                    Supervisor Mode - Max iterations:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={recursionLimit}
                    onChange={(e) =>
                      setRecursionLimit(
                        Math.max(1, parseInt(e.target.value) || 25),
                      )
                    }
                    className="w-14 rounded border border-purple-200 bg-white px-2 py-0.5 text-xs text-center focus:border-purple-500 focus:outline-none dark:border-purple-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              )}

              {/* Agent Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 py-1.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Agents List */}
              <div className="max-h-[160px] overflow-y-auto">
                {agentsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : filteredSubAgents.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {agentSearch
                      ? "No agents match your search."
                      : availableSubAgents.length === 0
                        ? "Create more agents to enable multi-agent mode."
                        : "No agents available."}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredSubAgents.map((agent) => {
                      const isSelected = selectedSubAgents.includes(agent.id);
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => handleSubAgentToggle(agent.id)}
                          className={`relative flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-all ${
                            isSelected
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 flex-shrink-0 text-purple-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <Bot className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="font-medium truncate text-gray-800 dark:text-gray-200">
                                {agent.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {agent.provider} • {agent.modelName}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
