import { Agent } from "@/types/agent";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function fetchAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/custom-agents`);
    if (!response.ok) {
        throw new Error("Failed to fetch agents");
    }
    return response.json();
}

export async function createAgent(agent: Partial<Agent>): Promise<Agent> {
    const url = `${API_BASE_URL}/custom-agents`;
    console.log("Creating agent with data:", agent, "at URL:", url);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(agent),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Create agent failed:", response.status, errorText);
            throw new Error(`Failed to create agent: ${response.status} ${errorText}`);
        }
        return response.json();
    } catch (e) {
        console.error("Fetch error:", e);
        throw e;
    }
}

export async function updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/custom-agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
    });
    if (!response.ok) {
        throw new Error("Failed to update agent");
    }
    return response.json();
}

export async function deleteAgent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/custom-agents/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete agent");
    }
}
