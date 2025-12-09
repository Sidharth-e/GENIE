import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  ArrowUp,
  Loader2,
  Paperclip,
  Bot,
  Wrench,
  BrainCog,
  Server,
  Eye,
  EyeOff,
  Check,
  Mic,
  MicOff,
  Book,
  Save,
  FileText,
  X,
  Trash2,
} from "lucide-react";
import { uploadFile, deleteFile, UploadedFile } from "@/services/fileService";
import { MessageOptions } from "@/types/message";
import { useUISettings } from "@/contexts/UISettingsContext";
import { useMCPTools } from "@/hooks/useMCPTools";
import { useAgents } from "@/hooks/useAgents";
import { PromptSaveDialog } from "./PromptSaveDialog";
import { fetchPrompts, Prompt } from "@/services/promptClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

interface MessageInputProps {
  onSendMessage: (message: string, opts?: MessageOptions) => Promise<void>;
  isLoading?: boolean;
  maxLength?: number;
  // Optional controlled state
  provider?: string;
  setProvider?: (provider: string) => void;
  model?: string;
  setModel?: (model: string) => void;
  selectedAgentId?: string;
  setSelectedAgentId?: (agentId: string | undefined) => void;
  disableAgentSelection?: boolean;
}

import { PROVIDER_CONFIG } from "@/constants/providers";
import { config } from "@/constants/config";

export const MessageInput = ({
  onSendMessage,
  isLoading = false,
  maxLength = 2000,
  // Destructure controlled props with defaults to undefined to distinguish from local state if needed,
  // but we can just use the prop if it exists or the local state if it doesn't.
  provider: propsProvider,
  setProvider: propsSetProvider,
  model: propsModel,
  setModel: propsSetModel,
  selectedAgentId: propsSelectedAgentId,
  setSelectedAgentId: propsSetSelectedAgentId,
  disableAgentSelection = false,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");

  // Local state
  const [localProvider, setLocalProvider] = useState<string>(
    config.DEFAULT_MODEL_PROVIDER,
  );
  const [localModel, setLocalModel] = useState<string>(
    config.DEFAULT_MODEL_NAME,
  );
  const [localSelectedAgentId, setLocalSelectedAgentId] = useState<
    string | undefined
  >(undefined);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { data: mcpToolsData } = useMCPTools();
  const { data: agents = [] } = useAgents();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [savePromptOpen, setSavePromptOpen] = useState(false);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);

      // Auto-upload
      setIsUploading(true);
      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const results = await Promise.all(uploadPromises);
        setUploadedFiles((prev) => [...prev, ...results]);
      } catch (error) {
        console.error("Upload failed", error);
        // Handle error (maybe remove failed files or show error state)
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove) {
      try {
        await deleteFile(fileToRemove.documentId);
      } catch (error) {
        console.error("Failed to delete file", error);
      }
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchPrompts().then(setPrompts).catch(console.error);
  }, []);

  const refreshPrompts = () => {
    fetchPrompts().then(setPrompts).catch(console.error);
  };

  // Voice to text
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setMessage((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleToolToggle = (fullToolName: string) => {
    if (selectedAgentId || disableAgentSelection) return; // Cannot toggle tools when agent is selected or chat started
    setSelectedTools(
      selectedTools.includes(fullToolName)
        ? selectedTools.filter((t) => t !== fullToolName)
        : [...selectedTools, fullToolName],
    );
  };

  // Derived state (controlled vs local)
  const provider = propsProvider !== undefined ? propsProvider : localProvider;
  const setProvider = propsSetProvider || setLocalProvider;

  const model = propsModel !== undefined ? propsModel : localModel;
  const setModel = propsSetModel || setLocalModel;

  const selectedAgentId =
    propsSelectedAgentId !== undefined
      ? propsSelectedAgentId
      : localSelectedAgentId;
  const setSelectedAgentId = propsSetSelectedAgentId || setLocalSelectedAgentId;

  // Sync selectedTools when selectedAgentId changes
  useEffect(() => {
    if (selectedAgentId && agents.length > 0) {
      const agent = agents.find((a: any) => a.id === selectedAgentId);
      if (agent) {
        setSelectedTools(agent.tools || []);
      }
    } else if (!selectedAgentId) {
      // If no agent selected (and not in a disabled thread state? no, disableAgentSelection might be true for thread but selectedAgentId might be undefined if default agent)
      // Actually if selectedAgentId is cleared, we might want to clear selected tools or leave them?
      // For now, let's just handle setting them when agent IS selected.
      // Clearing might be annoying if user switches back to default.
      // But if switching TO an agent, we MUST overwrite.
    }
  }, [selectedAgentId, agents]);

  const [approveAllTools, setApproveAllTools] = useState<boolean>(false);

  // UI settings for toggling tool messages
  const { hideToolMessages, toggleToolMessages } = useUISettings();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await onSendMessage(message, {
      model,
      provider,
      tools: selectedAgentId ? undefined : selectedTools,
      approveAllTools: approveAllTools,
      agentId: selectedAgentId,
      documentIds: uploadedFiles.map((f) => f.documentId),
    });
    setMessage("");
    setSelectedFiles([]);
    setUploadedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Calculate remaining characters
  const remainingChars = maxLength - message.length;
  // const isNearLimit = remainingChars < maxLength * 0.1;

  return (
    <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative flex flex-col rounded-[26px] bg-secondary/50 p-2 ring-1 ring-inset ring-border transition-all focus-within:ring-2 focus-within:ring-primary/20 hover:ring-primary/10 dark:bg-secondary/20">
          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 mb-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg bg-background p-2 text-xs text-secondary-foreground shadow-sm ring-1 ring-border"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col max-w-[120px]">
                      <span className="truncate font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {isUploading && (
                <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask anything..."
            className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-base outline-none disabled:opacity-50 md:text-sm"
            rows={1}
            style={{ height: "44px" }}
          />

          <div className="flex items-center justify-between pl-2 pr-1 pb-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Add attachment"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={disableAgentSelection}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disableAgentSelection}
                    className="flex h-8 items-center gap-2 rounded-full px-2 sm:px-3 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    <Bot className="h-4 w-4" />
                    <span className="max-w-[100px] truncate text-xs hidden sm:inline-block">
                      {selectedAgentId
                        ? agents.find((a) => a.id === selectedAgentId)?.name
                        : "Default Agent"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuLabel>Select Agent</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAgentId(undefined);
                      setSelectedTools([]);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        {!selectedAgentId && <Check className="h-4 w-4" />}
                      </div>
                      <span>Default (No Agent)</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {agents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        if (agent) {
                          setProvider(agent.provider);
                          setModel(agent.modelName);
                          setSelectedTools(agent.tools || []);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          {selectedAgentId === agent.id && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                        <span>{agent.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex h-8 items-center gap-2 rounded-full px-2 sm:px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Wrench className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">
                      {selectedAgentId || disableAgentSelection
                        ? `${selectedTools.length} Tools (Locked)`
                        : `${selectedTools.length} Tools`}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[280px] max-h-[300px] overflow-y-auto"
                >
                  <DropdownMenuLabel>
                    Tools {selectedAgentId && "(Configured by Agent)"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {mcpToolsData &&
                    Object.entries(mcpToolsData.serverGroups).map(
                      ([serverName, group]) => (
                        <div key={serverName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {serverName}
                          </div>
                          {group.tools.map((tool) => {
                            const fullToolName = `${serverName}__${tool.name}`;
                            return (
                              <DropdownMenuItem
                                key={fullToolName}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleToolToggle(fullToolName);
                                }}
                                disabled={
                                  !!selectedAgentId || disableAgentSelection
                                }
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {selectedTools.includes(fullToolName) && (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </div>
                                  <span className="truncate">{tool.name}</span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      ),
                    )}
                  {!mcpToolsData && (
                    <div className="p-2 text-xs text-center text-muted-foreground">
                      Loading tools...
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              {message.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {remainingChars}
                </span>
              )}
              {!selectedAgentId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex h-8 items-center gap-2 rounded-full px-2 sm:px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Image
                        src={PROVIDER_CONFIG[provider]?.icon || "/google.svg"}
                        alt={PROVIDER_CONFIG[provider]?.name || "Provider"}
                        width={16}
                        height={16}
                      />
                      <span className="text-xs max-w-[100px] truncate hidden sm:inline-block">
                        {PROVIDER_CONFIG[provider]?.models.find(
                          (m) => m.id === model,
                        )?.name || model}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="max-h-[300px] overflow-y-auto"
                  >
                    {Object.entries(PROVIDER_CONFIG).map(
                      ([providerKey, config]) => (
                        <div key={providerKey}>
                          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Image
                              src={config.icon}
                              width={14}
                              height={14}
                              alt={config.name}
                            />
                            {config.name}
                          </DropdownMenuLabel>
                          {config.models.map((m) => (
                            <DropdownMenuItem
                              key={m.id}
                              onClick={() => {
                                setProvider(providerKey);
                                setModel(m.id);
                              }}
                            >
                              <div className="flex items-center gap-2 pl-2">
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {model === m.id &&
                                    provider === providerKey && (
                                      <Check className="h-4 w-4" />
                                    )}
                                </div>
                                <span>{m.name}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ),
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`h-8 w-8 rounded-full ${
                  isListening
                    ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                aria-label={isListening ? "Stop recording" : "Start recording"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Saved Prompts"
                  >
                    <Book className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[240px] max-h-[300px] overflow-y-auto"
                >
                  <DropdownMenuLabel>Saved Prompts</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSavePromptOpen(true)}
                    disabled={!message.trim()}
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Save className="h-4 w-4" />
                      <span>Save current as prompt</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {prompts.length === 0 ? (
                    <div className="p-2 text-xs text-center text-muted-foreground">
                      No saved prompts yet.
                    </div>
                  ) : (
                    prompts.map((prompt) => (
                      <DropdownMenuItem
                        key={prompt.id}
                        onClick={() => {
                          setMessage(
                            (prev) =>
                              prev + (prev ? "\n" : "") + prompt.content,
                          );
                        }}
                      >
                        <span className="truncate">{prompt.name}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="submit"
                size="icon"
                disabled={
                  (!message.trim() && selectedFiles.length === 0) ||
                  isLoading ||
                  isUploading
                }
                className={`h-8 w-8 rounded-full transition-all ${
                  message.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4 text-muted-foreground">
            <label className="flex cursor-pointer items-center gap-1.5 hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={approveAllTools}
                onChange={(e) => setApproveAllTools(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-primary focus:ring-1 focus:ring-primary"
              />
              <span>Auto-approve tools</span>
            </label>

            <button
              type="button"
              onClick={toggleToolMessages}
              className="flex cursor-pointer items-center gap-1.5 hover:text-foreground transition-colors"
            >
              {hideToolMessages ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span>{hideToolMessages ? "Show tools" : "Hide tools"}</span>
            </button>
          </div>

          <div className="text-[10px] text-muted-foreground/50 hidden sm:block">
            Genie can make mistakes. Check important info.
          </div>
        </div>
      </form>
      <PromptSaveDialog
        open={savePromptOpen}
        onOpenChange={setSavePromptOpen}
        initialContent={message}
        onSave={refreshPrompts}
      />
    </div>
  );
};
