import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, Trash2, CheckCircle2, Circle, Loader2, Files } from "lucide-react";
import { StudyMaterial, uploadStudyMaterial, toggleMaterialActive, deleteStudyMaterial } from "@/lib/foreign-language-api";
import { GlassCard } from "@/components/GlassCard";

interface MaterialVaultProps {
  materials: StudyMaterial[];
  language: string;
  onMaterialsChanged: () => void;
}

const MATERIAL_TYPES = ["Textbook", "Vocabulary List", "Grammar Guide", "Previous Year Question Paper", "Other"];

export function MaterialVault({ materials, language, onMaterialsChanged }: MaterialVaultProps) {
  const [localMaterials, setLocalMaterials] = useState<StudyMaterial[]>(materials);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState(MATERIAL_TYPES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalMaterials(materials);
  }, [materials]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploading(true);
    try {
      await uploadStudyMaterial(file, language, materialType, title.trim() || file.name);
      setTitle("");
      onMaterialsChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload material");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLocalMaterials(prev => prev.map(m => m._id === id ? { ...m, isActive: !currentStatus } : m));
    try {
      await toggleMaterialActive(id, !currentStatus);
      onMaterialsChanged();
    } catch (err: unknown) {
      setLocalMaterials(materials);
      setError(err instanceof Error ? err.message : "Failed to toggle material status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    setLocalMaterials(prev => prev.filter(m => m._id !== id));
    try {
      await deleteStudyMaterial(id);
      onMaterialsChanged();
    } catch (err: unknown) {
      setLocalMaterials(materials);
      setError(err instanceof Error ? err.message : "Failed to delete material");
    }
  };

  return (
    <GlassCard className="p-5 md:p-6 h-full flex flex-col gap-4" glow="violet">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
          <Files className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight">Upload Study Material</h3>
          <p className="text-xs text-muted-foreground">
            PDF / DOCX vault — powers chat, quiz & listening.
          </p>
        </div>
        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary shrink-0">
          {localMaterials.filter(m => m.isActive).length} active
        </span>
      </div>

      {/* Upload form with dropdowns */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Material title — e.g. JLPT N5 Vocabulary Ch.1"
          className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Material type</span>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
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
          className="btn-gradient w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? "Parsing PDF / DOCX…" : "Choose PDF or DOCX & Upload"}
        </button>
        <p className="text-[11px] text-muted-foreground text-center">
          Tap a circle below to include / exclude a file from AI chat & quiz.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[120px] max-h-[300px] pr-0.5">
        {localMaterials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No study materials for {language} yet.</p>
            <p className="text-xs mt-1">Upload PDFs or Word docs to unlock the chatbot.</p>
          </div>
        ) : (
          localMaterials.map((mat) => (
            <div
              key={mat._id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                mat.isActive
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => handleToggle(mat._id, mat.isActive)} className="shrink-0 text-primary" title="Toggle active">
                  {mat.isActive ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="font-medium truncate text-sm">{mat.title}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="uppercase font-bold">{mat.fileType}</span>
                    <span>•</span>
                    <span className="truncate">{mat.materialType || "Other"}</span>
                    <span>•</span>
                    <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(mat._id)}
                className="p-2 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
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
