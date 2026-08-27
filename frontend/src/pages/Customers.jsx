import { useState } from 'react';
import { Download, Receipt, Repeat, UserPlus, Users } from 'lucide-react';
import { PageHeader, Segmented, KpiCard, GlassCard, ErrorState } from '../components/ui/index.js';
import NewVsRepeat from '../components/customers/NewVsRepeat.jsx';
import TopCustomers from '../components/customers/TopCustomers.jsx';
import CohortHeatmap from '../components/customers/CohortHeatmap.jsx';
import LtvByCohort from '../components/customers/LtvByCohort.jsx';
import RfmPanel from '../components/customers/RfmPanel.jsx';
import CustomersTable from '../components/customers/CustomersTable.jsx';
import { useCustomersParams } from '../components/customers/useCustomersParams.js';
import { CUSTOMER_CSV_COLUMNS, downloadCsv, toCsv } from '../components/customers/exportCsv.js';
import { useCustomers, useSummary } from '../hooks/useApi.js';
import { INTERVALS } from '../lib/range.jsx';
import { fmtMoney, fmtNumber, fmtPct } from '../lib/format.js';

const KPI = 'col-span-12 sm:col-span-6 xl:col-span-3';

export default function Customers() {
  const [interval, setIntervalValue] = useState('monthly');
  const summary = useSummary();
  const kpis = summary.data?.kpis;

  // Same params/query key as CustomersTable → react-query dedupes; gives the header the current page rows.
  const { params, page } = useCustomersParams();
  const customers = useCustomers(params);
  const pageRows = customers.data?.rows ?? [];
  const exportCsv = () => {
    if (!pageRows.length) return;
    downloadCsv(`nova-customers-page-${page}.csv`, toCsv(pageRows, CUSTOMER_CSV_COLUMNS));
  };

  return (
    <>
      <PageHeader
        eyebrow="Retention & value"
        title="Customers"
        description="Cohorts, RFM segments and lifetime value."
        actions={
          <>
            <Segmented options={INTERVALS} value={interval} onChange={setIntervalValue} />
            <button className="btn-ghost" onClick={exportCsv} disabled={!pageRows.length} title="Download the current table page as CSV">
              <Download size={14} /> Export CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {summary.isError ? (
          <GlassCard className="col-span-12 min-h-[132px]"><ErrorState error={summary.error} retry={summary.refetch} /></GlassCard>
        ) : (
          <>
            <KpiCard className={KPI} label="Customers" icon={Users} kpi={kpis?.customers} loading={summary.isPending} format={(v) => fmtNumber(v)} tone="primary" />
            <KpiCard className={KPI} label="New customers" icon={UserPlus} kpi={kpis?.newCustomers} loading={summary.isPending} format={(v) => fmtNumber(v)} tone="teal" />
            <KpiCard className={KPI} label="Repeat rate" icon={Repeat} kpi={kpis?.repeatRate} loading={summary.isPending} format={(v) => fmtPct(v * 100)} tone="pink" />
            <KpiCard className={KPI} label="Avg. order value" icon={Receipt} kpi={kpis?.aov} loading={summary.isPending} format={(v) => fmtMoney(v)} tone="violet" />
          </>
        )}

        <NewVsRepeat interval={interval} className="col-span-12 xl:col-span-8" />
        <TopCustomers className="col-span-12 xl:col-span-4" />

        <CohortHeatmap className="col-span-12" />

        <LtvByCohort className="col-span-12 lg:col-span-5" />
        <RfmPanel className="col-span-12 lg:col-span-7" />

        <GlassCard title="All customers" subtitle="Search, sort and page through every customer" icon={Users} className="col-span-12 min-h-[520px]">
          <CustomersTable />
        </GlassCard>
      </div>
    </>
  );
}
