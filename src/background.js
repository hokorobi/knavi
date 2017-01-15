// @flow

import { config, local } from "./lib/config";

const DEFAULT_STYLE = `/* base overlay */
#jp-k-ui-knavi-overlay {
  background-color: gray;
  opacity: 0.2;
  transition-property: left, top, width, height;
  transition-duration: 0.24s;
}

/* hit target overlay */
#jp-k-ui-knavi-active-overlay {
  background-color: red;
  border: 1px solid white;
  opacity: 0.1;
  transition-property: left, top, width, height;
  transition-duration: 0.12s;
  animation: pulse 2s linear infinite;
}
@keyframes pulse {
  0% {
    box-shadow:
    0 0 0 0 rgba(128,128,128,0.8),
    0 0 0 0 rgba(255,0,0,0.8);
  }
  10% {
    box-shadow:
    0 0 3px 0px rgba(128,128,128,0.8),
    0 0 3px 8px rgba(255,0,0,0.8);
  }
  80% {
    box-shadow:
    0 0 3px 56px rgba(128,128,128,0.8),
    0 0 3px 64px rgba(255,0,0,0.8);
  }
  100% {
    box-shadow:
    0 0 3px 72px rgba(128,128,128,0),
    0 0 3px 80px rgba(255,0,0,0);
  }
}

/* \`#jp-k-ui-knavi-wrapper\` wraps hint elements */
#jp-k-ui-knavi-wrapper > div {
  margin: 0px;
  padding: 3px;
  background-color: #333;
  color: white;
  border: white solid 1px;
  line-height: 1em;
  font-size: 16px;
  font-family: monospace;
}
#jp-k-ui-knavi-wrapper > div.jp-k-ui-knavi-disabled {
  opacity: 0.6;
}
#jp-k-ui-knavi-wrapper > div.jp-k-ui-knavi-candidate {
  background-color: yellow;
  color: black;
  border: black solid 1px;
}
#jp-k-ui-knavi-wrapper > div.jp-k-ui-knavi-hit {
  background-color: #c00;
  color: white;
  border: black solid 1px;
  font-weight: bold;
}`.replace(/(^|\n)\t+/g, "$1");

const DEFAULT_VALUES = new Map([
  ["magic-key", "Space"],
  ["hints", "ASDFGHJKL"],
  ["blur-key", ""],
  ["css", DEFAULT_STYLE],
]);

async function init() {
  await initArea();
  await Promise.all(Array.from(DEFAULT_VALUES.entries()).map(([n, v]) => initValue(n, v)));
}

async function initArea() {
  await initValueByStorage(local, "_area", "chrome-sync");
}

async function initValue(name: string, defaultValue: string) {
  await initValueByStorage(config, name, defaultValue);
}

async function initValueByStorage(storage: local | config, name: string, defaultValue: string) {
  console.log(storage.storage);
  console.log(storage.getStorage && await storage.getStorage());
  const v = await storage.getSingle(name);
  if (v == null) {
    console.log("Init value: %o=%o", name, defaultValue);
    await storage.setSingle(name, defaultValue);
  } else {
    console.log("Already value set: %o=%o", name, v);
  }
}

init().then(() => console.log("Done init"));
