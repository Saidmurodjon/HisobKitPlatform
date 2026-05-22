import { useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { useLoginWithTelegramMutation } from "@/store/api/authApi.js";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: { user?: { id: number; first_name: string } };
        ready: () => void;
        expand: () => void;
        colorScheme: "light" | "dark";
      };
    };
  }
}

interface TelegramAuthButtonProps {
  onError?: (msg: string) => void;
}

export function TelegramAuthButton({ onError }: TelegramAuthButtonProps) {
  const [loginWithTelegram, { isLoading }] = useLoginWithTelegramMutation();

  const isTelegramWebApp =
    typeof window !== "undefined" &&
    !!window.Telegram?.WebApp?.initData &&
    window.Telegram.WebApp.initData.length > 0;

  // Auto-login when opened inside Telegram WebApp.
  const attemptAutoLogin = useCallback(async () => {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) return;
    try {
      window.Telegram!.WebApp!.ready();
      window.Telegram!.WebApp!.expand();
      await loginWithTelegram({ initData }).unwrap();
    } catch {
      onError?.("Telegram authentication failed. Please try again.");
    }
  }, [loginWithTelegram, onError]);

  useEffect(() => {
    if (isTelegramWebApp) {
      void attemptAutoLogin();
    }
  }, [isTelegramWebApp, attemptAutoLogin]);

  if (isTelegramWebApp) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-[#0088cc]/10 px-4 py-3 text-sm text-[#0088cc]">
        <Send className="h-4 w-4 animate-pulse" />
        <span>Authenticating via Telegram...</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full h-11 gap-3 border-[#0088cc]/30 hover:border-[#0088cc] hover:bg-[#0088cc]/5"
      loading={isLoading}
      onClick={attemptAutoLogin}
    >
      <Send className="h-4 w-4 text-[#0088cc]" />
      <span className="font-medium">Continue with Telegram</span>
    </Button>
  );
}
