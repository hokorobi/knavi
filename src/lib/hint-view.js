// @flow

import * as iters from "./iters";
import * as utils from "./utils";
import Hinter from "./hinter";

import type { HintedTarget, DehintOptions, TargetState, TargetStateChanges } from "./hinter";

const OVERLAY_PADDING = 8;
const CONTAINER_ID = "jp-k-ui-knavi";
const OVERLAY_ID = "jp-k-ui-knavi-overlay";
const ACTIVE_OVERLAY_ID = "jp-k-ui-knavi-active-overlay";
const WRAPPER_ID = "jp-k-ui-knavi-wrapper";
const Z_INDEX_OFFSET = 2147483640;
const CANDIDATE_HINT_Z_INDEX = Z_INDEX_OFFSET + 1;
const HIT_HINT_Z_INDEX = Z_INDEX_OFFSET + 2;

declare class Object {
  static assign: Object$Assign;
}

declare type Hint = {
  elements: HTMLDivElement[];
  target: HintedTarget;
}

export default class HintsView {
  constructor(hinter: Hinter, css: string) {
    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    Object.assign(container.style, {
      position: "static",
      padding: "0px", margin: "0px",
      width:  "0px", height: "0px",
      background: "none"
    });

    const overlay = container.appendChild(document.createElement("div"));
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      padding: "0px", margin: "0px",
      display: "block",
      position: "absolute",
      zIndex: Z_INDEX_OFFSET.toString(),
    });

    const activeOverlay = container.appendChild(document.createElement("div"));
    activeOverlay.id = ACTIVE_OVERLAY_ID;
    Object.assign(activeOverlay.style, {
      padding: "0px", margin: "0px",
      display: "none",
      position: "absolute",
      zIndex: Z_INDEX_OFFSET.toString(),
    });

    let wrapper: ?HTMLDivElement;
    let style: ?HTMLElement;
    let hints: ?Map<HintedTarget, Hint>;

    hinter.onHinted.listen(({ context }) => {
      fitOverlay(overlay);
      activeOverlay.style.display = "none";

      wrapper = generateHintsWrapper();
      hints = generateHintElements(wrapper, context.targets);
      style = generateStyle(css);

      container.appendChild(wrapper);
      container.appendChild(style);
      document.body.insertBefore(container, document.body.firstChild);
    });
    hinter.onHintHit.listen(({ context, stateChanges }) => {
      if (!hints) throw Error("Illegal state");
      highligtHints(hints, stateChanges);
      moveOverlay(overlay, context.targets);
      moveActiveOverlay(activeOverlay, context.hitTarget);
    });
    hinter.onDehinted.listen(({ context, options }) => {
      if (!hints || !wrapper || !style) throw Error("Illegal state");
      handleHitTarget(context.hitTarget, options);
      document.body.removeChild(container);
      container.removeChild(wrapper);
      container.removeChild(style);
      wrapper = null;
      style = null;
      hints = null;
    });
  }
}

function generateHintsWrapper(): HTMLDivElement {
  const w = document.createElement("div");
  w.id = WRAPPER_ID;
  Object.assign(w.style, {
    position: "static",
  });
  return w;
}

function handleHitTarget(target: ?HintedTarget, options: DehintOptions) {
  if (!target) return;

  console.log("hit", target.element);

  const element = target.element;
  const style = window.getComputedStyle(element);
  if (utils.isScrollable(element, style)) {
    // Make scrollable from your keyboard
    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "-1");
      element.addEventListener(
        "blur",
        () => element.removeAttribute("tabindex"),
        { once: true }
      );
    }
    element.focus();
    console.log("focus as an scrollable element");
    return;
  }
  if (utils.isEditable(element)) {
    element.focus();
    console.log("focus as an editable element");
    return;
  }
  if (element.tagName === "BODY") {
    const activeElement = document.activeElement;
    activeElement.blur();
    console.log("blue an active element: ", activeElement);
    return;
  }
  if (element.tagName === "IFRAME") {
    element.focus();
    console.log("focus as an iframe");
    return;
  }

  simulateClick(element, options);
  console.log("click");
}

function simulateClick(element: HTMLElement, options: DehintOptions) {
  dispatchMouseEvent("mouseover", element, options);

  for (const type of ["mousedown", "mouseup", "click"]) {
    if (!dispatchMouseEvent(type, element, options)) {
      console.debug("Canceled: ", type);
      return false;
    }
  }
  return true;
}

declare class MouseEvent extends UIEvent {
  constructor(type: MouseEventTypes, mouseEventInit?: MouseEventInit): void;
}

declare interface MouseEventInit {
  screenX?: number;
  screenY?: number;
  clientX?: number;
  clientY?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  button?: number;
  buttons?: number;
  relatedTarget?: EventTarget;
  regison?: string;
  bubbles?: boolean;
  cancelable?: boolean;
}

/// Return false if canceled
function dispatchMouseEvent(type: MouseEventTypes, element: HTMLElement, options: DehintOptions): boolean {
  const event = new MouseEvent(type, {
    button: 0,
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrlKey,
    shiftKey: options.shiftKey,
    altKey: options.altKey,
    metaKey: options.metaKey || options.ctrlKey,
  });
  return element.dispatchEvent(event);
}

function moveActiveOverlay(activeOverlay: HTMLDivElement, hitTarget: ?HintedTarget) {
  if (!hitTarget) {
    activeOverlay.style.display = "none";
    return;
  }

  const rect = hitTarget.getBoundingClientRect();
  const offsetY = window.scrollY;
  const offsetX = window.scrollX;

  Object.assign(activeOverlay.style, {
    top: `${rect.top + offsetY}px`,
    left: `${rect.left + offsetX}px`,
    height: `${Math.round(rect.height)}px`,
    width: `${Math.round(rect.width)}px`,
    display: "block",
  });
}

function moveOverlay(overlay: HTMLDivElement, targets: HintedTarget[]) {
  const scrollHeight = document.body.scrollHeight;
  const scrollWidth = document.body.scrollWidth;
  const offsetY = window.scrollY;
  const offsetX = window.scrollX;
  let hasHitOrCand = false;
  const rr = { top: scrollHeight, left: scrollWidth, bottom: 0, right: 0 };
  for (const target of targets) {
    if (target.state === "disabled") continue;
    hasHitOrCand = true;

    const rect = target.getBoundingClientRect();

    rr.top = Math.min(rr.top, rect.top + offsetY);
    rr.left = Math.min(rr.left, rect.left + offsetX);
    rr.bottom = Math.max(rr.bottom, rect.bottom + offsetY);
    rr.right = Math.max(rr.right, rect.right + offsetX);
  }

  if (!hasHitOrCand) {
    overlay.style.display = "none";
    return;
  }

  // padding
  rr.top = Math.max(rr.top - OVERLAY_PADDING, 0);
  rr.left = Math.max(rr.left - OVERLAY_PADDING, 0);
  rr.bottom = Math.min(rr.bottom + OVERLAY_PADDING, scrollHeight);
  rr.right = Math.min(rr.right + OVERLAY_PADDING, scrollWidth);

  Object.assign(overlay.style, {
    top: `${rr.top}px`,
    left: `${rr.left}px`,
    height: `${rr.bottom - rr.top}px`,
    width: `${rr.right - rr.left}px`,
    display: "block",
  });
}

function generateStyle(css: string): HTMLElement {
  const s = document.createElement("style");
  (s: any).scoped = true;
  s.textContent = css;
  return s;
}

const HINT_Z_INDEXES: { [key: TargetState ]: number } = {
  "disabled": Z_INDEX_OFFSET,
  "candidate": CANDIDATE_HINT_Z_INDEX,
  "hit": HIT_HINT_Z_INDEX,
  "init": Z_INDEX_OFFSET,
};

function getZIndex(state: TargetState): number {
  return HINT_Z_INDEXES[state] || Z_INDEX_OFFSET;
}

function highligtHints(hints: Map<HintedTarget, Hint>, changes: TargetStateChanges) {
  for (const [target, { oldState, newState }] of changes.entries()) {
    const hint = hints.get(target);
    if (hint == null) continue;
    for (const e of hint.elements) {
      e.classList.remove(`jp-k-ui-knavi-${oldState}`);
      e.classList.add(`jp-k-ui-knavi-${newState}`);
      e.style.zIndex = getZIndex(newState).toString();
    }
  }
}

function fitOverlay(overlay: HTMLDivElement) {
  Object.assign(overlay.style, {
    top: `${window.scrollY}px`,
    left: `${window.scrollX}px`,
    width:  "100%",
    height: "100%",
    display: "block",
  });
}

function generateHintElements(wrapper: HTMLDivElement, targets: HintedTarget[]): Map<HintedTarget, Hint> {
  const hints = targets.reduce((m, target) => {
    const elements = buildHintElements(target);
    elements.forEach((e) => wrapper.appendChild(e));
    m.set(target, { elements, target });
    return m;
  }, new Map);
  console.debug("hints[%d]: %o", hints.size, iters.reduce(hints.values(), (o, h) => {
    o[h.target.hint] = h;
    return o;
  }, {}));
  return hints;
}

function buildHintElements(target: HintedTarget): HTMLDivElement[] {
  const xOffset = window.scrollX;
  const yOffset = window.scrollY;

  return target.rects.map((rect) => {
    const h = document.createElement("div");
    h.textContent = target.hint.toUpperCase();
    h.dataset["hint"] = target.hint;
    const top = Math.max(rect.top, 0);
    const left = Math.max(rect.left, 0);
    Object.assign(h.style, {
      position: "absolute",
      top: Math.round(yOffset + top) + "px",
      left: Math.round(xOffset + left) + "px",
      zIndex: CANDIDATE_HINT_Z_INDEX.toString(),
    });
    return h;
  });
}
