// @flow

import * as vp from "./viewports";
import * as rectUtils from "./rects";
import { subscribe } from "./chrome-messages";

import type { Blured } from "./blurer";

const Z_INDEX_OFFSET = 2147483640;

declare class Object {
  static assign: Object$Assign;
}

export default class BlurView {
  constructor() {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "absolute",
      display: "block",
      border: "none",
      outline: "none",
      zIndex: Z_INDEX_OFFSET.toString(),
    });

    function removeOverlay() {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }

    subscribe("Blured", ({ rect }: Blured) => {
      removeOverlay();

      if (!rect) return;

      rect = rectUtils.move(rect, vp.visual.offsets());
      Object.assign(overlay.style, {
        top:  `${rect.top}px`,
        left: `${rect.left}px`,
        height: `${rect.height}px`,
        width:  `${rect.width}px`,
      });
      document.body.insertBefore(overlay, document.body.firstChild);

      // $FlowFixMe
      const animation = overlay.animate([
        { boxShadow: "0 0   0    0 rgba(128,128,128,0.15), 0 0   0    0 rgba(0,0,128,0.1)" },
        { boxShadow: "0 0 3px 72px rgba(128,128,128,   0), 0 0 3px 80px rgba(0,0,128,  0)" },
      ], {
        duration: 400,
      });
      animation.addEventListener("finish", removeOverlay);
    });
  }
}
