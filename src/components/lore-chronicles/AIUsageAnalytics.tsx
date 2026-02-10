import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Coins, Cpu, TrendingUp } from "lucide-react";

interface UsageStats {
  totalCalls: number;
  totalTokens: number;
  cachedHits: number;
  uniqueSessions: number;
  byModel: { model: string; count: number; tokens: number }[];
  byDay: { date: string; calls: number; tokens: number }[];
}

interface AIUsageAnalyticsProps {
  campaignId: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 36%)", "hsl(38 92% 50%)"];

export const AIUsageAnalytics = ({ campaignId }: AIUsageAnalyticsProps) => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchStats();
  }, [campaignId, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);

    // Get sessions for this campaign
    const { data: sessions } = await supabase
      .from("rp_sessions")
      .select("id")
      .eq("campaign_id", campaignId);

    const sessionIds = (sessions || []).map(s => s.id);

    if (sessionIds.length === 0) {
      setStats({
        totalCalls: 0,
        totalTokens: 0,
        cachedHits: 0,
        uniqueSessions: 0,
        byModel: [],
        byDay: [],
      });
      setLoading(false);
      return;
    }

    const { data: logs } = await supabase
      .from("rp_ai_narration_log")
      .select("*")
      .in("session_id", sessionIds)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (!logs || logs.length === 0) {
      setStats({
        totalCalls: 0,
        totalTokens: 0,
        cachedHits: 0,
        uniqueSessions: 0,
        byModel: [],
        byDay: [],
      });
      setLoading(false);
      return;
    }

    // Aggregate
    const modelMap = new Map<string, { count: number; tokens: number }>();
    const dayMap = new Map<string, { calls: number; tokens: number }>();
    const sessionSet = new Set<string>();
    let totalTokens = 0;
    let cachedHits = 0;

    for (const log of logs) {
      const tokens = (log.tokens_used as number) || 0;
      totalTokens += tokens;
      sessionSet.add(log.session_id);

      if (tokens === 0) cachedHits++;

      const model = (log.model_used as string) || "unknown";
      const existing = modelMap.get(model) || { count: 0, tokens: 0 };
      modelMap.set(model, { count: existing.count + 1, tokens: existing.tokens + tokens });

      const day = new Date(log.created_at).toISOString().split("T")[0];
      const dayStats = dayMap.get(day) || { calls: 0, tokens: 0 };
      dayMap.set(day, { calls: dayStats.calls + 1, tokens: dayStats.tokens + tokens });
    }

    setStats({
      totalCalls: logs.length,
      totalTokens,
      cachedHits,
      uniqueSessions: sessionSet.size,
      byModel: Array.from(modelMap.entries()).map(([model, data]) => ({
        model: model.split("/").pop() || model,
        ...data,
      })),
      byDay: Array.from(dayMap.entries()).map(([date, data]) => ({
        date: date.slice(5), // MM-DD
        ...data,
      })),
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading usage analytics...
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const cacheRate = stats.totalCalls > 0 ? ((stats.cachedHits / stats.totalCalls) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            AI Usage Analytics
          </h3>
          <p className="text-sm text-muted-foreground">Monitor AI narration usage and costs</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Cpu className="h-4 w-4" />
              <span className="text-xs">Total Calls</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-xs">Tokens Used</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Cache Rate</span>
            </div>
            <p className="text-2xl font-bold">{cacheRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Sessions</span>
            </div>
            <p className="text-2xl font-bold">{stats.uniqueSessions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.byDay.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byDay}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="API Calls" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {stats.byModel.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byModel.map((m, i) => (
                <div key={m.model} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-medium">{m.model}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{m.count} calls</span>
                    <Badge variant="outline">{m.tokens.toLocaleString()} tokens</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.totalCalls === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No AI usage data yet for this campaign.</p>
            <p className="text-sm text-muted-foreground mt-1">Data will appear once players interact with AI narration.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
