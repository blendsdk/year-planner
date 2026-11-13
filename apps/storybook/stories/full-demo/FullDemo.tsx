import {
  type PlannerContextMenuRequest,
  YearPlanner,
  type YearPlannerHandle,
  type YearPlannerThemeName,
  yearPlannerPresets,
} from "@blendsdk/react-year-planner";
import {
  addDays,
  type DateKey,
  diffDays,
  type PlannerFilter,
  type PlannerItem,
  type PlannerSelection,
} from "@blendsdk/year-planner-core";
import {
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO_YEAR, LAYERS, type ProjectMeta, SEED_ITEMS } from "./seed";
import { clearDemo, loadDemo, saveDemo } from "./storage";
import "./full-demo.css";

const THEME_NAMES = Object.keys(yearPlannerPresets) as YearPlannerThemeName[];
const MATERIAL_THEME_NAMES = THEME_NAMES.filter((name) => name.startsWith("material-"));
const FLUENT_THEME_NAMES = THEME_NAMES.filter((name) => name.startsWith("fluent-"));
const UTILITY_THEME_NAMES = THEME_NAMES.filter(
  (name) => !name.startsWith("material-") && !name.startsWith("fluent-"),
);

/** Turns a preset id into a short option label, for example `fluent-marigold`. */
function presetLabel(name: string): string {
  const label = name.replace(/^(material|fluent)-/, "").replace(/-/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** The three project statuses used by the demo. */
type ProjectStatus = "planned" | "active" | "complete";

/** Form values for creating or editing a project. */
interface ProjectForm {
  title: string;
  client: string;
  type: string;
  crew: string;
  budget: string;
  endDate: string;
  status: ProjectStatus;
}

/** Dialog target; create starts at a clicked date, edit keeps the item. */
type DialogTarget = { kind: "create"; startDate: DateKey } | { kind: "edit"; item: PlannerItem };

const EMPTY_SELECTION: PlannerSelection = { dates: [], items: [] };

/**
 * A host tall enough for the comfortable profile and three 24 px lanes.
 *
 * The fit still owns the geometry; a taller measured host keeps all columns
 * visible and lets the grid scroll vertically instead of collapsing projects
 * into overflow.
 */
const ALL_LANES_HEIGHT = 1296;
const EMPTY_META: ProjectMeta = { client: "—", crew: "—", budget: 0 };
const STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  active: "Active",
  complete: "Complete",
};
const MONEY = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const MONEY_COMPACT = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});
const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Reads construction metadata from an item without trusting its shape. */
function metaOf(item: PlannerItem): ProjectMeta {
  const value = item.metadata;
  if (typeof value !== "object" || value === null) return EMPTY_META;
  const record = value as Record<string, unknown>;
  return {
    client: typeof record.client === "string" ? record.client : "—",
    crew: typeof record.crew === "string" ? record.crew : "—",
    budget: typeof record.budget === "number" ? record.budget : 0,
  };
}

/** Returns the status of an item, defaulting to planned. */
function statusOf(item: PlannerItem): ProjectStatus {
  return item.status === "active" || item.status === "complete" ? item.status : "planned";
}

/** Returns the first day of an item. */
function startOf(item: PlannerItem): DateKey {
  return item.period.kind === "all-day" ? item.period.startDate : item.period.start.slice(0, 10);
}

/** Returns the inclusive last day of an all-day item. */
function lastDayOf(item: PlannerItem): DateKey {
  if (item.period.kind !== "all-day") return startOf(item);
  return addDays(item.period.endDateExclusive, -1);
}

/** Formats an ISO date for the compact demo labels. */
function formatDate(date: DateKey): string {
  return DATE.format(new Date(`${date}T00:00:00.000Z`));
}

/** Formats a stored timestamp as a local time. */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Returns a unique item id. */
function newId(): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return `project-${cryptoObject.randomUUID()}`;
  }
  return `project-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Keeps a fixed menu inside the viewport. */
function menuPosition(x: number, y: number): { left: number; top: number } {
  if (typeof window === "undefined") return { left: x, top: y };
  return {
    left: Math.min(x, Math.max(8, window.innerWidth - 240)),
    top: Math.min(y, Math.max(8, window.innerHeight - 260)),
  };
}

/**
 * Full construction planning demo.
 *
 * Hosts a real planner with a seed plan for Northwind Construction. Projects
 * are allocated with a double-click, edited from the details panel or a
 * host-owned context menu, and persisted to localStorage. Undo, redo, reset and
 * print use the public component handle and print configuration.
 */
export function FullDemo(): ReactNode {
  const [loaded] = useState(() => loadDemo());
  const [seedItems, setSeedItems] = useState<PlannerItem[]>(loaded.items);
  const [generation, setGeneration] = useState(0);
  const [items, setItems] = useState<PlannerItem[]>(loaded.items);
  const [selection, setSelection] = useState<PlannerSelection>(EMPTY_SELECTION);
  const [filter, setFilter] = useState<PlannerFilter>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProjectStatus>("");
  const [theme, setTheme] = useState<YearPlannerThemeName>("material-teal");
  const [layout, setLayout] = useState<"lanes" | "fit">("lanes");
  const [dialog, setDialog] = useState<DialogTarget>();
  const [form, setForm] = useState<ProjectForm>({
    title: "",
    client: "",
    type: "build",
    crew: "Crew A",
    budget: "",
    endDate: "",
    status: "planned",
  });
  const [formError, setFormError] = useState<string>();
  const [menu, setMenu] = useState<PlannerContextMenuRequest>();
  const [saveState, setSaveState] = useState(
    loaded.found
      ? `Loaded locally${loaded.savedAt ? ` · ${formatTime(loaded.savedAt)}` : ""}`
      : "Not saved yet",
  );
  const [toast, setToast] = useState<string>();
  const plannerRef = useRef<YearPlannerHandle>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const projects = items.filter((item) => item.kind !== "annotation");
    const active = projects.filter((item) => statusOf(item) === "active").length;
    const complete = projects.filter((item) => statusOf(item) === "complete").length;
    const days = projects.reduce(
      (total, item) =>
        total +
        (item.period.kind === "all-day"
          ? diffDays(item.period.startDate, item.period.endDateExclusive)
          : 0),
      0,
    );
    const crews = new Set(projects.map((item) => metaOf(item).crew).filter((crew) => crew !== "—"))
      .size;
    const budget = projects.reduce((total, item) => total + metaOf(item).budget, 0);
    return { projects: projects.length, active, complete, days, crews, budget };
  }, [items]);

  const selected = selection.items[0]
    ? items.find((item) => item.id === selection.items[0])
    : undefined;
  const selectedMeta = selected ? metaOf(selected) : EMPTY_META;
  const selectedStatus = selected ? statusOf(selected) : "planned";
  const menuItem =
    menu?.target.kind === "item"
      ? items.find((item) => item.id === menu.target.itemId)
      : menu?.target.kind === "annotation"
        ? items.find((item) => item.id === menu.target.annotationId)
        : undefined;
  const dialogStart = dialog
    ? dialog.kind === "create"
      ? dialog.startDate
      : startOf(dialog.item)
    : undefined;

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (dialog && !node.open) node.showModal();
    if (!dialog && node.open) node.close();
  }, [dialog]);

  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        menu.restoreFocus();
        setMenu(undefined);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [menu]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleItemsChange = useCallback((next: PlannerItem[]) => {
    setItems(next);
    if (saveDemo(next)) {
      setSaveState(`Saved locally · ${formatTime(new Date().toISOString())}`);
    } else {
      setSaveState("Local save unavailable");
    }
  }, []);

  const applyFilter = useCallback((nextSearch: string, nextStatus: "" | ProjectStatus) => {
    setSearch(nextSearch);
    setStatusFilter(nextStatus);
    setFilter({
      ...(nextSearch.trim() ? { search: nextSearch.trim() } : {}),
      ...(nextStatus ? { statuses: [nextStatus] } : {}),
    });
  }, []);

  const openCreate = (startDate: DateKey): void => {
    setForm({
      title: "",
      client: "",
      type: "build",
      crew: "Crew A",
      budget: "",
      endDate: addDays(startDate, 13),
      status: "planned",
    });
    setFormError(undefined);
    setDialog({ kind: "create", startDate });
  };

  const openEdit = (item: PlannerItem): void => {
    const meta = metaOf(item);
    setForm({
      title: item.title ?? "Project",
      client: meta.client === "—" ? "" : meta.client,
      type: item.layerId,
      crew: meta.crew === "—" ? "Crew A" : meta.crew,
      budget: meta.budget > 0 ? String(meta.budget) : "",
      endDate: lastDayOf(item),
      status: statusOf(item),
    });
    setFormError(undefined);
    setDialog({ kind: "edit", item });
  };

  const closeMenu = useCallback(
    (restoreFocus = true): void => {
      if (restoreFocus) menu?.restoreFocus();
      setMenu(undefined);
    },
    [menu],
  );

  const submitDialog = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!dialog) return;
    const startDate = dialogStart;
    if (!startDate) return;
    const title = form.title.trim();
    if (!title) {
      setFormError("Give the project a name.");
      return;
    }
    if (!form.endDate || form.endDate < startDate) {
      setFormError("The end date must be on or after the start date.");
      return;
    }
    const budget = Math.max(0, Number(form.budget) || 0);
    const metadata: ProjectMeta = {
      client: form.client.trim() || "—",
      crew: form.crew,
      budget,
    };
    const period = {
      kind: "all-day" as const,
      startDate,
      endDateExclusive: addDays(form.endDate, 1),
    };
    if (dialog.kind === "create") {
      const item: PlannerItem = {
        id: newId(),
        kind: "activity",
        layerId: form.type,
        period,
        title,
        status: form.status,
        version: 1,
        metadata,
      };
      plannerRef.current?.requestCommand({ type: "create", item });
      setToast(`${title} allocated`);
    } else {
      const current = items.find((item) => item.id === dialog.item.id);
      if (!current) {
        setFormError("This project is no longer available.");
        return;
      }
      plannerRef.current?.requestCommand({
        type: "update",
        itemId: current.id,
        patch: {
          title,
          layerId: form.type,
          period,
          status: form.status,
          metadata,
        },
        expectedVersion: current.version,
      });
      setToast(`${title} updated`);
    }
    setDialog(undefined);
    setFormError(undefined);
  };

  const deleteItem = (item: PlannerItem): void => {
    const current = items.find((entry) => entry.id === item.id);
    if (!current) return;
    plannerRef.current?.requestCommand({
      type: "delete",
      itemId: current.id,
      expectedVersion: current.version,
    });
    setToast(`${item.title ?? "Project"} deleted · Undo to restore`);
  };

  const duplicateItem = (item: PlannerItem): void => {
    if (item.period.kind !== "all-day") return;
    const copy: PlannerItem = {
      ...item,
      id: newId(),
      title: `${item.title ?? "Project"} (copy)`,
      status: "planned",
      version: 1,
      period: {
        kind: "all-day",
        startDate: addDays(item.period.startDate, 7),
        endDateExclusive: addDays(item.period.endDateExclusive, 7),
      },
      metadata: metaOf(item),
    };
    plannerRef.current?.requestCommand({ type: "create", item: copy });
    setToast(`${copy.title} allocated`);
  };

  const completeItem = (item: PlannerItem): void => {
    const current = items.find((entry) => entry.id === item.id);
    if (!current) return;
    plannerRef.current?.requestCommand({
      type: "update",
      itemId: current.id,
      patch: { status: "complete" },
      expectedVersion: current.version,
    });
    setToast(`${item.title ?? "Project"} marked complete`);
  };

  const resetDemo = (): void => {
    if (!window.confirm("Reset the demo plan to the seed projects?")) return;
    clearDemo();
    setSeedItems(SEED_ITEMS);
    setItems(SEED_ITEMS);
    setSelection(EMPTY_SELECTION);
    applyFilter("", "");
    setGeneration((value) => value + 1);
    setSaveState("Demo reset · not saved");
    setToast("Demo plan reset");
    setMenu(undefined);
    setDialog(undefined);
  };

  const runMenuAction = (action: () => void): void => {
    menu?.restoreFocus();
    setMenu(undefined);
    action();
  };

  const onGridDoubleClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
    // The planner's click handling targets the grid container, not the cell,
    // so resolve the cell from the elements under the pointer. Item proxies win
    // because a double-click on a project opens the inspector.
    const stack = event.currentTarget.ownerDocument.elementsFromPoint(event.clientX, event.clientY);
    if (stack.some((element) => element.closest("[data-item-id]"))) return;
    const cell = stack
      .map((element) => element.closest("[data-date]"))
      .find((element): element is HTMLElement => element instanceof HTMLElement);
    const date = cell?.getAttribute("data-date");
    if (!date) return;
    event.preventDefault();
    openCreate(date);
  };

  return (
    <div className="fd-root">
      <header className="fd-header fd-chrome">
        <div className="fd-brand">
          <span className="fd-mark" aria-hidden="true">
            N
          </span>
          <div>
            <strong>Northwind Construction</strong>
            <span>{DEMO_YEAR} build plan</span>
          </div>
        </div>
        <p className="fd-save" role="status">
          {saveState}
        </p>
        <div className="fd-actions">
          <button
            type="button"
            className="fd-button fd-button--primary"
            onClick={() => openCreate(`${DEMO_YEAR}-01-05`)}
          >
            New project
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={() => plannerRef.current?.requestUndo()}
          >
            Undo
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={() => plannerRef.current?.requestRedo()}
          >
            Redo
          </button>
          <button type="button" className="fd-button" onClick={() => window.print()}>
            Print A3
          </button>
          <button type="button" className="fd-button fd-button--quiet" onClick={resetDemo}>
            Reset demo
          </button>
        </div>
      </header>

      <section className="fd-kpis fd-chrome" aria-label="Plan summary">
        <div>
          <span>Active projects</span>
          <strong>{stats.active}</strong>
        </div>
        <div>
          <span>Projects</span>
          <strong>{stats.projects}</strong>
        </div>
        <div>
          <span>Allocated days</span>
          <strong>{stats.days.toLocaleString("en-GB")}</strong>
        </div>
        <div>
          <span>Crews engaged</span>
          <strong>{stats.crews}</strong>
        </div>
        <div>
          <span>Planned budget</span>
          <strong>{MONEY_COMPACT.format(stats.budget)}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{stats.complete}</strong>
        </div>
      </section>

      <div className="fd-toolbar fd-chrome">
        <label className="fd-search">
          <span className="fd-sr-only">Search projects</span>
          <input
            type="search"
            placeholder="Search projects…"
            value={search}
            onChange={(event) => applyFilter(event.target.value, statusFilter)}
          />
        </label>
        <label>
          <span className="fd-sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              applyFilter(
                search,
                event.target.value === "" ? "" : (event.target.value as ProjectStatus),
              )
            }
          >
            <option value="">All statuses</option>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
          </select>
        </label>
        <label>
          <span className="fd-sr-only">Theme</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as YearPlannerThemeName)}
          >
            <optgroup label="Material 2014">
              {MATERIAL_THEME_NAMES.map((name) => (
                <option key={name} value={name}>
                  {presetLabel(name)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Fluent UI v9">
              {FLUENT_THEME_NAMES.map((name) => (
                <option key={name} value={name}>
                  {presetLabel(name)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Utility">
              {UTILITY_THEME_NAMES.map((name) => (
                <option key={name} value={name}>
                  {presetLabel(name)}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>
          <span className="fd-sr-only">Layout</span>
          <select
            value={layout}
            onChange={(event) => setLayout(event.target.value === "fit" ? "fit" : "lanes")}
          >
            <option value="lanes">All lanes</option>
            <option value="fit">Fit to screen</option>
          </select>
        </label>
        <p className="fd-hint">
          Double-click a date to allocate · right-click a project to edit or delete
        </p>
      </div>

      <div className="fd-main">
        <section className="fd-grid" onDoubleClickCapture={onGridDoubleClick}>
          <div
            className="fd-grid-host"
            style={{ height: layout === "lanes" ? ALL_LANES_HEIGHT : "100%" }}
          >
            <YearPlanner
              key={generation}
              ref={plannerRef}
              year={DEMO_YEAR}
              layers={LAYERS}
              defaultItems={seedItems}
              activeLayerId="build"
              showInspector={false}
              interaction={{ confirmChange: () => true }}
              filter={filter}
              onItemsChange={handleItemsChange}
              onSelectionChange={setSelection}
              onContextMenuRequest={setMenu}
              onChangeRejected={(outcome) => {
                if (!outcome.accepted) {
                  setToast(outcome.diagnostics[0]?.message ?? "Command rejected");
                }
              }}
              onDiagnostic={(diagnostic) => {
                setToast(`${diagnostic.code}: ${diagnostic.message}`);
              }}
              display={{ theme, showISOWeekNumbers: true }}
              print={{ page: "A3", mode: "paginate" }}
              ariaLabel="Northwind Construction annual plan"
            />
          </div>
        </section>

        <aside className="fd-panel fd-chrome" aria-label="Project details">
          <h2>Project details</h2>
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <p className="fd-status" data-status={selectedStatus}>
                {selected.kind === "annotation" ? "Milestone" : STATUS_LABEL[selectedStatus]}
              </p>
              {selected.kind === "annotation" ? (
                <>
                  <p className="fd-muted">{formatDate(startOf(selected))}</p>
                  <button type="button" className="fd-button" onClick={() => deleteItem(selected)}>
                    Delete milestone
                  </button>
                </>
              ) : (
                <>
                  <dl className="fd-details">
                    <dt>Client</dt>
                    <dd>{selectedMeta.client}</dd>
                    <dt>Crew</dt>
                    <dd>{selectedMeta.crew}</dd>
                    <dt>Starts</dt>
                    <dd>{formatDate(startOf(selected))}</dd>
                    <dt>Ends</dt>
                    <dd>{formatDate(lastDayOf(selected))}</dd>
                    <dt>Budget</dt>
                    <dd>{MONEY.format(selectedMeta.budget)}</dd>
                  </dl>
                  <div className="fd-panel-actions">
                    <button
                      type="button"
                      className="fd-button fd-button--primary"
                      onClick={() => openEdit(selected)}
                    >
                      Edit project
                    </button>
                    <button
                      type="button"
                      className="fd-button"
                      onClick={() => duplicateItem(selected)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="fd-button"
                      onClick={() => completeItem(selected)}
                    >
                      Mark complete
                    </button>
                    <button
                      type="button"
                      className="fd-button fd-button--danger"
                      onClick={() => deleteItem(selected)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="fd-muted">
              Select a project to see its client, crew, dates and budget. Double-click an empty date
              to allocate a new project.
            </p>
          )}
        </aside>
      </div>

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Project actions"
          className="fd-menu"
          style={menuPosition(menu.clientX, menu.clientY)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
            }
          }}
        >
          <div role="presentation" className="fd-menu__head">
            {menuItem?.title ??
              (menu.target.kind === "date" ? formatDate(menu.target.date) : "Milestone")}
          </div>
          {menu.target.kind === "date" && (
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                runMenuAction(() =>
                  openCreate(menu.target.kind === "date" ? menu.target.date : `${DEMO_YEAR}-01-05`),
                )
              }
            >
              New project here
            </button>
          )}
          {menuItem && menuItem.kind !== "annotation" && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => runMenuAction(() => openEdit(menuItem))}
              >
                Edit project
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runMenuAction(() => duplicateItem(menuItem))}
              >
                Duplicate project
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runMenuAction(() => completeItem(menuItem))}
              >
                Mark complete
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runMenuAction(() => deleteItem(menuItem))}
              >
                Delete project
              </button>
            </>
          )}
          {menuItem?.kind === "annotation" && (
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(() => deleteItem(menuItem))}
            >
              Delete milestone
            </button>
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="fd-dialog"
        aria-labelledby="fd-dialog-title"
        onClose={() => setDialog(undefined)}
      >
        {dialog && (
          <form onSubmit={submitDialog} className="fd-form">
            <h2 id="fd-dialog-title">
              {dialog.kind === "create" ? "Allocate project" : "Edit project"}
            </h2>
            <p className="fd-muted">
              Starts {dialogStart ? formatDate(dialogStart) : ""}
              {dialog.kind === "edit" ? " · change the end date or details" : ""}
            </p>
            <label>
              Project name
              <input
                name="title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Riverside offices"
                autoFocus
                required
              />
            </label>
            <label>
              Client
              <input
                name="client"
                value={form.client}
                onChange={(event) => setForm({ ...form, client: event.target.value })}
                placeholder="Client name"
              />
            </label>
            <div className="fd-form-row">
              <label>
                Type
                <select
                  name="type"
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                  <option value="build">New build</option>
                  <option value="renovation">Renovation</option>
                  <option value="service">Service</option>
                </select>
              </label>
              <label>
                Crew
                <select
                  name="crew"
                  value={form.crew}
                  onChange={(event) => setForm({ ...form, crew: event.target.value })}
                >
                  <option>Crew A</option>
                  <option>Crew B</option>
                  <option>Crew C</option>
                </select>
              </label>
            </div>
            <div className="fd-form-row">
              <label>
                End date
                <input
                  name="endDate"
                  type="date"
                  min={dialogStart}
                  value={form.endDate}
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  required
                />
              </label>
              <label>
                Budget (GBP)
                <input
                  name="budget"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.budget}
                  onChange={(event) => setForm({ ...form, budget: event.target.value })}
                  placeholder="Optional"
                />
              </label>
            </div>
            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ProjectStatus })
                }
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="complete">Complete</option>
              </select>
            </label>
            {formError && (
              <p className="fd-error" role="alert">
                {formError}
              </p>
            )}
            <div className="fd-form-actions">
              <button type="button" className="fd-button" onClick={() => setDialog(undefined)}>
                Cancel
              </button>
              <button type="submit" className="fd-button fd-button--primary">
                {dialog.kind === "create" ? "Allocate project" : "Save project"}
              </button>
            </div>
          </form>
        )}
      </dialog>

      {toast && (
        <div className="fd-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
