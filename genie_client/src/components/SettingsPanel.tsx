import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Bot,
  Server,
  Wrench,
  Loader2,
} from "lucide-react";
import { ModelConfiguration } from "./ModelConfiguration";
import { useMCPTools } from "@/hooks/useMCPTools";

interface SettingsPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  provider: string;
  setProvider: (provider: string) => void;
  model: string;
  setModel: (model: string) => void;
  selectedAgentId?: string;
  setSelectedAgentId: (agentId: string | undefined) => void;
  selectedTools: string[];
  setSelectedTools: (tools: string[]) => void;
}

export const SettingsPanel = ({
  isExpanded,
  onToggle,
  provider,
  setProvider,
  model,
  setModel,
  selectedAgentId,
  setSelectedAgentId,
  selectedTools,
  setSelectedTools,
}: SettingsPanelProps) => {
  const { data: mcpToolsData } = useMCPTools();
  const [agents, setAgents] = React.useState<any[]>([]);

  const handleToolToggle = (fullToolName: string) => {
    if (selectedAgentId) return; // Cannot toggle tools when agent is selected
    setSelectedTools(
      selectedTools.includes(fullToolName)
        ? selectedTools.filter((t) => t !== fullToolName)
        : [...selectedTools, fullToolName],
    );
  };

  React.useEffect(() => {
    if (isExpanded) {
      import("@/services/agentClient").then(({ fetchAgents }) => {
        fetchAgents().then(setAgents).catch(console.error);
      });
    }
  }, [isExpanded]);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Settings Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        aria-expanded={isExpanded}
        aria-label="Toggle settings panel"
      >
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
          {!isExpanded && (
            <>
              <span className="text-xs text-gray-500">
                {provider} / {model}
              </span>
              {(mcpToolsData?.totalCount ?? 0) > 0 && (
                <span className="text-xs text-gray-500">
                  - {mcpToolsData?.totalCount ?? 0} tools available
                </span>
              )}
            </>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Settings Content */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 px-4 pb-3 duration-200">
          <div className="space-y-3">
            {/* Agent Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Agent
              </label>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedAgentId || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAgentId(id || undefined);
                    // Update provider/model if agent selected
                    if (id) {
                      const agent = agents.find((a) => a.id === id);
                      if (agent) {
                        setProvider(agent.provider);
                        setModel(agent.modelName);
                        // If agent has restricted tools, show them checked but disabled
                        setSelectedTools(agent.tools || []);
                      }
                    } else {
                      setSelectedTools([]);
                    }
                  }}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">Default (No specific agent)</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Model Configuration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Model
              </label>
              <ModelConfiguration
                provider={provider}
                setProvider={setProvider}
                model={model}
                setModel={setModel}
              />
            </div>

            {/* Tool Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tools{" "}
                {selectedAgentId && (
                  <span className="text-xs font-normal text-gray-500">
                    (Configured by Agent)
                  </span>
                )}
              </label>
              <div
                className={`rounded-md border p-3 ${selectedAgentId ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" : "border-gray-300 dark:border-gray-600 dark:bg-gray-800"}`}
              >
                {!mcpToolsData ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : mcpToolsData.totalCount === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tools available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* If agent is selected, maybe show a message or just disable everything */}
                    {selectedAgentId && (
                      <p className="text-xs text-gray-500 italic mb-2">
                        Tools are determined by the selected agent
                        configuration.
                      </p>
                    )}
                    {Object.entries(mcpToolsData.serverGroups).map(
                      ([serverName, group]) => (
                        <div key={serverName} className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                            <Server className="h-3 w-3 text-gray-500" />
                            <span className="capitalize">{serverName}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {group.tools.map((tool) => {
                              const fullToolName = `${serverName}__${tool.name}`;
                              const isAgentMode = !!selectedAgentId;
                              return (
                                <label
                                  key={fullToolName}
                                  className={`flex items-start gap-2 rounded p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 ${isAgentMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedTools.includes(
                                      fullToolName,
                                    )}
                                    onChange={() =>
                                      handleToolToggle(fullToolName)
                                    }
                                    disabled={isAgentMode}
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                  />
                                  <div className="text-xs">
                                    <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
                                      <Wrench className="h-3 w-3" />
                                      {tool.name}
                                    </div>
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
          </div>
        </div>
      )}
    </div>
  );
};
