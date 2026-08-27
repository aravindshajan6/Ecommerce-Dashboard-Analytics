import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/ui/index.js';
import { useSalesTimeseries, useSummary } from '../hooks/useApi.js';
import { useRange } from '../lib/range.jsx';
import { fmtDate } from '../lib/format.js';
import { useIntervalForRange } from '../components/charts/useInterval.js';
import { downloadCsv } from '../components/charts/csv.js';
import RevenueAreaChart from '../components/charts/RevenueAreaChart.jsx';
import ChannelDonut from '../components/charts/ChannelDonut.jsx';
import TopProductsBars from '../components/charts/TopProductsBars.jsx';
import CategoryTreemap from '../components/charts/CategoryTreemap.jsx';
import HourHeatmap from '../components/charts/HourHeatmap.jsx';
import LiveOrderFeed from '../components/feed/LiveOrderFeed.jsx';
import KpiGrid from '../components/overview/KpiGrid.jsx';
import InsightsCard from '../components/overview/InsightsCard.jsx';
import TopCustomersMini from '../components/overview/TopCustomersMini.jsx';
import PodiumCard from '../components/overview/PodiumCard.jsx';

const CSV_COLUMNS = ['period', 'label', 'revenue', 'orders', 'units', 'aov', 'newCustomers'];

export default function Overview() {
  const qc = useQueryClient();
  const fetching = useIsFetching();
  const { range, rangeLabel } = useRange();
  const summary = useSummary();
  const [interval, setInterval] = useIntervalForRange();
  const ts = useSalesTimeseries(interval);

  const description = summary.data
    ? `${fmtDate(summary.data.from)} – ${fmtDate(summary.data.to)} · ${rangeLabel}`
    : `Performance for the selected range · ${rangeLabel}`;

  return (
    <>
      <PageHeader
        eyebrow="Command center" title="Overview" description={description}
        actions={
          <>
            <button className="btn-ghost" onClick={() => qc.invalidateQueries()} aria-label="Refresh all data">
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} /> Refresh
            </button>
            <button className="btn-ghost" disabled={!ts.data?.length} onClick={() => downloadCsv(`nova-revenue-${range}-${interval}.csv`, ts.data, CSV_COLUMNS)}>
              <Download size={14} /> Export CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <KpiGrid query={summary} />

        <RevenueAreaChart className="col-span-12 xl:col-span-8" interval={interval} onInterval={setInterval} height={400} />
        <InsightsCard className="col-span-12 xl:col-span-4" />

        <LiveOrderFeed className="col-span-12 lg:col-span-4" />
        <ChannelDonut className="col-span-12 lg:col-span-4" />
        <TopProductsBars className="col-span-12 lg:col-span-4" />

        <CategoryTreemap className="col-span-12 lg:col-span-7" />
        <TopCustomersMini className="col-span-12 lg:col-span-5" />

        <PodiumCard className="col-span-12 lg:col-span-5" />
        <HourHeatmap className="col-span-12 lg:col-span-7" />
      </div>
    </>
  );
}
