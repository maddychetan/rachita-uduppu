import { useRef, useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  value: string;           // current image URL (could be /api/images/... or empty)
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB");
      return;
    }
    setError("");
    setUploading(true);

    try {
      // Convert to base64
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = sessionStorage.getItem("admin-token") || "";
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: dataUrl, filename: file.name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await res.json();
      onChange(url);
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="font-body text-sm font-medium text-foreground">{label}</label>
      )}

      {value ? (
        /* Preview */
        <div className="relative group rounded-xl overflow-hidden border border-border aspect-[4/3] bg-muted">
          <img
            src={value}
            alt="Product image"
            className="w-full h-full object-cover"
          />
          {/* Remove overlay */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove image"
          >
            <X size={14} />
          </button>
          {/* Re-upload overlay */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="bg-black/60 text-white text-xs font-body px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Upload size={12} /> Change image
            </span>
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative rounded-xl border-2 border-dashed aspect-[4/3] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none
            ${dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="text-primary animate-spin" />
              <p className="font-body text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                {dragging ? <Upload size={22} className="text-primary" /> : <ImageIcon size={22} className="text-muted-foreground" />}
              </div>
              <div className="text-center px-4">
                <p className="font-body text-sm font-medium text-foreground">
                  {dragging ? "Drop to upload" : "Drag & drop image here"}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">or click to browse · JPG, PNG, WEBP · max 5 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="font-body text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
