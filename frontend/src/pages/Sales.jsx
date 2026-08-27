import { useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader, Segmented } from '../components/ui/index.js';
import { useSalesTimeseries, useSummary } from '../hooks/useApi.js';
import { INTERVALS, useRange } from '../lib/range.jsx';
import { useIntervalForRange } from '../components/charts/useInterval.js';
import { growthInterval } from '../components/charts/series.js';
import { downloadCsv } from '../components/charts/csv.js';
import KpiGrid from '../components/overview/KpiGrid.jsx';
import RevenueAreaChart from '../components/charts/RevenueAreaChart.jsx';
import GrowthChart from '../components/charts/GrowthChart.jsx';
import ForecastChart from '../components/charts/ForecastChart.jsx';
import ChannelDonut from '../components/charts/ChannelDonut.jsx';
import CategoryTreemap from '../components/charts/CategoryTreemap.jsx';
import HourHeatmap from '../components/charts/HourHeatmap.jsx';
import AovTrend from '../components/charts/AovTrend.jsx';
import BestTimes from '../components/overview/BestTimes.jsx';

const CSV_COLUMNS = ['period', 'label', 'revenue', 'orders', 'units', 'aov', 'newCustomers'];
const KPI_KEYS = ['revenue', 'orders', 'aov', 'unitsSold'];

export default function Sales() {
  const { range, rangeLabel } = useRange();
  const summary = useSummary();
  const [interval, setInterval] = useIntervalForRange();
  const [months, setMonths] = useState(6);
  const ts = useSalesTimeseries(interval);

  return (
    <>
      <PageHeader
        eyebrow="Revenue intelligence" title="Sales" description={`Revenue, growth and forecast · ${rangeLabel}`}
        actions={
          <>
            <Segmented options={INTERVALS} value={interval} onChange={setInterval} />
            <button className="btn-ghost" disabled={!ts.data?.length} onClick={() => downloadCsv(`nova-sales-${range}-${interval}.csv`, ts.data, CSV_COLUMNS)}>
              <Download size={14} /> Export CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <KpiGrid query={summary} keys={KPI_KEYS} span="col-span-6 xl:col-span-3" />

        <RevenueAreaChart className="col-span-12" interval={interval} movingAvg height={340} subtitle="Revenue, orders and a 7-bucket moving average" />

        <GrowthChart className="col-span-12 lg:col-span-7" interval={growthInterval(interval)} />
        <ForecastChart className="col-span-12 lg:col-span-5" months={months} onMonths={setMonths} />

        <ChannelDonut className="col-span-12 lg:col-span-4" />
        <CategoryTreemap className="col-span-12 lg:col-span-8" height={340} />

        <HourHeatmap className="col-span-12 lg:col-span-7" />
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
          <AovTrend interval={interval} className="flex-1" />
          <BestTimes />
        </div>
      </div>
    </>
  );
}
