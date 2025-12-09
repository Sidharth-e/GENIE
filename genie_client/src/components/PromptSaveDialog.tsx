import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { createPrompt } from "@/services/promptClient";

interface PromptSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent: string;
  onSave: () => void;
}

export function PromptSaveDialog({
  open,
  onOpenChange,
  initialContent,
  onSave,
}: PromptSaveDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setName("");
    }
  }, [open, initialContent]);

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await createPrompt({ name, content });
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save prompt:", error);
      // Ideally show a toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Prompt</DialogTitle>
          <DialogDescription>
            Save your current message as a prompt template for later use.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="My Prompt"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="content" className="text-right">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !name.trim() || !content.trim()}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
