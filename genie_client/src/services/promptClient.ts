
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export interface Prompt {
    id: string;
    userId: string;
    name: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export async function fetchPrompts(): Promise<Prompt[]> {
    const response = await fetch(`${API_BASE_URL}/prompts`);
    if (!response.ok) {
        throw new Error("Failed to fetch prompts");
    }
    return response.json();
}

export async function createPrompt(data: { name: string; content: string }): Promise<Prompt> {
    const response = await fetch(`${API_BASE_URL}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create prompt: ${response.status} ${errorText}`);
    }
    return response.json();
}

export async function deletePrompt(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete prompt");
    }
}
