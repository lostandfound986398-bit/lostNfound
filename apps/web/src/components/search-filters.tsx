"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SearchResultsSkeleton } from "./search-results-skeleton";

export type FoundItemFilters = {
  q: string;
  category: string;
  location: string;
  dateFrom: string;
  dateTo: string;
};
export function SearchFilters({
  filters,
  options,
  resultCount,
  children,
}: {
  filters: FoundItemFilters;
  options: { categories: string[]; locations: string[] } | null;
  resultCount: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [draft, setDraft] = useState(filters);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const count =
    Number(Boolean(filters.category)) +
    Number(Boolean(filters.location)) +
    Number(Boolean(filters.dateFrom || filters.dateTo));
  useEffect(() => {
    setQuery(filters.q);
    setDraft(filters);
  }, [filters]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  function navigate(next: FoundItemFilters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next))
      if (value.trim()) params.set(key, value.trim());
    search.current?.blur();
    startTransition(() =>
      router.push(`/portal/search${params.size ? `?${params}` : ""}`, {
        scroll: false,
      }),
    );
  }
  function close() {
    dialog.current?.close();
  }
  function showFilters() {
    setDraft({ ...filters, q: query });
    dialog.current?.showModal();
    setOpen(true);
  }
  function dateLabel(value: string) {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        });
  }
  const chips = [
    ...(filters.q ? [{ label: `Search: ${filters.q}`, keys: ["q"] }] : []),
    ...(filters.category
      ? [{ label: filters.category, keys: ["category"] }]
      : []),
    ...(filters.location
      ? [{ label: filters.location, keys: ["location"] }]
      : []),
    ...(filters.dateFrom || filters.dateTo
      ? [
          {
            label:
              filters.dateFrom && filters.dateTo
                ? `${dateLabel(filters.dateFrom)} – ${dateLabel(filters.dateTo)}`
                : filters.dateFrom
                  ? `From ${dateLabel(filters.dateFrom)}`
                  : `Until ${dateLabel(filters.dateTo)}`,
            keys: ["dateFrom", "dateTo"],
          },
        ]
      : []),
  ];
  return (
    <>
      <form
        className="found-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ ...filters, q: query });
        }}
        role="search"
      >
        <label htmlFor="found-search">What did you lose?</label>
        <div className="found-search-field">
          <Search size={21} aria-hidden="true" />
          <input
            id="found-search"
            ref={search}
            type="search"
            name="q"
            enterKeyHint="search"
            placeholder="Try wallet, phone, or keys"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Search found items"
          >
            <Search size={20} aria-hidden="true" />
          </button>
        </div>
      </form>
      <div className="found-search-toolbar">
        <button
          className="filter-trigger"
          type="button"
          ref={trigger}
          onClick={showFilters}
          disabled={pending}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="found-filter-sheet"
        >
          <SlidersHorizontal size={18} aria-hidden="true" /> Filters
          {count > 0 && <span> · {count}</span>}
        </button>
        <p role="status" aria-live="polite">
          {pending
            ? "Searching…"
            : resultCount === null
              ? "Results unavailable"
              : `${resultCount} item${resultCount === 1 ? "" : "s"} found`}
        </p>
      </div>
      {chips.length > 0 && (
        <div
          className="found-filter-chips"
          aria-label="Active search and filters"
        >
          {chips.map((chip) => (
            <button
              type="button"
              disabled={pending}
              key={chip.keys.join()}
              aria-label={`Remove ${chip.label}`}
              onClick={() => {
                const next = { ...filters };
                chip.keys.forEach((key) => {
                  next[key as keyof FoundItemFilters] = "";
                });
                navigate(next);
              }}
            >
              {chip.label}
              <X size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <div className="found-search-results" aria-busy={pending}>
        {pending ? <SearchResultsSkeleton /> : children}
      </div>
      <dialog
        className="filter-sheet"
        id="found-filter-sheet"
        ref={dialog}
        aria-labelledby="filter-sheet-title"
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close();
        }}
      >
        <span className="filter-sheet__handle" aria-hidden="true" />
        <div className="filter-sheet__heading">
          <h2 id="filter-sheet-title">Filters</h2>
          <button
            type="button"
            className="filter-sheet__clear"
            disabled={
              !draft.category &&
              !draft.location &&
              !draft.dateFrom &&
              !draft.dateTo
            }
            onClick={() =>
              setDraft({
                ...draft,
                category: "",
                location: "",
                dateFrom: "",
                dateTo: "",
              })
            }
          >
            Clear all
          </button>
          <button
            className="filter-sheet__close"
            type="button"
            onClick={close}
            aria-label="Close filters"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            close();
            navigate({ ...draft, q: query });
          }}
        >
          <div className="filter-sheet__fields">
            <label>
              Category
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value })
                }
              >
                <option value="">All categories</option>
                {Array.from(
                  new Set([
                    ...(options?.categories ?? []),
                    ...(filters.category ? [filters.category] : []),
                  ]),
                ).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select
                value={draft.location}
                onChange={(event) =>
                  setDraft({ ...draft, location: event.target.value })
                }
              >
                <option value="">All locations</option>
                {Array.from(
                  new Set([
                    ...(options?.locations ?? []),
                    ...(filters.location ? [filters.location] : []),
                  ]),
                ).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Date found</legend>
              <div className="filter-sheet__dates">
                <label>
                  From
                  <input
                    type="date"
                    value={draft.dateFrom}
                    max={draft.dateTo || undefined}
                    onChange={(event) =>
                      setDraft({ ...draft, dateFrom: event.target.value })
                    }
                  />
                </label>
                <label>
                  To
                  <input
                    type="date"
                    value={draft.dateTo}
                    min={draft.dateFrom || undefined}
                    onChange={(event) =>
                      setDraft({ ...draft, dateTo: event.target.value })
                    }
                  />
                </label>
              </div>
            </fieldset>
            {!options && (
              <p className="muted">
                Category and location options are unavailable. You can still
                search by name or date.
              </p>
            )}
          </div>
          <div className="filter-sheet__footer">
            <button
              className="button button--primary button--full"
              type="submit"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
