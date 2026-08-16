import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPortfolio } from "@/lib/github-api";
import { Github, Code, ExternalLink, Briefcase, Share2, Copy, Check, CheckCircle2, ChevronRight, FileCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portfolio/$username")({
  component: PortfolioPage,
});

function PortfolioPage() {
  const { username } = Route.useParams();
  
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["portfolio", username],
    queryFn: () => getPortfolio(username),
    retry: false,
  });

  const error = queryError ? (queryError as Error).message : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[color:var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading {username}'s portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="p-8 rounded-2xl glass-strong max-w-md w-full text-center space-y-4 shadow-2xl border-red-500/20">
          <Github className="h-16 w-16 mx-auto text-red-400" />
          <h2 className="text-2xl font-bold text-white">Portfolio Not Found</h2>
          <p className="text-muted-foreground text-sm">
            {error || "This user hasn't generated any AI-analyzed portfolio projects yet."}
          </p>
          <a
            href="/"
            className="inline-block mt-4 text-[color:var(--color-primary)] hover:underline text-sm"
          >
            Create your own portfolio on Campus to Career AI
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-[color:var(--color-primary)] selection:text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-16 px-6 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-96 w-96 bg-[color:var(--color-primary)]/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-2xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                {data.user.name ? data.user.name.charAt(0).toUpperCase() : username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              {data.user.name || username}
            </h1>
            <div className="flex items-center justify-center gap-2 text-indigo-300 font-medium">
              <Briefcase className="h-4 w-4" />
              <span>{data.user.targetRole}</span>
              <span className="mx-2 opacity-50">•</span>
              <a 
                href={`https://github.com/${data.user.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>@{data.user.githubUsername}</span>
              </a>
            </div>
          </div>

          {data.user.skills && data.user.skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {data.user.skills.map((s: string) => (
                <span key={s} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 shadow-sm">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Portfolio URL copied to clipboard!");
              }}
              className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition flex items-center gap-2 shadow-lg shadow-indigo-500/10"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="flex items-center gap-3">
          <Code className="h-6 w-6 text-[color:var(--color-primary)]" />
          <h2 className="text-2xl font-bold">Featured Projects</h2>
          <div className="h-px bg-white/10 flex-1 ml-4" />
        </div>

        {data.projects.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl border-white/5">
            <p className="text-muted-foreground">No analyzed projects to display yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {data.projects.map((proj) => (
              <div 
                key={proj._id} 
                className="group relative bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden transition-all hover:border-[color:var(--color-primary)]/50 hover:shadow-2xl hover:shadow-[color:var(--color-primary)]/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <div className="p-8 md:p-10 relative z-10 space-y-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[color:var(--color-primary)] transition-colors">
                        {proj.repoFullName.split('/')[1]}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        {proj.repoFullName}
                      </p>
                    </div>
                    <a
                      href={proj.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Source
                    </a>
                  </div>

                  {/* Overview */}
                  <div>
                    <p className="text-slate-300 leading-relaxed">
                      {proj.overview}
                    </p>
                  </div>

                  {/* Resume Highlights */}
                  {proj.resumeImpact && proj.resumeImpact.length > 0 && (
                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                      <h4 className="text-sm font-semibold text-indigo-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <CheckCircle2 className="h-4 w-4" /> Impact Highlights
                      </h4>
                      <ul className="space-y-3">
                        {proj.resumeImpact.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <ChevronRight className="h-4 w-4 text-[color:var(--color-primary)] shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tech / Files */}
                  {proj.filesAnalyzed && proj.filesAnalyzed.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Key Files Analyzed</h4>
                      <div className="flex flex-wrap gap-2">
                        {proj.filesAnalyzed.slice(0, 8).map(file => (
                          <span key={file} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
                            <FileCode className="h-3 w-3" />
                            {file.split('/').pop()}
                          </span>
                        ))}
                        {proj.filesAnalyzed.length > 8 && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-500">
                            +{proj.filesAnalyzed.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="text-center py-12 border-t border-white/5 text-sm text-muted-foreground">
        Powered by <a href="/" className="text-[color:var(--color-primary)] font-semibold hover:underline">Campus to Career AI</a>
      </footer>
    </div>
  );
}
