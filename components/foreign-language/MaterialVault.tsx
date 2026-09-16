import React, { useState, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { StudyMaterial, uploadStudyMaterial, toggleMaterialActive, deleteStudyMaterial } from "@/lib/foreign-language-api";
import { GlassCard } from "@/components/ui/GlassCard";

interface MaterialVaultProps {
  materials: StudyMaterial[];
  language: string;
  onMaterialsChanged: () => void;
}

export function MaterialVault({ materials, language, onMaterialsChanged }: MaterialVaultProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploading(true);
    try {
      await uploadStudyMaterial(file, language, "Other");
      onMaterialsChanged();
    } catch (err: any) {
      setError(err.message || "Failed to upload material");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleMaterialActive(id, !currentStatus);
      onMaterialsChanged();
    } catch (err: any) {
      setError(err.message || "Failed to toggle material status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteStudyMaterial(id);
      onMaterialsChanged();
    } catch (err: any) {
      setError(err.message || "Failed to delete material");
    }
  };

  return (
    <GlassCard className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Material Vault</h2>
        <div>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Material
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {materials.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No study materials uploaded for {language} yet.</p>
            <p className="text-sm mt-1">Upload PDFs or Word Docs to start.</p>
          </div>
        ) : (
          materials.map((mat) => (
            <div
              key={mat._id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                mat.isActive
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => handleToggle(mat._id, mat.isActive)} className="shrink-0 text-primary">
                  {mat.isActive ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="font-medium truncate">{mat.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="uppercase">{mat.fileType}</span>
                    <span>•</span>
                    <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(mat._id)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
