import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { GroupLedger } from "@/components/dashboard/GroupLedger.js";
import { useAuth } from "@/hooks/useAuth.js";

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!groupId || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Group not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground -ml-1 mb-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <GroupLedger groupId={groupId} currentUserId={user.id} />
    </div>
  );
}
