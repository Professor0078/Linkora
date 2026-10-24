import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { fetchUserAnalytics } from '../../lib/firestoreService';
import {
  AnalyticsDailyRecord,
  BioLink,
  LinkEventRecord,
  PlanTier,
  ProfileConfig,
} from '../../types/linkora';
import { PlatformIcon } from '../PlatformIcon';

interface AnalyticsPanelProps {
  uid: string;
  profile: ProfileConfig;
  links: BioLink[];
  plan: PlanTier;
}

function getLastNDaysKeys(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  uid,
  profile,
  links,
  plan,
}) => {
  const [rangeDays, setRangeDays] = useState<7 | 14>(7);
  const [daily, setDaily] = useState<AnalyticsDailyRecord[]>([]);
  const [events, setEvents] = useState<LinkEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchUserAnalytics(uid);
      setDaily(data.daily);
      setEvents(data.recentEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [uid]);

  const dateKeys = useMemo(() => getLastNDaysKeys(rangeDays), [rangeDays]);

  const series = useMemo(() => {
    const map = new Map<string, AnalyticsDailyRecord>();
    daily.forEach((d) => map.set(d.dateKey, d));
    return dateKeys.map((key) => ({
      dateKey: key,
      shortDate: key.slice(5),
      views: map.get(key)?.views || 0,
      clicks: map.get(key)?.clicks || 0,
    }));
  }, [daily, dateKeys]);

  const maxDailyVal = Math.max(1, ...series.map((s) => Math.max(s.views, s.clicks)));

  const ctr =
    profile.totalViews > 0
      ? `${Math.min(100, (profile.totalClicks / profile.totalViews) * 100).toFixed(1)}%`
      : '—';

  const rankedLinks = useMemo(
    () => [...links].sort((a, b) => b.clicks - a.clicks),
    [links]
  );

  const deviceCounts = useMemo(() => {
    const counts = { mobile: 0, tablet: 0, desktop: 0 };
    events.forEach((ev) => {
      if (ev.deviceType in counts) counts[ev.deviceType] += 1;
    });
    return counts;
  }, [events]);

  const referrerCounts = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((ev) => {
      const host = ev.referrerHost || 'direct';
      map.set(host, (map.get(host) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Header & Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Page Traffic &amp; Link Performance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Privacy-conscious event counts with 60-second session deduplication. Metrics are
            directional indicators rather than invasive ad-network tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setRangeDays(7)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                rangeDays === 7
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setRangeDays(14)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                rangeDays === 14
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Last 14 Days
            </button>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            aria-label="Refresh analytics"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Profile Visits</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {profile.totalViews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Link Clicks</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {profile.totalClicks.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Click-Through Rate</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {ctr}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Links</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {links.filter((l) => l.enabled).length}
          </p>
        </div>
      </div>

      {/* Daily Trend SVG Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Visits &amp; Clicks ({rangeDays}-Day Window)
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
              Visits
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              Clicks
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${series.length * 56} 180`}
              className="w-full min-w-[420px] h-48 overflow-visible"
              role="img"
              aria-label="Daily visits and clicks bar chart"
            >
              {series.map((day, idx) => {
                const xBase = idx * 56 + 10;
                const chartHeight = 130;
                const viewH = Math.max(2, Math.round((day.views / maxDailyVal) * chartHeight));
                const clickH = Math.max(2, Math.round((day.clicks / maxDailyVal) * chartHeight));
                return (
                  <g key={day.dateKey}>
                    <rect
                      x={xBase}
                      y={140 - viewH}
                      width={16}
                      height={viewH}
                      rx={4}
                      className="fill-indigo-600"
                    >
                      <title>{`${day.dateKey}: ${day.views} visits`}</title>
                    </rect>
                    <rect
                      x={xBase + 19}
                      y={140 - clickH}
                      width={16}
                      height={clickH}
                      rx={4}
                      className="fill-emerald-500"
                    >
                      <title>{`${day.dateKey}: ${day.clicks} clicks`}</title>
                    </rect>
                    <text
                      x={xBase + 17}
                      y={162}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px] font-mono"
                    >
                      {day.shortDate}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Most Popular Links Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clicks per Link</h3>
        </div>
        {rankedLinks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <BarChart3 className="w-5 h-5 mx-auto mb-2 opacity-60" />
            Add links to start measuring individual link clicks.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rankedLinks.map((lnk) => (
              <div
                key={lnk.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlatformIcon
                    platform={lnk.platform}
                    className="w-4 h-4 text-slate-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {lnk.title}
                    </p>
                    <p className="text-xs font-mono text-slate-400 truncate max-w-sm">{lnk.url}</p>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">{lnk.clicks}</span>
                  <span className="text-xs text-slate-500 ml-1">clicks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device & Referrer Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Recent Device Categories
          </h3>
          <div className="space-y-3 text-xs">
            {(['mobile', 'desktop', 'tablet'] as const).map((dev) => (
              <div key={dev} className="flex items-center justify-between">
                <span className="capitalize text-slate-600 dark:text-slate-300">{dev}</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                  {deviceCounts[dev]} events
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Referrer Hosts</h3>
            {plan === 'free' && (
              <span className="text-[11px] text-slate-400">Recent 150 events sample</span>
            )}
          </div>
          {referrerCounts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No referrer events recorded yet. Share your public URL to start seeing traffic
              sources.
            </p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {referrerCounts.map(([host, count]) => (
                <div key={host} className="flex items-center justify-between">
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate">
                    {host}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
