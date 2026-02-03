import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  customShortcuts?: ShortcutConfig[];
}

// Default navigation shortcuts
const getDefaultShortcuts = (navigate: ReturnType<typeof useNavigate>): ShortcutConfig[] => [
  {
    key: "h",
    meta: true,
    action: () => navigate("/"),
    description: "Go to Home",
  },
  {
    key: "b",
    meta: true,
    action: () => navigate("/books"),
    description: "Go to Books",
  },
  {
    key: "c",
    meta: true,
    shift: true,
    action: () => navigate("/community"),
    description: "Go to Community",
  },
  {
    key: "d",
    meta: true,
    action: () => navigate("/dashboard"),
    description: "Go to Dashboard",
  },
  {
    key: "f",
    meta: true,
    action: () => navigate("/forum"),
    description: "Go to Forum",
  },
  {
    key: "k",
    meta: true,
    action: () => {
      // Trigger global search - dispatch custom event
      window.dispatchEvent(new CustomEvent("open-global-search"));
    },
    description: "Open Search",
  },
  {
    key: "ArrowUp",
    shift: true,
    action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    description: "Scroll to Top",
  },
];

export const useKeyboardShortcuts = ({
  enabled = true,
  customShortcuts = [],
}: UseKeyboardShortcutsOptions = {}) => {
  const navigate = useNavigate();
  const shortcutsRef = useRef<ShortcutConfig[]>([]);

  // Build shortcuts list
  useEffect(() => {
    shortcutsRef.current = [
      ...getDefaultShortcuts(navigate),
      ...customShortcuts,
    ];
  }, [navigate, customShortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey || shortcut.meta;
        const metaMatch = shortcut.meta ? event.metaKey || event.ctrlKey : !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  // Return shortcuts for displaying in UI
  return {
    shortcuts: shortcutsRef.current,
    formatShortcut: (shortcut: ShortcutConfig) => {
      const parts: string[] = [];
      if (shortcut.meta) parts.push("⌘");
      if (shortcut.ctrl) parts.push("Ctrl");
      if (shortcut.shift) parts.push("⇧");
      if (shortcut.alt) parts.push("⌥");
      parts.push(shortcut.key.toUpperCase());
      return parts.join(" + ");
    },
  };
};
