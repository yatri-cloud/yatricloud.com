import { useState, useEffect } from "react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar
} from "recharts";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAnalyticsSummary, AnalyticsSummary } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

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
        if (summary) {
          setData(summary);
        } else {
          setError("Failed to load analytics data. Ensure you have run the Supabase SQL setup script.");
        }
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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  // Truncate long resource names for the Y-axis label
  const truncate = (str: string, n: number) =>
    str && str.length > n ? str.slice(0, n) + "…" : str;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor platform usage, downloads, and clicks.</p>
        </div>

        <Select value={days.toString()} onValueChange={(val) => setDays(Number(val))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
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
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Cards — no icons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Tracked in last {days} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalDownloads || 0}</div>
            <p className="text-xs text-muted-foreground">Resources downloaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground">Monitored page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-xl font-bold truncate"
              title={data?.topResources[0]?.name || data?.topResources[0]?.target_id || "None"}
            >
              {data?.topResources[0]?.name || "None"}
            </div>
            <p className="text-xs text-muted-foreground">Most downloaded resource</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
        {/* Timeline Chart */}
        <Card className="col-span-1 md:col-span-4">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>Daily downloads and views over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.eventsByDate || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Area type="monotone" dataKey="downloads" name="Downloads" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDownloads)" />
                  <Area type="monotone" dataKey="views" name="Views" stroke="#10b981" fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Resources Bar Chart — fixed left margin so labels don't overflow */}
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>Top Resources</CardTitle>
            <CardDescription>Most downloaded resources</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(data?.topResources || []).map(r => ({
                    ...r,
                    label: truncate(r.name || r.target_id, 18),
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    formatter={(_: any, __: any, props: any) => [props.payload.count, props.payload.name || props.payload.target_id]}
                  />
                  <Bar dataKey="count" name="Downloads" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
