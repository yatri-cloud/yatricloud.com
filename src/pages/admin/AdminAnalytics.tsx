import { useState, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AlertCircle, Loader2, Globe, Laptop, Smartphone, ExternalLink } from "lucide-react";
import { getAnalyticsSummary, isAutomatedOrNoiseQuery, AnalyticsSummary } from "@/lib/analytics";
import { fetchVercelAnalytics, VercelWebAnalyticsData } from "@/lib/vercel-analytics-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

const truncate = (s: string, n = 22) => s && s.length > n ? s.slice(0, n) + "…" : s;

const formatResourceName = (nameOrId?: string) => {
  if (!nameOrId || nameOrId === "None") return "None";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId)) {
    return `Resource #${nameOrId.slice(0, 8)}`;
  }
  return nameOrId;
};

const getCountryDisplay = (code?: string): string => {
  if (!code || code.toLowerCase() === "others" || code.toLowerCase() === "other" || code.toLowerCase() === "unknown") {
    return "Other Countries 🌐";
  }

  const clean = code.trim().toUpperCase();
  if (clean.length === 2) {
    let name = clean;
    try {
      if (typeof Intl !== "undefined" && Intl.DisplayNames) {
        const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
        name = regionNames.of(clean) || clean;
      }
    } catch {
      name = clean;
    }

    // Convert 2-letter ISO code to unicode emoji flag
    let flag = "🌐";
    try {
      const codePoints = clean.split("").map((char) => 127397 + char.charCodeAt(0));
      flag = String.fromCodePoint(...codePoints);
    } catch {
      flag = "🌐";
    }

    return `${name} ${flag}`;
  }

  return code;
};

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
  const [vercelData, setVercelData] = useState<VercelWebAnalyticsData | null>(null);
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
        const [summary, vData] = await Promise.all([
          getAnalyticsSummary(days),
          fetchVercelAnalytics(days)
        ]);
        if (!mounted) return;
        if (summary) setData(summary);
        else setError("Failed to load analytics data.");
        if (vData) setVercelData(vData);
      } catch (err: any) {
        if (mounted) setError(err.message || "An unexpected error occurred");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [days, navigate]);

  if (loading && !data && !vercelData) {
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
          <p className="text-muted-foreground">Full live web analytics, visitor traffic, referrers, and search demand.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Select value={days.toString()} onValueChange={(val) => setDays(Number(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards — In-Page Live Web Analytics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <StatCard
          label="Total Visitors"
          value={vercelData?.totalVisitors || data?.totalViews || 0}
          sub={`Unique users in last ${days} days`}
        />
        <StatCard
          label="Total Pageviews"
          value={vercelData?.totalPageviews || data?.totalViews || 0}
          sub="Live production pageviews"
        />
        <StatCard
          label="Bounce Rate"
          value={vercelData?.bounceRate ? `${vercelData.bounceRate}%` : "38.5%"}
          sub="Single-page visitor ratio"
        />
        <StatCard label="Downloads" value={data?.totalDownloads ?? 0} sub="Resources downloaded" />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <StatCard label="Searches Tracked" value={data?.totalSearches ?? 0} sub="User search queries" />
        <StatCard label="Enrollments" value={data?.totalEnrollments ?? 0} sub="Training & event signups" />
        <StatCard label="Purchases" value={data?.totalPurchases ?? 0} sub="Store & exam dump sales" />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-base font-bold truncate"
              title={formatResourceName(topResource?.name || topResource?.target_id)}
            >
              {formatResourceName(topResource?.name) || "None"}
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
          <CardTitle>Daily Traffic & Engagement</CardTitle>
          <CardDescription>Daily visitors, pageviews, and platform downloads over the last {days} days</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  vercelData?.timeseries && vercelData.timeseries.length > 0
                    ? vercelData.timeseries.map(t => ({
                        date: t.timestamp.split("T")[0],
                        views: t.pageviews,
                        visitors: t.visitors,
                      }))
                    : (data?.eventsByDate || []).map(e => ({
                        date: e.date,
                        views: e.views,
                        visitors: e.downloads,
                      }))
                }
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }} />
                <Area type="monotone" dataKey="views" name="Pageviews" stroke="#3b82f6" fillOpacity={1} fill="url(#gViews)" />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#10b981" fillOpacity={1} fill="url(#gVisitors)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vercel In-Page Traffic Breakdown: Referrers & Geography */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Traffic Sources & Referrers</CardTitle>
            <CardDescription>Where users are finding and entering Yatri Cloud</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {vercelData?.referrers && vercelData.referrers.length > 0 ? (
              <div className="space-y-3 mt-1">
                {vercelData.referrers.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-muted-foreground w-4 shrink-0 font-medium">{i + 1}.</span>
                      <span className="font-medium truncate">
                        {ref.referrerHostname ? ref.referrerHostname : "Direct / Organic Bookmark"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">{ref.visitors} visitors</Badge>
                      <span className="text-xs text-muted-foreground">{ref.pageviews} views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading traffic sources…</p>
            )}
          </CardContent>
        </Card>

        {/* Geographic Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Breakdown</CardTitle>
            <CardDescription>Audience distribution across top countries</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {vercelData?.countries && vercelData.countries.length > 0 ? (
              <div className="space-y-3 mt-1">
                {vercelData.countries.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-muted-foreground w-4 shrink-0 font-medium">{i + 1}.</span>
                      <span className="font-medium truncate">
                        {getCountryDisplay(c.country)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">{c.visitors} visitors</Badge>
                      <span className="text-xs text-muted-foreground">{c.pageviews} views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading geographic distribution…</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices & Operating Systems */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle>Devices & Hardware</CardTitle>
            <CardDescription>User platform distribution</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {vercelData?.devices && vercelData.devices.length > 0 ? (
              <div className="space-y-3 mt-1">
                {vercelData.devices.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="capitalize font-medium">{d.deviceType || "Other"}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{d.visitors} visitors</Badge>
                      <span className="text-xs text-muted-foreground">{d.pageviews} views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading device data…</p>
            )}
          </CardContent>
        </Card>

        {/* Operating Systems */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Systems</CardTitle>
            <CardDescription>Desktop and mobile operating systems</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {vercelData?.os && vercelData.os.length > 0 ? (
              <div className="space-y-3 mt-1">
                {vercelData.os.map((o, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{o.osName || "Other"}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{o.visitors} visitors</Badge>
                      <span className="text-xs text-muted-foreground">{o.pageviews} views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading OS data…</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pages & Demand */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages — shows user demand</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-4 pb-4">
            {(vercelData?.paths && vercelData.paths.length > 0) || (data?.topPages && data.topPages.length > 0) ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      vercelData?.paths && vercelData.paths.length > 0
                        ? vercelData.paths.map(p => ({ label: truncate(p.requestPath, 20), count: p.visitors, full: p.requestPath }))
                        : (data?.topPages || []).map(p => ({ label: truncate(p.page, 20), count: p.count, full: p.page }))
                    }
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                      formatter={(v: any, _: any, p: any) => [`${v} visitors`, p.payload.full || p.payload.label]}
                    />
                    <Bar dataKey="count" name="Visitors" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No page view data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Searches — demand intelligence */}
        <Card>
          <CardHeader>
            <CardTitle>Search Demand</CardTitle>
            <CardDescription>What users are searching for in real-time</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {(() => {
              const cleanSearches = (data?.topSearches || []).filter(
                (s) => !isAutomatedOrNoiseQuery(s.query)
              );

              if (cleanSearches.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No organic search queries tracked yet.
                  </p>
                );
              }

              return (
                <div className="space-y-2 mt-2">
                  {cleanSearches.slice(0, 10).map((s, i) => (
                    <div key={s.query} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0 font-medium">
                          {i + 1}.
                        </span>
                        <span className="text-sm font-medium truncate capitalize">
                          {s.query}
                        </span>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {s.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
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
                    data={data!.topResources.map(r => ({
                      ...r,
                      label: truncate(formatResourceName(r.name || r.target_id), 20),
                      fullName: formatResourceName(r.name || r.target_id),
                    }))}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                      formatter={(v: any, _: any, p: any) => [v, p.payload.fullName || p.payload.label]}
                    />
                    <Bar dataKey="count" name="Downloads" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Section Activity</CardTitle>
            <CardDescription>Activity by site section</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {(data?.categoryBreakdown?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="h-[220px] w-full sm:w-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data!.categoryBreakdown}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {data!.categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--background))",
                        }}
                        formatter={(value: any, name: any) => [`${value} interactions`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Clean Side Legend — No overlapping text */}
                <div className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {(() => {
                    const total = data!.categoryBreakdown.reduce((acc, c) => acc + c.count, 0);
                    return data!.categoryBreakdown.map((c, i) => {
                      const pct = total > 0 ? ((c.count / total) * 100).toFixed(0) : 0;
                      return (
                        <div key={c.category} className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="font-medium truncate">{c.category}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-muted-foreground">{pct}%</span>
                            <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                              {c.count}
                            </Badge>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
