const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export interface UploadedFile {
  documentId: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const data = await response.json();
  return data as UploadedFile;
}

export async function deleteFile(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/document/${documentId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
}

export interface DocumentDetails {
  id: string;
  name: string;
  type: string;
  size: number;
  status: string;
  full_text_content?: string;
  createdAt: string;
}

export async function getDocument(
  documentId: string,
): Promise<DocumentDetails> {
  const response = await fetch(`${API_BASE_URL}/document/${documentId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }

  return response.json();
}
