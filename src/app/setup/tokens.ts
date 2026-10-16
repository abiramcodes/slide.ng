// What the browser side setup files (docs/SETUP.md) fill in. Nothing here runs unless a root has the file.
import { InjectionToken } from '@angular/core';

/** One entry of the right-click menu. `run` is what a click does. */
export interface ContextMenuItem {
  icon: string;
  label: string;
  run: () => void;
  disabled?: boolean;
}

/** `setup/context-menu.ts`: gets the entries and returns the ones to show. */
export type ContextMenuSetup = (items: ContextMenuItem[]) => ContextMenuItem[];
export const CONTEXT_MENU_SETUP = new InjectionToken<ContextMenuSetup>('CONTEXT_MENU_SETUP', { factory: () => (items) => items });

/** `setup/mermaid.ts`: returns Mermaid's config. A diagram's own options come after it. */
export type MermaidSetup = () => Record<string, unknown>;
export const MERMAID_SETUP = new InjectionToken<MermaidSetup[]>('MERMAID_SETUP', { factory: () => [] });

/** `setup/monaco.ts`: runs once Monaco is loaded, gets `monaco`, may return editor options for every editor. */
export type MonacoSetup = (monaco: typeof import('monaco-editor')) => Record<string, unknown> | void | Promise<Record<string, unknown> | void>;
export const MONACO_SETUP = new InjectionToken<MonacoSetup[]>('MONACO_SETUP', { factory: () => [] });
