import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SocialAuthButtonsProps {
  onGoogleSuccess: (credentialOrToken: string) => Promise<void>;
  onGithubSuccess: (payload?: { code?: string; accessToken?: string; username?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function GoogleIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GithubIcon({ className = "w-4 h-4 shrink-0 fill-current text-white" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function GoogleClientButton({
  onGoogleSuccess,
  isAnyLoading,
  setGoogleBusy,
}: {
  onGoogleSuccess: (credentialOrToken: string) => Promise<void>;
  isAnyLoading: boolean;
  setGoogleBusy: (busy: boolean) => void;
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasRealClientId = Boolean(clientId && !clientId.includes("demo1234567890abcdef"));

  // If real Client ID is defined in environment, use Google's native component
  if (hasRealClientId) {
    return (
      <RealGoogleButton
        onGoogleSuccess={onGoogleSuccess}
        isAnyLoading={isAnyLoading}
        setGoogleBusy={setGoogleBusy}
      />
    );
  }

  // Helpful prompt if Client ID is not configured yet
  const handleUnconfiguredGoogleLogin = () => {
    toast.info("Google Sign-In requires VITE_GOOGLE_CLIENT_ID in your .env file.", {
      description: "Create an OAuth 2.0 Web Client ID in Google Cloud Console and paste it into .env.",
      duration: 5000,
    });
  };

  return (
    <button
      type="button"
      onClick={handleUnconfiguredGoogleLogin}
      disabled={isAnyLoading}
      className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-white rounded-xl py-2.5 px-3 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-lg cursor-pointer disabled:opacity-50 min-h-[40px]"
    >
      <GoogleIcon className="w-4 h-4 shrink-0" />
      <span className="text-white font-medium">Google</span>
    </button>
  );
}

function RealGoogleButton({
  onGoogleSuccess,
  isAnyLoading,
  setGoogleBusy,
}: {
  onGoogleSuccess: (credentialOrToken: string) => Promise<void>;
  isAnyLoading: boolean;
  setGoogleBusy: (busy: boolean) => void;
}) {
  return (
    <div className="w-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-700/80 hover:border-slate-500 transition-all [&>div]:w-full [&>div>iframe]:!w-full min-h-[40px] opacity-95 hover:opacity-100">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (credentialResponse.credential) {
            setGoogleBusy(true);
            try {
              await onGoogleSuccess(credentialResponse.credential);
            } catch (err: any) {
              toast.error(err?.message || "Google sign in failed");
            } finally {
              setGoogleBusy(false);
            }
          }
        }}
        onError={() => {
          toast.error("Google sign in failed");
          setGoogleBusy(false);
        }}
        theme="filled_black"
        shape="rectangular"
        size="medium"
        width="100%"
        text="signin"
      />
    </div>
  );
}

export function SocialAuthButtons({
  onGoogleSuccess,
  onGithubSuccess,
  isLoading = false,
}: SocialAuthButtonsProps) {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [githubBusy, setGithubBusy] = useState(false);

  const triggerGithubLogin = async () => {
    setGithubBusy(true);
    try {
      await onGithubSuccess({ username: "github-developer" });
    } catch (err: any) {
      toast.error(err?.message || "GitHub sign in failed");
    } finally {
      setGithubBusy(false);
    }
  };

  const isAnyLoading = isLoading || googleBusy || githubBusy;

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <GoogleClientButton
        onGoogleSuccess={onGoogleSuccess}
        isAnyLoading={isAnyLoading}
        setGoogleBusy={setGoogleBusy}
      />

      <button
        type="button"
        onClick={triggerGithubLogin}
        disabled={isAnyLoading}
        className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-white rounded-xl py-2.5 px-3 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-lg cursor-pointer disabled:opacity-50"
      >
        {githubBusy ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
        ) : (
          <GithubIcon className="w-4 h-4 shrink-0 fill-current text-white" />
        )}
        <span className="text-white font-medium">GitHub</span>
      </button>
    </div>
  );
}
