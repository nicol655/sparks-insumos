import { PageHeading } from "@/components/shell/page-heading";
import { ajustesGroups, ajustesHeading, type AjustesField } from "@/content/ajustes";

function Field({ field, id }: { field: AjustesField; id: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-text-meta font-mono text-[9.5px] tracking-[0.14em] uppercase">
        {field.label}
      </label>
      {field.control === "text" ? (
        <input
          id={id}
          readOnly
          defaultValue={field.value}
          className="border-ink/28 text-ink border-0 border-b bg-transparent px-0.5 py-2.5 text-[14.5px] outline-none"
        />
      ) : null}
      {field.control === "select" ? (
        <select
          id={id}
          defaultValue={field.value}
          className="border-ink/28 text-ink border-0 border-b bg-transparent px-0.5 py-2.5 text-[14.5px]"
        >
          <option value={field.value}>{field.value}</option>
        </select>
      ) : null}
      {field.control === "toggle" ? (
        <button id={id} type="button" aria-pressed="true" className="flex items-center gap-2.5 py-2 text-left">
          <span className="border-ink bg-ink flex h-5 w-[38px] items-center justify-end rounded-full border p-0.5">
            <span className="bg-canvas block size-3.5 rounded-full" />
          </span>
          <span className="text-[13px]">{field.value}</span>
        </button>
      ) : null}
      {field.hint ? <p className="text-text-meta text-[11.5px] font-light">{field.hint}</p> : null}
    </div>
  );
}

export function AjustesView() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeading
        kicker={ajustesHeading.kicker}
        title={ajustesHeading.title}
        action={
          <button
            type="button"
            className="bg-ink text-canvas border-ink border px-5 py-3 text-[11px] tracking-[0.16em] uppercase"
          >
            {ajustesHeading.save}
          </button>
        }
      />
      {ajustesGroups.map((group, groupIndex) => (
        <section key={group.title} className="flex flex-col gap-4">
          <div className="border-ink/14 flex flex-col gap-1 border-b pb-2.5">
            <h2 className="text-[10.5px] font-medium tracking-[0.16em] uppercase">{group.title}</h2>
            <p className="text-text-meta text-[13px] font-light">{group.sub}</p>
          </div>
          <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            {group.fields.map((field, fieldIndex) => (
              <Field key={field.label} field={field} id={`ajuste-${groupIndex}-${fieldIndex}`} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
