"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ExternalLink, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { api, errorMessage, get, getPaginated, send, toApiError } from "@/lib/api";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { toast } from "@/store/toast";
import { Button } from "../common/Button";
import { Alert, EmptyState, ErrorState, Skeleton } from "../common/Feedback";
import { Modal } from "../common/Modal";
import { Pagination } from "../common/Pagination";
import { getPath, setPath, type FieldDef, type ResourceDef } from "./resources";

type Doc = Record<string, unknown> & { _id: string };

export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append("images", f));
  try {
    const { data } = await api.post("/admin/uploads", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 });
    return (data.data as { url: string }[]).map((u) => u.url);
  } catch (err) {
    throw toApiError(err);
  }
}

function cell(item: Doc, key: string, format?: string) {
  const v = getPath(item, key);
  if (format === "price") return typeof v === "number" ? formatPrice(v) : "—";
  if (format === "bool") return <span className={cn("inline-block size-2.5 rounded-full", v ? "bg-emerald-500" : "bg-ink-300")} aria-label={v ? "Yes" : "No"} />;
  if (format === "date") return v ? formatDate(String(v)) : "—";
  if (format === "count") return Array.isArray(v) ? v.length : 0;
  if (format === "stars") return "★".repeat(Number(v) || 0);
  if (format === "ref") return v && typeof v === "object" ? String((v as Record<string, unknown>).name ?? (v as Record<string, unknown>).title ?? "") : String(v ?? "—");
  if (Array.isArray(v)) return v.join(", ");
  return v === undefined || v === null || v === "" ? "—" : String(v);
}

/** Converts a document into editable form state (refs → ids, dates → inputs, JSON → text). */
function toForm(def: ResourceDef, doc: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    let v = getPath(doc, f.name);
    if (f.kind === "ref" && v && typeof v === "object") v = (v as Doc)._id;
    if (f.kind === "date" && v) v = String(v).slice(0, 10);
    if (f.kind === "json") v = JSON.stringify(v ?? (f.name.match(/s$/) ? [] : {}), null, 2);
    if (f.kind === "list") v = Array.isArray(v) ? v.join("\n") : "";
    if (f.kind === "images") v = Array.isArray(v) ? v : [];
    if (f.kind === "select" && f.multiple) v = Array.isArray(v) ? v : [];
    if (f.kind === "boolean") v = !!v;
    out[f.name] = v ?? "";
  }
  return out;
}

function fromForm(def: ResourceDef, form: Record<string, unknown>): { body: Record<string, unknown>; error?: string } {
  const body: Record<string, unknown> = {};
  for (const f of def.fields) {
    let v = form[f.name];
    if (f.kind === "number") v = v === "" || v === undefined ? undefined : Number(v);
    if (f.kind === "list") v = String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (f.kind === "json") {
      try {
        v = String(v ?? "").trim() ? JSON.parse(String(v)) : undefined;
      } catch {
        return { body, error: `${f.label}: invalid JSON` };
      }
    }
    if (f.kind === "date" || f.kind === "text" || f.kind === "textarea" || f.kind === "ref" || f.kind === "image" || (f.kind === "select" && !f.multiple)) {
      if (v === "") v = f.name === "slug" ? undefined : f.required ? "" : undefined;
    }
    if (f.required && (v === "" || v === undefined || (Array.isArray(v) && !v.length))) return { body, error: `${f.label} is required` };
    if (v !== undefined) setPath(body, f.name, v);
  }
  return { body };
}

function RefSelect({ field, value, onChange, id }: { field: FieldDef; value: string; onChange: (v: string) => void; id: string }) {
  const { data } = useAsync(() => get<Doc[]>(`/admin/${field.ref!.resource}`, { limit: 100 }), [field.ref!.resource]);
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select…</option>
      {data?.map((d) => <option key={d._id} value={d._id}>{String(d[field.ref!.labelKey])}</option>)}
    </select>
  );
}

function ImagesField({ value, onChange, single }: { value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls = await uploadImages(files);
      onChange(single ? urls.slice(0, 1) : [...value, ...urls]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <div key={src + i} className="relative size-20 overflow-hidden rounded-lg bg-ink-100">
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-ink-900/70 text-white" aria-label="Remove image"><X className="size-3" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={cn("inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100", busy && "opacity-60")}>
          <ImagePlus className="size-4" />{busy ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" multiple={!single} className="sr-only" onChange={(e) => upload(e.target.files)} disabled={busy} />
        </label>
        <input className="field h-10 min-w-0 flex-1" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button size="sm" variant="outline" className="h-10" onClick={() => { if (url.trim()) { onChange(single ? [url.trim()] : [...value, url.trim()]); setUrl(""); } }}>Add</Button>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = `f-${field.name}`;
  const label = (
    <label htmlFor={id} className="label">{field.label}{field.required && <span className="text-coral-500"> *</span>}</label>
  );
  let control: React.ReactNode;
  switch (field.kind) {
    case "textarea":
      control = <textarea id={id} rows={4} className="field h-auto py-2.5" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "list":
      control = <textarea id={id} rows={4} className="field h-auto py-2.5" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "json":
      control = <textarea id={id} rows={8} spellCheck={false} className="field h-auto py-2.5 font-mono text-xs" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "number":
      control = <input id={id} type="number" step="any" className="field" value={value === undefined || value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "date":
      control = <input id={id} type="date" className="field" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "boolean":
      return (
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-brand-600" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}
        </label>
      );
    case "select":
      if (field.multiple) {
        const arr = (value as string[]) ?? [];
        control = (
          <div className="flex flex-wrap gap-2" id={id}>
            {field.options!.map((o) => (
              <button key={o.value} type="button" aria-pressed={arr.includes(o.value)} onClick={() => onChange(arr.includes(o.value) ? arr.filter((x) => x !== o.value) : [...arr, o.value])} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", arr.includes(o.value) ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-700")}>{o.label}</button>
            ))}
          </div>
        );
      } else {
        control = (
          <select id={id} className="field" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {field.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      }
      break;
    case "ref":
      control = <RefSelect field={field} id={id} value={String(value ?? "")} onChange={onChange} />;
      break;
    case "images":
      control = <ImagesField value={(value as string[]) ?? []} onChange={onChange} />;
      break;
    case "image":
      control = <ImagesField single value={value ? [String(value)] : []} onChange={(v) => onChange(v[0] ?? "")} />;
      break;
    default:
      control = <input id={id} className="field" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <div className={cn(field.full && "sm:col-span-2")}>
      {label}
      {control}
      {field.hint && <p className="mt-1 text-xs break-all text-ink-500">{field.hint}</p>}
    </div>
  );
}

export function ResourceManager({ def }: { def: ResourceDef }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const debouncedQ = useDebounce(q, 300);
  const params = useMemo(() => ({ page, limit: 20, q: debouncedQ || undefined, ...filters }), [page, debouncedQ, filters]);
  const list = useAsync(() => getPaginated<Doc>(`/admin/${def.path}`, params), [def.path, JSON.stringify(params)]);
  const [editing, setEditing] = useState<Doc | "new" | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Doc | null>(null);


  function open(item: Doc | "new") {
    setEditing(item);
    setFormError(null);
    setForm(toForm(def, item === "new" ? (def.defaults ?? {}) : item));
  }

  async function save() {
    const { body, error } = fromForm(def, form);
    if (error) return setFormError(error);
    setSaving(true);
    setFormError(null);
    try {
      const res = editing === "new" ? await send<Doc>("post", `/admin/${def.path}`, body) : await send<Doc>("put", `/admin/${def.path}/${(editing as Doc)._id}`, body);
      toast.success(res.message);
      setEditing(null);
      list.reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Doc) {
    try {
      const res = await send<null>("delete", `/admin/${def.path}/${item._id}`);
      toast.success(res.message);
      setConfirmDelete(null);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{def.title}</h1>
          {list.data && <p className="text-sm text-ink-500">{list.data.meta.total} total</p>}
        </div>
        <Button onClick={() => open("new")}><Plus className="size-4" />New {def.singular}</Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search</span>
          <Search className="absolute top-3 left-3 size-4 text-ink-400" />
          <input className="field h-10 pl-9" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </label>
        {def.filters?.map((f) => (
          <select key={f.key} aria-label={f.label} className="field h-10 w-auto" value={filters[f.key] ?? ""} onChange={(e) => { setPage(1); setFilters((cur) => ({ ...cur, [f.key]: e.target.value || (undefined as unknown as string) })); }}>
            <option value="">{f.label}: all</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading && !list.data ? (
        <Skeleton className="h-64" />
      ) : !list.data?.items.length ? (
        <EmptyState title={`No ${def.title.toLowerCase()} found`} />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-ink-100 bg-sand-50 text-xs text-ink-500 uppercase">
                <tr>{def.columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}<th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {list.data.items.map((item) => {
                  const url = def.publicUrl?.(item);
                  return (
                    <tr key={item._id} className="hover:bg-sand-50/60">
                      {def.columns.map((c, i) => <td key={c.key} className={cn("px-4 py-2.5", i === 0 && "font-semibold")}>{cell(item, c.key, c.format)}</td>)}
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          {url && <a href={url} target="_blank" rel="noopener" className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100" aria-label="View on site"><ExternalLink className="size-4" /></a>}
                          <button type="button" onClick={() => open(item)} className="grid size-8 place-items-center rounded-lg text-ink-600 hover:bg-ink-100" aria-label="Edit"><Pencil className="size-4" /></button>
                          <button type="button" onClick={() => setConfirmDelete(item)} className="grid size-8 place-items-center rounded-lg text-coral-600 hover:bg-coral-50" aria-label="Delete"><Trash2 className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? `New ${def.singular}` : `Edit ${def.singular}`} className="max-w-3xl">
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="grid gap-4 sm:grid-cols-2">
          {def.fields.map((f) => <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => setForm((cur) => ({ ...cur, [f.name]: v }))} />)}
          {formError && <Alert tone="error" className="sm:col-span-2">{formError}</Alert>}
          <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 bg-white pt-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={`Delete ${def.singular}?`}>
        <p className="text-sm text-ink-600">This permanently removes <strong>{confirmDelete ? String(confirmDelete.name ?? confirmDelete.title ?? confirmDelete.code ?? confirmDelete.country ?? confirmDelete._id) : ""}</strong>. This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDelete && remove(confirmDelete)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
