"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { XIcon, FileIcon, UploadIcon } from "lucide-react";
import { 
  Attachment, 
  AttachmentMedia, 
  AttachmentContent, 
  AttachmentTitle, 
  AttachmentDescription, 
  AttachmentActions, 
  AttachmentAction 
} from "@/components/ui/attachment";
import { toast } from "sonner";

import {
    upload,
} from "@imagekit/next";

interface ManagedFile {
  id: string; 
  url: string;
  name: string;
  alt: string; // Added alt tracking locally
  state: "idle" | "uploading" | "processing" | "error" | "done";
  progress: number;
}

interface ImageItem {
  url: string;
  id: string;
  alt: string;
}

interface Props {
  folderName?: string;
  onUploadComplete: (data: { url: string; id: string; alt: string }[]) => void;
  onImageDelete: (data: { url: string; id: string }) => void;
  onAltChange?: (id: string, altValue: string) => void; // Optional callback to handle alt text updates live
  current?: ImageItem[]; 
}

const MAX_FILE_SIZE_MB = 20; // Define your limit (e.g., 20 Megabytes)
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ApiAttachmentUploader({ 
  folderName, 
  onUploadComplete, 
  current = [], 
  onImageDelete,
  onAltChange 
}: Props) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync incoming array values from props
  useEffect(() => {
    if (current && current.length > 0) {
      const initialFiles = current.map((img) => ({
        id: img.id,
        url: img.url,
        name: img.url.split("/").pop() || "Image File",
        alt: img.alt || "",
        state: "done" as const,
        progress: 100,
      }));
      setFiles(initialFiles);
    } else {
      setFiles([]);
    }
  }, [current]);

  const authenticator = async () => {
    const response = await fetch("/api/media/upload-auth");
    if (!response.ok) throw new Error("Upload auth failed.");
    return await response.json();
  };


const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
  if (selectedFiles.length === 0) return;

  // 1. Filter out files that exceed our size threshold
  const validFiles: File[] = [];
  const oversizedFileNames: string[] = [];

  selectedFiles.forEach((file) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      oversizedFileNames.push(file.name);
    } else {
      validFiles.push(file);
    }
  });

  // 2. Alert the user if any files were rejected
  if (oversizedFileNames.length > 0) {
    toast.error(
      `Skipped ${oversizedFileNames.length} file(s) over ${MAX_FILE_SIZE_MB}MB`,
      {
        description: oversizedFileNames.join(", "),
      }
    );
  }

  // 3. Halt processing if no files passed the size check
  if (validFiles.length === 0) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  // 4. Map only the validated items into your UI temporary list
  const nextFiles: ManagedFile[] = validFiles.map((file, i) => ({
    id: `temp-${Date.now()}-${i}`,
    url: "",
    name: file.name,
    alt: "",
    state: "uploading",
    progress: 0,
  }));

  setFiles((prev) => [...prev, ...nextFiles]);
  const uploadedResults: { url: string; id: string; alt: string }[] = [];

  // 5. Run loop using validFiles array instead of selectedFiles
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const tempEntry = nextFiles[i];
    const abortController = new AbortController();

    try {
      const authParams = await authenticator();
      const { signature, expire, token, publicKey } = authParams;

      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        useUniqueFileName: true,
        fileName: file.name,
        folder: folderName,
        onProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.id === tempEntry.id ? { ...f, progress: pct } : f))
          );
        },
        abortSignal: abortController.signal,
      });

      const completedData = {
        url: uploadResponse.url || "",
        id: uploadResponse.fileId || "",
        alt: "",
      };

      uploadedResults.push(completedData);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === tempEntry.id
            ? {
                ...f,
                id: uploadResponse.fileId || "",
                url: uploadResponse.url || "",
                state: "done",
                progress: 100,
              }
            : f
        )
      );
    } catch (error) {
      let errorMsg = "An error occurred during upload.";
      if (error instanceof Error) errorMsg = error.message;
      toast.error(`"${file.name}" failed: ${errorMsg}`);
      setFiles((prev) => prev.filter((f) => f.id !== tempEntry.id));
    }
  }

  if (uploadedResults.length > 0) {
    onUploadComplete(uploadedResults);
  }
  if (fileInputRef.current) fileInputRef.current.value = "";
};
  const handleImageDelete = async (id: string, url: string) => {
    if (id.startsWith("temp-")) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      return;
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, state: "uploading" as const } : f))
    );

    try {
      const res = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Server deletion failed.");

      setFiles((prev) => prev.filter((f) => f.id !== id));
      onImageDelete({ url, id });
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete the image.");
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, state: "done" as const } : f))
      );
    }
  };

  const handleLocalAltChange = (id: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, alt: value } : f))
    );
    if (onAltChange) {
      onAltChange(id, value);
    }
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept="image/*"
        multiple
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-accent transition"
      >
        <UploadIcon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Click to upload files (MAX 20MB)</span>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4">
        {files.map((file) => (
          <Attachment key={file.id} state={file.state} className="w-full items-start">
            <AttachmentMedia variant={file.state === "done" ? "image" : "icon"} className="mt-1">
              {file.state === "done" && file.url ? (
                <Image
                  src={file.url}
                  alt={file.alt}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </AttachmentMedia>

            <AttachmentContent className="flex-1 space-y-1">
              <AttachmentTitle className="truncate max-w-50">
                {file.name}
              </AttachmentTitle>
              
              {file.state === "done" ? (
                // Seamless inline input context for Alt text editing
                <input
                  type="text"
                  placeholder="Add descriptive alt text..."
                  value={file.alt}
                  onChange={(e) => handleLocalAltChange(file.id, e.target.value)}
                  className="w-full bg-transparent border-b border-muted-foreground/20 text-xs text-muted-foreground focus:outline-none focus:border-primary pb-0.5 transition"
                />
              ) : (
                <AttachmentDescription>
                  {file.state === "uploading" && `Uploading · ${file.progress}%`}
                  {file.state === "processing" && "Processing CDN files..."}
                </AttachmentDescription>
              )}
            </AttachmentContent>

            <AttachmentActions className="mt-1">
              <AttachmentAction
                aria-label="Remove file"
                onClick={() => handleImageDelete(file.id, file.url)}
              >
                <XIcon className="h-4 w-4" />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        ))}
      </div>
    </div>
  );
}