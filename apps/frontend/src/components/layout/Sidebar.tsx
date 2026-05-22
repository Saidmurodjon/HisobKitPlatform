import { Home, Plus, Users, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.js";
import { Button } from "@/components/ui/button.js";
import { useGetGroupsQuery, useCreateGroupMutation } from "@/store/api/groupsApi.js";
import { getInitials, GROUP_TYPE_LABELS } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.js";
import { Input } from "@/components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.js";
import type { GroupType } from "@/types/index.js";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data } = useGetGroupsQuery();
  const [createGroup, { isLoading }] = useCreateGroupMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("OTHER");

  const groups = data?.data ?? [];

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;
    await createGroup({ name: groupName.trim(), type: groupType }).unwrap();
    setGroupName("");
    setGroupType("OTHER");
    setIsCreateOpen(false);
  }

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-4">
      {/* Nav links */}
      <nav className="px-3 space-y-1 mb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-border mb-4" />

      {/* Groups section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Groups
            </span>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-1">
          {groups.length === 0 ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="w-full flex flex-col items-center justify-center py-6 rounded-xl border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm gap-1"
            >
              <Plus className="h-5 w-5" />
              <span>Create a group</span>
            </button>
          ) : (
            groups.map((group) => (
              <NavLink
                key={group.id}
                to={`/groups/${group.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )
                }
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                    {getInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium leading-tight">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.members.length} · {GROUP_TYPE_LABELS[group.type]}
                  </p>
                </div>
              </NavLink>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex w-60 flex-col border-r bg-background min-h-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative z-10 w-72 bg-background border-r h-full shadow-2xl animate-slide-in-right">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <Input
              label="Group Name"
              placeholder="Weekend trip, Flat 42..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select value={groupType} onValueChange={(v) => setGroupType(v as GroupType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(GROUP_TYPE_LABELS) as [GroupType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
