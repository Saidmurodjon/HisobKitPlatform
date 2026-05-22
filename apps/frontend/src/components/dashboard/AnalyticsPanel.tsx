import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { useGetGroupAnalyticsQuery } from "@/store/api/expensesApi.js";
import { formatCurrency, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/utils.js";
import { useState } from "react";
import { cn } from "@/lib/utils.js";

interface AnalyticsPanelProps {
  groupId: string;
}

const PERIODS = [
  { value: "week" as const, label: "7 days" },
  { value: "month" as const, label: "30 days" },
  { value: "year" as const, label: "1 year" },
];

export function AnalyticsPanel({ groupId }: AnalyticsPanelProps) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const { data, isLoading } = useGetGroupAnalyticsQuery({ groupId, period });

  const analytics = data?.data;

  const pieData = analytics
    ? Object.entries(analytics.byCategory)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: CATEGORY_LABELS[key] ?? key,
          value,
          color: CATEGORY_COLORS[key] ?? "#6b7280",
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const barData = pieData.map((d) => ({ name: d.name.split(" ")[0], amount: d.value, fill: d.color }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!analytics || pieData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">No expense data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add some expenses to see analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        <div className="flex rounded-lg border overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm font-semibold text-foreground">
          Total: {formatCurrency(analytics.totalSpent)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs">{value}</span>}
                  iconSize={10}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
