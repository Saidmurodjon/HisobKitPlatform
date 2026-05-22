import { Users2, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.js";
import { Badge } from "@/components/ui/badge.js";
import { useGetGroupsQuery } from "@/store/api/groupsApi.js";
import { useAuth } from "@/hooks/useAuth.js";
import { formatRelativeTime, getInitials, GROUP_TYPE_LABELS } from "@/lib/utils.js";

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useGetGroupsQuery();
  const groups = data?.data ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Here's what's happening with your groups.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Users2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{groups.length}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {groups.reduce((sum, g) => sum + (g._count?.expenses ?? 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Auth via</p>
              <p className="text-sm font-semibold text-foreground capitalize">
                {user?.authProvider.toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Groups</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl">
            <Users2 className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No groups yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create a group to start splitting expenses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => {
              const myRole = group.members.find((m) => m.userId === user?.id)?.role;
              return (
                <Link key={group.id} to={`/groups/${group.id}`}>
                  <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="text-sm bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                              {getInitials(group.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {GROUP_TYPE_LABELS[group.type]}
                            </p>
                          </div>
                        </div>
                        {myRole === "OWNER" && (
                          <Badge variant="info" className="shrink-0 text-[10px]">Owner</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1.5">
                          {group.members.slice(0, 4).map((m) => (
                            <Avatar key={m.userId} className="h-6 w-6 ring-1 ring-background">
                              <AvatarImage src={m.user.avatar ?? undefined} />
                              <AvatarFallback className="text-[9px]">{getInitials(m.user.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {group.members.length > 4 && (
                            <div className="h-6 w-6 rounded-full bg-muted ring-1 ring-background flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                              +{group.members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {group._count?.expenses ?? 0} expenses · {formatRelativeTime(group.updatedAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
