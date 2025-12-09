import { Bot } from "lucide-react";

export const LoadingMessage = () => {
    return (
        <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <Bot className="text-primary h-5 w-5" />
            </div>
            <div className="flex items-center">
                <div className="bg-gray-200/30 text-gray-800 rounded-2xl px-4 py-3 flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    );
};
