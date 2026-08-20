import { useState, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAnalyticsSummary, AnalyticsSummary } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

const truncate = (s: string, n = 22) => s && s.length > n ? s.slice(0, n) + "…" : s;

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const summary = await getAnalyticsSummary(days);
        if (!mounted) return;
        if (summary) setData(summary);
        else setError("Failed to load analytics. Ensure the analytics_events table exists in Supabase.");
      } catch (err: any) {
        if (mounted) setError(err.message || "An unexpected error occurred");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [days, navigate]);

  if (loading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading analytics…</span>
      </div>
    );
  }

  const topResource = data?.topResources[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Full-site monitoring — pages, searches, downloads, revenue events.</p>
        </div>
        <Select value={days.toString()} onValueChange={(val) => setDays(Number(val))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <StatCard label="Page Views" value={data?.totalViews ?? 0} sub={`In last ${days} days`} />
        <StatCard label="Downloads" value={data?.totalDownloads ?? 0} sub="Resources downloaded" />
        <StatCard label="Searches" value={data?.totalSearches ?? 0} sub="Search queries made" />
        <StatCard label="Enrollments" value={data?.totalEnrollments ?? 0} sub="Training / event signups" />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <StatCard label="Purchases" value={data?.totalPurchases ?? 0} sub="Store + paid events" />
        <StatCard label="Unique Visitors" value={data?.uniqueVisitors ?? 0} sub="Logged-in users tracked" />
        <StatCard label="Total Events" value={data?.totalEvents ?? 0} sub="All tracked interactions" />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-base font-bold truncate"
              title={topResource?.name || topResource?.target_id || "None"}
            >
              {topResource?.name || "None"}
            </div>
            {topResource && (
              <p className="text-xs text-muted-foreground mt-0.5">{topResource.count} downloads</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Daily page views, downloads, and other events over the last {days} days</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.eventsByDate || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOther" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }} />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="#3b82f6" fillOpacity={1} fill="url(#gViews)" />
                <Area type="monotone" dataKey="downloads" name="Downloads" stroke="#10b981" fillOpacity={1} fill="url(#gDownloads)" />
                <Area type="monotone" dataKey="other" name="Revenue Events" stroke="#f59e0b" fillOpacity={1} fill="url(#gOther)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages — shows demand & interest</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-4 pb-4">
            {(data?.topPages?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No page view data yet. Views will appear automatically as users browse.</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data!.topPages.map(p => ({ ...p, label: truncate(p.page, 20) }))}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                      formatter={(v: any, _: any, p: any) => [v, p.payload.page]}
                    />
                    <Bar dataKey="count" name="Views" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Searches — demand intelligence */}
        <Card>
          <CardHeader>
            <CardTitle>Search Demand</CardTitle>
            <CardDescription>What users are searching for — use this to grow revenue</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {(data?.topSearches?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No search queries tracked yet. Add <code>trackSearch()</code> to your search inputs.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {data!.topSearches.map((s, i) => (
                  <div key={s.query} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                      <span className="text-sm font-medium truncate">{s.query}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{s.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Top Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Top Resources</CardTitle>
            <CardDescription>Most downloaded — shows what content drives value</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-4 pb-4">
            {(data?.topResources?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No downloads tracked yet.</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data!.topResources.map(r => ({ ...r, label: truncate(r.name || r.target_id, 20) }))}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 11 }} />
                    <RechartsTooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }} />
                    <Bar dataKey="count" name="Downloads" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown — revenue map */}
        <Card>
          <CardHeader>
            <CardTitle>Section Breakdown</CardTitle>
            <CardDescription>Activity by site section — identify your top revenue areas</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {(data?.categoryBreakdown?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data!.categoryBreakdown}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data!.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
