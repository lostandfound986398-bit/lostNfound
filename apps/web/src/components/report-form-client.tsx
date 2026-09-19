"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { submitReport } from "@/app/actions/reports";
import { createClient } from "@/lib/supabase/client";

interface ReportFormClientProps {
  type: "lost" | "found";
  categories: string[];
  locations: string[];
}

export function ReportFormClient({ type, categories, locations }: ReportFormClientProps) {
  const [uploading, setUploading] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ storageKey: string; mimeType: string; sizeBytes: number; previewUrl: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const lost = type === "lost";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("report-photos")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from("report-photos").getPublicUrl(fileName);

      setImageMeta({
        storageKey: data.path,
        mimeType: file.type,
        sizeBytes: file.size,
        previewUrl: urlData.publicUrl,
      });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={submitReport} className="stack-form report-form">
      <input name="type" type="hidden" value={lost ? "LOST" : "FOUND"} />
      {imageMeta && (
        <>
          <input name="imageKey" type="hidden" value={imageMeta.storageKey} />
          <input name="mimeType" type="hidden" value={imageMeta.mimeType} />
          <input name="sizeBytes" type="hidden" value={imageMeta.sizeBytes} />
        </>
      )}

      <label>
        Item name
        <input className="form-control" name="title" placeholder="Example: Brown leather wallet" required />
      </label>

      <div className="two-fields">
        <label>
          Category
          <select className="form-control" name="category" defaultValue="" required>
            <option disabled value="">Select category</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          Main color
          <input className="form-control" name="color" placeholder="Example: Brown" required />
        </label>
      </div>

      <div className="two-fields">
        <label>
          Date {lost ? "lost" : "found"}
          <input className="form-control" name="occurredAt" type="date" required />
        </label>

        <label>
          Campus location
          <select className="form-control" name="location" defaultValue="" required>
            <option disabled value="">Select location</option>
            {locations.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Public description
        <textarea
          className="form-control textarea"
          name="publicDescription"
          placeholder="Details that may safely appear in search results"
        />
      </label>

      <label>
        Private ownership details
        <textarea
          className="form-control textarea"
          name="privateVerificationDetails"
          placeholder={
            lost
              ? "Marks, contents, serial details, or other proof only staff should see"
              : "Details the true owner should know"
          }
        />
      </label>

      <label className="upload-box style-file-upload">
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} id="photo-input" />
        {uploading ? (
          <div className="upload-status">
            <Loader2 className="animate-spin" size={24} />
            <span>Uploading photo...</span>
          </div>
        ) : imageMeta ? (
          <div className="upload-status text-success">
            <CheckCircle2 size={24} />
            <strong>Photo attached!</strong>
            <small>Click to replace photo</small>
            {imageMeta.previewUrl && (
              <img
                src={imageMeta.previewUrl}
                alt="Preview"
                style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginTop: "8px" }}
              />
            )}
          </div>
        ) : (
          <label htmlFor="photo-input" style={{ cursor: "pointer", width: "100%", textAlign: "center" }}>
            <Camera size={24} />
            <div>
              <strong>Add item photo</strong>
            </div>
            <small>JPG, PNG or WEBP up to 10MB</small>
          </label>
        )}
      </label>
      {uploadError && <p className="error-text" style={{ color: "red", fontSize: "0.875rem" }}>{uploadError}</p>}

      <button className="button button--primary" type="submit" disabled={uploading}>
        Submit {type} report
      </button>
    </form>
  );
}
