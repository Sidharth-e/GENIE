"use client";

import { useState, useEffect } from "react";
import type { MessageResponse } from "@/types/message";
import {
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  ImageIcon,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMessageContent } from "@/services/messageUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSession } from "next-auth/react";
import { getDocument, DocumentDetails } from "@/services/fileService";
import Image from "next/image";

interface HumanMessageProps {
  message: MessageResponse;
}

interface AttachmentDisplayProps {
  documentId: string;
}

const AttachmentDisplay = ({ documentId }: AttachmentDisplayProps) => {
  const [doc, setDoc] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setIsLoading(true);
        const document = await getDocument(documentId);
        setDoc(document);
      } catch (err) {
        console.error("Failed to fetch document:", err);
        setError("Failed to load attachment");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-background/50 p-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading attachment...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
        <File className="h-4 w-4" />
        <span>{error || "Attachment not found"}</span>
      </div>
    );
  }

  const isImage = doc.type.startsWith("image/");

  // For images, render inline
  if (isImage && doc.full_text_content) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
        <Image
          src={doc.full_text_content}
          alt={doc.name}
          width={300}
          height={200}
          className="max-h-[300px] w-auto object-contain"
          unoptimized
        />
        <div className="flex items-center gap-2 bg-background/50 px-2 py-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          <span className="truncate" title={doc.name}>
            {doc.name}
          </span>
        </div>
      </div>
    );
  }

  // For text documents, show collapsible preview
  const contentPreview = doc.full_text_content
    ? doc.full_text_content.length > 500
      ? doc.full_text_content.substring(0, 500) + "..."
      : doc.full_text_content
    : "(No content available)";

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-border/50 bg-background/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-2 p-2 text-left text-xs transition-colors hover:bg-background/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="truncate font-medium text-foreground"
              title={doc.name}
            >
              {doc.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {(doc.size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/30 p-3">
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground font-mono">
            {contentPreview}
          </pre>
          {doc.full_text_content && doc.full_text_content.length > 500 && (
            <p className="mt-2 text-[10px] text-muted-foreground/70 italic">
              Showing first 500 characters...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const HumanMessage = ({ message }: HumanMessageProps) => {
  const { data: session } = useSession();

  // Extract document IDs from message additional_kwargs
  const documentIds: string[] =
    (message.data as any)?.additional_kwargs?.document_ids || [];

  // Get the text content, excluding the injected document context
  let displayContent = getMessageContent(message);

  // Remove the "Attached Documents:" section from displayed content
  // since we're now showing attachments separately
  if (displayContent.includes("\n\nAttached Documents:")) {
    displayContent = displayContent.split("\n\nAttached Documents:")[0];
  }

  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            "bg-gray-300/50 text-gray-800",
            "backdrop-blur-sm supports-[backdrop-filter]:bg-gray-300/50",
          )}
        >
          <div className="prose dark:prose-invert max-w-none">
            <p className="my-0">{displayContent}</p>
          </div>

          {/* Render attachments */}
          {documentIds.length > 0 && (
            <div className="mt-2 space-y-2">
              {documentIds.map((docId) => (
                <AttachmentDisplay key={docId} documentId={docId} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
        <Avatar className="h-8 w-8">
          {session?.user?.image ? (
            <AvatarImage
              src={session.user.image}
              alt={session.user.name || "User"}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
  );
};
