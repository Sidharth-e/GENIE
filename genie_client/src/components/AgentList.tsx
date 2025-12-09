"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Bot } from "lucide-react";
import { Agent } from "@/types/agent";
import { fetchAgents, createAgent, updateAgent, deleteAgent } from "@/services/agentClient";
import { AgentForm } from "./AgentForm";
import { motion, AnimatePresence } from "framer-motion";

interface AgentListProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (agent: Agent) => void;
}

export const AgentList = ({ isOpen, onClose, onSelect }: AgentListProps) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadAgents();
        }
    }, [isOpen]);

    const loadAgents = async () => {
        try {
            setIsLoading(true);
            const data = await fetchAgents();
            setAgents(data);
            setError(null);
        } catch (err) {
            setError("Failed to load agents");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
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
            await deleteAgent(id);
            await loadAgents();
        } catch (err) {
            console.error("Failed to delete agent", err);
            setError("Failed to delete agent");
        }
    };

    const handleSubmit = async (data: Partial<Agent>) => {
        try {
            if (selectedAgent) {
                await updateAgent(selectedAgent.id, data);
            } else {
                await createAgent(data);
            }
            setIsEditing(false);
            await loadAgents();
        } catch (err) {
            console.error("Failed to save agent", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to save agent: ${errorMessage}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-gray-900 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isEditing ? (selectedAgent ? "Edit Agent" : "Create Agent") : "Custom Agents"}
                    </h2>
                    <button
                        onClick={onClose}
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
                        />
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={handleCreate}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-blue-500 hover:text-blue-500 dark:border-gray-700"
                            >
                                <Plus className="h-5 w-5" />
                                <span className="font-medium">Create New Agent</span>
                            </button>

                            <div className="grid gap-3">
                                {isLoading ? (
                                    <p className="text-center text-gray-500">Loading agents...</p>
                                ) : agents.length === 0 ? (
                                    <p className="text-center text-gray-500">No agents found.</p>
                                ) : (
                                    agents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            className="group flex items-start justify-between rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                    <Bot className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                                        {agent.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {agent.description || "No description"}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                                        <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                                                            {agent.provider}
                                                        </span>
                                                        <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                                                            {agent.modelName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                {onSelect && (
                                                    <button
                                                        onClick={() => onSelect(agent)}
                                                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                        title="Select"
                                                    >
                                                        <span className="text-xs font-bold underline">Select</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(agent)}
                                                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(agent.id)}
                                                    className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
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
