import { PageHeading } from "@/components/shell/page-heading";
import {
  bars,
  kpis,
  lowStock,
  lowStockHeading,
  messages,
  recentOrders,
  resumenHeading,
  sales,
  type KpiTone,
} from "@/content/resumen";

const deltaClass: Record<KpiTone, string> = {
  success: "text-success",
  gold: "text-accent-gold",
  meta: "text-text-meta",
};

export function ResumenView() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeading kicker={resumenHeading.kicker} title={resumenHeading.title} />
      <div className="border-border-hairline bg-border-hairline grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-px border">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-canvas flex flex-col gap-2.5 px-6 py-5">
            <span className="text-text-meta font-mono text-[9.5px] tracking-[0.16em] uppercase">{kpi.label}</span>
            <span className="font-display text-[clamp(30px,2.6vw,40px)] leading-none">{kpi.value}</span>
            <span className={`font-mono text-[10.5px] ${deltaClass[kpi.tone]}`}>{kpi.delta}</span>
          </div>
        ))}
      </div>
      <section className="border-border-hairline flex flex-col gap-5 border p-5 lg:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-text-meta font-mono text-[9.5px] tracking-[0.16em] uppercase">{sales.label}</span>
            <span className="font-display text-[32px] leading-none">{sales.total}</span>
          </div>
          <div className="border-border-strong flex border">
            {sales.ranges.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={range === sales.activeRange}
                className={`font-mono px-3.5 py-2 text-[10.5px] tracking-[0.1em] ${
                  range === sales.activeRange ? "bg-ink text-canvas" : "text-ink bg-transparent"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="border-ink flex h-[200px] items-end gap-1.5 border-b pt-2.5">
          {bars.map((bar) => (
            <div
              key={bar.title}
              title={bar.title}
              style={{ height: bar.height }}
              className={`min-w-[3px] flex-1 ${bar.current ? "bg-accent-gold" : "bg-ink"}`}
            />
          ))}
        </div>
        <div className="text-text-meta -mt-3 flex justify-between font-mono text-[9.5px]">
          {sales.axis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section className="border-border-hairline border">
          <div className="border-border-hairline flex items-baseline justify-between border-b px-5 py-4">
            <h2 className="font-display text-[23px]">Pedidos recientes</h2>
            <a href="/pedidos" className="border-ink border-b pb-0.5 text-[10.5px] tracking-[0.16em] uppercase">
              Ver todos
            </a>
          </div>
          <ul>
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="border-ink/10 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3.5 border-b px-5 py-3.5"
              >
                <span className="font-mono text-[11px]">{order.id}</span>
                <span className="truncate text-[13.5px]">{order.customer}</span>
                <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase">{order.status}</span>
                <span className="text-right text-[14px] whitespace-nowrap">{order.total}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-7">
          <section className="border-border-hairline border">
            <div className="border-border-hairline flex items-baseline justify-between border-b px-5 py-4">
              <h2 className="font-display text-[23px]">Stock bajo</h2>
              <span className="text-accent-gold font-mono text-[10px] tracking-[0.12em]">{lowStockHeading}</span>
            </div>
            <ul>
              {lowStock.map((item) => (
                <li
                  key={item.name}
                  className="border-ink/10 flex items-center justify-between gap-3.5 border-b px-5 py-3.5"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13.5px]">{item.name}</span>
                    <span className="text-text-meta font-mono text-[9.5px] tracking-[0.12em] uppercase">
                      {item.brand}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-[11px] whitespace-nowrap ${item.stock === "AGOTADO" ? "text-danger" : "text-accent-gold"}`}
                  >
                    {item.stock}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="border-border-hairline border">
            <div className="border-border-hairline flex items-baseline justify-between border-b px-5 py-4">
              <h2 className="font-display text-[23px]">Consultas sin responder</h2>
              <a href="/mensajes" className="border-ink border-b pb-0.5 text-[10.5px] tracking-[0.16em] uppercase">
                Bandeja
              </a>
            </div>
            <ul>
              {messages.map((message) => (
                <li key={message.subject} className="border-ink/10 flex flex-col gap-1 border-b px-5 py-3.5">
                  <span className="flex justify-between gap-3">
                    <span className="text-[13.5px]">{message.from}</span>
                    <span className="text-text-meta font-mono text-[10px] whitespace-nowrap">{message.date}</span>
                  </span>
                  <span className="text-text-muted text-[12.5px] font-light">{message.subject}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
