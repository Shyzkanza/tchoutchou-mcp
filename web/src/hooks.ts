import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import type { WidgetState } from "./types";

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

interface SetGlobalsEvent extends CustomEvent {
  detail: {
    globals: Partial<NonNullable<Window["openai"]>>;
  };
}

// Hook pour lire une valeur globale de window.openai
export function useOpenAiGlobal<K extends keyof NonNullable<Window["openai"]>>(
  key: K
): NonNullable<Window["openai"]>[K] | undefined {
  return useSyncExternalStore(
    (onChange) => {
      const handleSetGlobal = (event: Event) => {
        const setGlobalsEvent = event as SetGlobalsEvent;
        const value = setGlobalsEvent.detail.globals[key];
        if (value !== undefined) {
          onChange();
        }
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal, {
        passive: true,
      });

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
      };
    },
    () => {
      if (typeof window !== "undefined" && window.openai) {
        return window.openai[key];
      }
      return undefined;
    }
  );
}

// Hook pour lire toolOutput
export function useToolOutput() {
  return useOpenAiGlobal("toolOutput");
}

// Hook pour lire toolInput
export function useToolInput() {
  return useOpenAiGlobal("toolInput");
}

// Hook pour lire widgetState avec persistance
export function useWidgetState<T extends WidgetState>(
  defaultState?: T | (() => T | null) | null
): readonly [T | null, (state: T | null | ((prev: T | null) => T | null)) => void] {
  const widgetStateFromWindow = useOpenAiGlobal("widgetState") as T | null | undefined;

  const [widgetState, _setWidgetState] = useState<T | null>(() => {
    if (widgetStateFromWindow != null) {
      return widgetStateFromWindow;
    }
    return typeof defaultState === "function"
      ? defaultState()
      : defaultState ?? null;
  });

  useEffect(() => {
    if (widgetStateFromWindow !== undefined) {
      _setWidgetState(widgetStateFromWindow);
    }
  }, [widgetStateFromWindow]);

  const setWidgetState = useCallback(
    (state: T | null | ((prev: T | null) => T | null)) => {
      _setWidgetState((prevState) => {
        const newState = typeof state === "function" ? state(prevState) : state;
        if (newState != null && typeof window !== "undefined" && window.openai?.setWidgetState) {
          window.openai.setWidgetState(newState).catch(console.error);
        }
        return newState;
      });
    },
    []
  );

  return [widgetState, setWidgetState] as const;
}


