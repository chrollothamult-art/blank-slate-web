import { useEffect, useCallback } from "react";

interface UseStoryPlayerShortcutsProps {
  choices: { id: string }[];
  onChoiceSelect: (index: number) => void;
  onContinue?: () => void;
  onMenu: () => void;
  enabled: boolean;
}

export const useStoryPlayerShortcuts = ({
  choices,
  onChoiceSelect,
  onContinue,
  onMenu,
  enabled,
}: UseStoryPlayerShortcutsProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      // Don't trigger in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // 1-4 for choice selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && num <= choices.length) {
        e.preventDefault();
        onChoiceSelect(num - 1);
        return;
      }

      // Space for continue (narrative nodes with no choices)
      if (e.key === " " && onContinue && choices.length === 0) {
        e.preventDefault();
        onContinue();
        return;
      }

      // Escape for menu / go back
      if (e.key === "Escape") {
        e.preventDefault();
        onMenu();
        return;
      }

      // ? for shortcut help
      if (e.key === "?") {
        e.preventDefault();
        // Dispatched as custom event, handled by ShortcutOverlay
        window.dispatchEvent(new CustomEvent("toggle-shortcut-overlay"));
      }
    },
    [enabled, choices, onChoiceSelect, onContinue, onMenu]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
