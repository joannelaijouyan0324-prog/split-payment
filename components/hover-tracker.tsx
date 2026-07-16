"use client";

import { useEffect } from "react";

const clickableSelector = [
  "button",
  "a",
  "label.file-control",
  "label.capture-action",
].join(",");

export function HoverTracker() {
  useEffect(() => {
    let hovered: Element | null = null;
    let pressed: Element | null = null;
    let pressTimeout: number | undefined;

    function clearHover() {
      hovered?.removeAttribute("data-pointer-hover");
      hovered = null;
    }

    function clearPressed() {
      window.clearTimeout(pressTimeout);
      pressed?.removeAttribute("data-pointer-pressed");
      pressed = null;
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        clearHover();
        return;
      }

      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest(clickableSelector);

      if (target === hovered) return;

      clearHover();
      hovered = target ?? null;
      hovered?.setAttribute("data-pointer-hover", "true");
    }

    function handlePointerDown(event: PointerEvent) {
      const target = (event.target as Element | null)?.closest(clickableSelector);
      clearPressed();
      pressed = target ?? null;
      pressed?.setAttribute("data-pointer-pressed", "true");
    }

    function releasePressed() {
      window.clearTimeout(pressTimeout);
      pressTimeout = window.setTimeout(clearPressed, 120);
    }

    function handleBlur() {
      clearHover();
      clearPressed();
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", releasePressed, { passive: true });
    window.addEventListener("pointercancel", clearPressed, { passive: true });
    window.addEventListener("pointerleave", clearHover);
    window.addEventListener("scroll", clearPressed, { passive: true });
    window.addEventListener("blur", handleBlur);

    return () => {
      clearHover();
      clearPressed();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", releasePressed);
      window.removeEventListener("pointercancel", clearPressed);
      window.removeEventListener("pointerleave", clearHover);
      window.removeEventListener("scroll", clearPressed);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return null;
}
