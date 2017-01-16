// @flow
import se from "storage-element";
import * as ki from "key-input-elements";
import CodeMirror from "codemirror";
import "codemirror/mode/css/css.js";
import * as utils from "./lib/utils";

async function init() {
  for (const e of document.body.getElementsByClassName("js-clear-button")) {
    console.log("clear button: ", e);
    e.addEventListener("click", (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return true;
      const targetQuery = e.target.dataset["target"];
      if (!targetQuery) return true;
      const targets = document.querySelectorAll(targetQuery);
      for (const t of targets) {
        if ("value" in t) (t: any).value = "";
      }
      return false;
    });
  }

  initCodeMirror();

  se.register();
  ki.register();
}

async function initCodeMirror() {

  const form = document.querySelector("form[is=storage-form]");
  if (form == null) throw Error("form element not found");
  await new Promise((resolve) => {
    form.addEventListener("storage-form-init", () => resolve(), { once: true });
  });

  const t: HTMLTextAreaElement = (document.getElementsByName("css")[0]: any);
  t.style.display = "none";
  const w =  document.getElementById("cm-wrapper");
  let value = t.value;
  const cm = CodeMirror(w, { value: t.value });

  // for styling
  cm.on("focus", () => w.classList.add("focused"));
  cm.on("blur",  () => w.classList.remove("focused"));

  // two way data binding with textarea and codemirror
  cm.on("change", () => {
    const v = cm.getValue();
    t.value = value = v;
  });
  (async function() {
    while (true) {
      await utils.nextTick();
      if (value !== t.value) {
        value = t.value;
        cm.setValue(value);
      }
    }
  })();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
