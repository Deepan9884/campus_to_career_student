import { useEffect, useRef, useState } from "react";
import {
  Award,
  Upload,
  Trash2,
  Loader2,
  BadgeCheck,
  FileCheck2,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import {
  LanguageCertificate,
  deleteLanguageCertificate,
  getLanguageCertificates,
  uploadLanguageCertificate,
} from "@/lib/foreign-language-api";

interface CertificateVaultProps {
  language: string;
  examLevels: string[];
  compact?: boolean;
}

const ISSUERS = [
  "JLPT (Japan Foundation)",
  "DELF / DALF",
  "Goethe-Institut",
  "DELE (Instituto Cervantes)",
  "IELTS / TOEFL",
  "University",
  "Private Academy",
  "Other",
];

const STATUS = ["Completed", "In Progress", "Planned"];
const LS_KEY = "cf_fl_certs_v1";

interface LocalCert extends Omit<LanguageCertificate, "_id"> {
  _id: string;
  local?: boolean;
}

function readLocal(): LocalCert[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function CertificateVault({ language, examLevels, compact }: CertificateVaultProps) {
  const [certs, setCerts] = useState<LocalCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    certificateTitle: "",
    examLevel: examLevels[0] || "N5",
    issuer: ISSUERS[0],
    status: STATUS[0],
    score: "",
    credentialId: "",
    issuedDate: "",
    notes: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, examLevel: examLevels[0] || "N5" }));
  }, [examLevels]);

  const fetchCerts = async () => {
    setLoading(true);
    const local = readLocal().filter((c) => !language || c.language === language);
    try {
      const remote = await getLanguageCertificates(language);
      const merged: LocalCert[] = [
        ...remote.map((r) => ({ ...r })),
        ...local.filter((l) => l.local),
      ];
      setCerts(merged);
    } catch {
      setCerts(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.certificateTitle.trim()) {
      setError("Please give your certificate a title (e.g. JLPT N5 Certificate).");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        file,
        language,
        examLevel: form.examLevel,
        certificateTitle: form.certificateTitle.trim(),
        issuer: form.issuer,
        status: form.status,
        score: form.score,
        credentialId: form.credentialId,
        issuedDate: form.issuedDate,
        notes: form.notes,
      };
      try {
        await uploadLanguageCertificate(payload);
        await fetchCerts();
      } catch {
        // Offline fallback — persist locally so the banner still works
        const entry: LocalCert = {
          _id: `local-${Date.now()}`,
          language,
          examLevel: form.examLevel,
          certificateTitle: form.certificateTitle.trim(),
          issuer: form.issuer,
          status: form.status,
          score: form.score,
          credentialId: form.credentialId,
          issuedDate: form.issuedDate,
          notes: form.notes,
          originalFileName: file?.name || "",
          fileType: file?.name.split(".").pop() || "",
          createdAt: new Date().toISOString(),
          local: true,
        };
        const all = readLocal();
        localStorage.setItem(LS_KEY, JSON.stringify([entry, ...all]));
        await fetchCerts();
      }
      setForm({
        certificateTitle: "",
        examLevel: examLevels[0] || "N5",
        issuer: ISSUERS[0],
        status: STATUS[0],
        score: "",
        credentialId: "",
        issuedDate: "",
        notes: "",
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save certificate");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, isLocal?: boolean) => {
    if (!confirm("Delete this certificate entry?")) return;
    if (isLocal) {
      localStorage.setItem(LS_KEY, JSON.stringify(readLocal().filter((c) => c._id !== id)));
      setCerts((p) => p.filter((c) => c._id !== id));
      return;
    }
    try {
      await deleteLanguageCertificate(id);
    } catch {
      // fall through — remove locally anyway
    }
    setCerts((p) => p.filter((c) => c._id !== id));
  };

  return (
    <GlassCard className="p-5 md:p-6 h-full flex flex-col gap-4" glow="amber">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-amber-300" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight">Upload Your Certificate</h3>
          <p className="text-xs text-muted-foreground">
            Store {language} proof + exam details for placements.
          </p>
        </div>
        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-300/25 text-amber-200 shrink-0">
          {certs.length} saved
        </span>
      </div>

      {/* Upload + detail dropdowns */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-colors px-4 py-4 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Upload className="w-4 h-4" />
          {file ? file.name : "Choose certificate file (PDF / PNG / JPG / DOCX)"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <input
          value={form.certificateTitle}
          onChange={(e) => set("certificateTitle", e.target.value)}
          placeholder="Certificate title — e.g. JLPT N5 Official Certificate"
          className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="grid grid-cols-2 gap-2.5">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Exam / Level</span>
            <select
              value={form.examLevel}
              onChange={(e) => set("examLevel", e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              {examLevels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Issuer</span>
            <select
              value={form.issuer}
              onChange={(e) => set("issuer", e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              {ISSUERS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Score / Grade</span>
            <input
              value={form.score}
              onChange={(e) => set("score", e.target.value)}
              placeholder="e.g. 152/180, A2 Pass"
              className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <input
            value={form.credentialId}
            onChange={(e) => set("credentialId", e.target.value)}
            placeholder="Credential ID (optional)"
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="month"
            value={form.issuedDate}
            onChange={(e) => set("issuedDate", e.target.value)}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        </div>

        {!compact && (
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Notes — skills tested, validity, verification link…"
            rows={2}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
          />
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
          Save Certificate
        </button>
      </div>

      {/* Saved list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[90px] max-h-[260px] pr-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading certificates…
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-5 text-muted-foreground text-sm rounded-xl border border-dashed border-border/70">
            <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No certificates yet — upload your first {language} proof above.
          </div>
        ) : (
          certs.map((c) => (
            <div key={c._id} className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-300/25 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.certificateTitle}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.examLevel} • {c.issuer} • {c.status}
                  {c.score ? ` • ${c.score}` : ""}
                </p>
                {c.originalFileName && (
                  <p className="text-[11px] text-muted-foreground truncate">📎 {c.originalFileName}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(c._id, c.local)}
                className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
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
