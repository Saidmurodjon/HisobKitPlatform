import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton.js";
import { TelegramAuthButton } from "@/components/auth/TelegramAuthButton.js";
import { Input } from "@/components/ui/input.js";
import { useJoinGroupByInviteCodeMutation } from "@/store/api/groupsApi.js";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button.js";

export function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupByInviteCodeMutation();

  useEffect(() => {
    // Check URL for invite code
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) setInviteCode(code);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleJoinWithCode() {
    if (!inviteCode.trim() || !isAuthenticated) return;
    try {
      await joinGroup(inviteCode.trim()).unwrap();
      navigate("/dashboard");
    } catch {
      setAuthError("Invalid invite code");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Hero */}
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl mx-auto shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
            H
          </div>
          <h1 className="text-3xl font-black mt-4 text-foreground">
            HisobKit
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Smart expense sharing for groups.<br />
            Split bills, track debts, settle up.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-lg">
          <h2 className="text-base font-semibold text-foreground mb-5 text-center">
            Sign in to get started
          </h2>

          <div className="space-y-3">
            <TelegramAuthButton onError={setAuthError} />

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <GoogleAuthButton onError={setAuthError} />
          </div>

          {authError && (
            <div className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive text-center">
              {authError}
            </div>
          )}
        </div>

        {/* Join by invite code */}
        {inviteCode && (
          <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">You have a group invite!</span>
            </div>
            <Input
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mb-2"
            />
            <Button className="w-full" size="sm" loading={isJoining} onClick={handleJoinWithCode}>
              Join Group After Login
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <a href="#" className="underline hover:text-foreground">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
