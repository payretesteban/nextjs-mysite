import type { WorkflowId } from "./model";

/**
 * The diagram and texts for the AI cost demo case: the boxes, the lines between them and what each box
 * does before and after the redesign. Positions use a 600 × 340 grid (the diagram's viewBox).
 */

export type Mode = "before" | "after";

/** A box in the diagram. */
export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  /** tool = a company app; agent = an old AI agent; ai = a new, right-sized AI step; store = the warehouse. */
  kind: "tool" | "agent" | "ai" | "store";
  /** Which diagrams show it. */
  modes: Mode[];
  /** The workflow whose numbers are shown when the box is selected. */
  workflow?: WorkflowId;
}

export const FLOW_WIDTH = 600;
export const FLOW_HEIGHT = 340;

export const FLOW_NODES: FlowNode[] = [
  { id: "crm", label: "CRM", x: 75, y: 50, kind: "tool", modes: ["before", "after"] },
  { id: "cms", label: "CMS", x: 75, y: 170, kind: "tool", modes: ["before", "after"] },
  { id: "marketing", label: "Marketing", x: 75, y: 290, kind: "tool", modes: ["before", "after"] },
  { id: "store", label: "Store", x: 525, y: 50, kind: "tool", modes: ["before", "after"] },
  { id: "helpdesk", label: "Help desk", x: 525, y: 290, kind: "tool", modes: ["before", "after"] },

  { id: "syncAgent", label: "Sync agent", x: 300, y: 95, kind: "agent", modes: ["before"], workflow: "sync" },
  { id: "enrichAgent", label: "Enrich agent", x: 300, y: 170, kind: "agent", modes: ["before"], workflow: "enrich" },
  { id: "contentAgent", label: "Content agent", x: 300, y: 245, kind: "agent", modes: ["before"], workflow: "content" },
  { id: "reportAgent", label: "Report agent", x: 525, y: 170, kind: "agent", modes: ["before"], workflow: "report" },

  { id: "warehouse", label: "Warehouse", x: 300, y: 170, kind: "store", modes: ["after"], workflow: "sync" },
  { id: "smallAi", label: "Small AI", x: 300, y: 60, kind: "ai", modes: ["after"], workflow: "triage" },
  { id: "drafts", label: "Copy drafts", x: 300, y: 280, kind: "ai", modes: ["after"], workflow: "content" },
  { id: "reportAi", label: "Report AI", x: 525, y: 170, kind: "ai", modes: ["after"], workflow: "report" },
];

/** Lines between boxes, by mode. */
export const FLOW_EDGES: Record<Mode, [string, string][]> = {
  before: [
    ["crm", "syncAgent"],
    ["marketing", "syncAgent"],
    ["store", "syncAgent"],
    ["helpdesk", "syncAgent"],
    ["crm", "enrichAgent"],
    ["syncAgent", "enrichAgent"],
    ["cms", "contentAgent"],
    ["store", "contentAgent"],
    ["store", "reportAgent"],
    ["helpdesk", "reportAgent"],
    ["enrichAgent", "reportAgent"],
    ["contentAgent", "reportAgent"],
  ],
  after: [
    ["crm", "warehouse"],
    ["cms", "warehouse"],
    ["marketing", "warehouse"],
    ["store", "warehouse"],
    ["helpdesk", "warehouse"],
    ["warehouse", "smallAi"],
    ["warehouse", "drafts"],
    ["warehouse", "reportAi"],
  ],
};

/** The box selected when a diagram first shows. */
export const DEFAULT_SELECTED: Record<Mode, string> = { before: "syncAgent", after: "warehouse" };

/** What a box does in each diagram (tools appear in both; agents only before; new parts only after). */
export const NODE_DETAILS: Record<string, Partial<Record<Mode, string>>> = {
  crm: {
    before: "Leads, customers and deals. Read in full by the sync agent every 15 minutes and by the enrich agent every week.",
    after: "Sends a webhook the moment a contact or deal changes. Nothing reads it on a timer anymore.",
  },
  cms: {
    before: "Product pages and the blog. The content agent rewrites product descriptions whenever stock changes.",
    after: "Product pages stay as people wrote them. New products get an AI draft that a person approves.",
  },
  marketing: {
    before: "Email campaigns, ad audiences and landing pages, kept in step with the CRM by the sync agent.",
    after: "Campaign results arrive by webhook; audiences are built from the warehouse with plain SQL.",
  },
  store: {
    before: "Orders and refunds. Exported in full to CSV for every weekly report.",
    after: "Orders and refunds stream into the warehouse as they happen.",
  },
  helpdesk: {
    before: "Support tickets. The sync agent copies them to the CRM and guesses their priority along the way.",
    after: "New tickets go to the small AI for triage; the result is saved with the ticket.",
  },
  syncAgent: {
    before: "Every run, the largest model reads hundreds of recent records from four tools to find what changed, maps the fields and writes the updates. Copying data this way is slow, costly and now and then wrong.",
  },
  enrichAgent: {
    before: "Re-summarizes every contact every week, even the thousands that didn't change.",
  },
  contentAgent: {
    before: "Rewrites product descriptions whenever stock changes: about a hundred pages a day nobody asked to change.",
  },
  reportAgent: {
    before: "Receives raw CSV exports from every tool and is asked to calculate the KPIs and write the report. Each step re-reads everything so far, the model does the arithmetic, and the numbers drift from week to week.",
  },
  warehouse: {
    after: "One central database. Plain code maps each webhook into it in seconds, with zero tokens, and metrics are calculated once in SQL, the same way every time.",
  },
  smallAi: {
    after: "A small model sorts new leads and tickets with a fixed output format, and refreshes summaries only for records that changed, as a cheaper overnight batch. Its instructions are cached.",
  },
  drafts: {
    after: "Drafts copy for new products only (about 20 a month). A person approves it before it goes live.",
  },
  reportAi: {
    after: "Gets a small summary of numbers SQL already calculated and writes the story around them. Any number that isn't in the data is rejected, so the report is exact.",
  },
};

/** Before and after, in words, for the "box by box" table. */
export const WORKFLOW_CHANGES: Record<WorkflowId, { before: string; after: string }> = {
  sync: { before: "Large-model agent scans four tools every 15 minutes", after: "Webhooks + plain mapping code; no AI" },
  triage: { before: "Done inside the sync agent", after: "Small model, fixed output format, cached instructions" },
  enrich: { before: "Every contact re-summarized weekly", after: "Only changed records, small model, overnight batch" },
  content: { before: "Product pages rewritten on every stock change", after: "Drafts for new products only, approved by a person" },
  report: { before: "Raw exports in, model does the maths", after: "SQL does the maths; AI writes the story, checked" },
};
