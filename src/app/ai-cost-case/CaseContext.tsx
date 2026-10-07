"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_INPUTS, compare, type CaseInputs, type Comparison } from "@/lib/aiCase/model";

/** The calculator's inputs and the numbers they produce, shared by every interactive part of the page. */
interface CaseState {
  inputs: CaseInputs;
  setInputs: (inputs: CaseInputs) => void;
  result: Comparison;
}

const CaseContext = createContext<CaseState | null>(null);

/**
 * Holds the visitor's numbers for the AI cost case so the diagram, the cost bars, the table and the
 * calculator all show the same scenario. Nothing is saved or sent anywhere.
 */
export function CaseProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<CaseInputs>(DEFAULT_INPUTS);
  const result = useMemo(() => compare(inputs), [inputs]);
  return <CaseContext.Provider value={{ inputs, setInputs, result }}>{children}</CaseContext.Provider>;
}

/** The shared inputs and results; outside a CaseProvider it falls back to the default company. */
export function useCase(): CaseState {
  const state = useContext(CaseContext);
  return state ?? { inputs: DEFAULT_INPUTS, setInputs: () => {}, result: compare(DEFAULT_INPUTS) };
}
