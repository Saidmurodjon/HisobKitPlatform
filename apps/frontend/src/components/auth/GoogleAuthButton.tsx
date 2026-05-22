import { useEffect, useRef, useCallback } from "react";
import { useLoginWithGoogleMutation } from "@/store/api/authApi.js";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onError?: (msg: string) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function GoogleAuthButton({ onError }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loginWithGoogle] = useLoginWithGoogleMutation();

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        await loginWithGoogle({ idToken: response.credential }).unwrap();
      } catch {
        onError?.("Google login failed. Please try again.");
      }
    },
    [loginWithGoogle, onError]
  );

  useEffect(() => {
    function initGoogle() {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        width: "100%",
        text: "continue_with",
      });
    }

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    }
  }, [handleCredentialResponse]);

  return (
    <div className="w-full flex justify-center">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
