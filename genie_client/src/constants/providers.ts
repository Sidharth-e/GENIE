export const PROVIDER_CONFIG: Record<
  string,
  {
    name: string;
    icon: string;
    models: { id: string; name: string }[];
  }
> = {
  google: {
    name: "Google",
    icon: "/google.svg",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
      { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview" },
    ],
  },
  "azure-openai": {
    name: "Azure OpenAI",
    icon: "/openai.svg",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-5.1-chat", name: "GPT 5.1" },
    ],
  },
};
