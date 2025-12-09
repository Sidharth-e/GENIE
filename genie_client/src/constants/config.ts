export const config = {
    NAME: "Genie",
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/agent",
    DEFAULT_MODEL_PROVIDER: "azure-openai",
    DEFAULT_MODEL_NAME: "gpt-4o",
}