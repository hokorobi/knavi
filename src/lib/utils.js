// @flow

export function nextAnimationFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

export function isScrollable(element: HTMLElement, style: any): boolean {
  if (element.scrollHeight - element.clientHeight > 10
      && ["auto", "scroll"].includes(style.overflowY)) return true;
  if (element.scrollWidth - element.clientWidth > 10
      && ["auto", "scroll"].includes(style.overflowX)) return true;
  return false;
}

export function isEditable(elem: EventTarget) {
  if (!(elem instanceof Element)) return false;
  // No-selectable <input> throws an error when "selectionStart" are referred.
  let selectionStart;
  try {
    selectionStart = (elem: any).selectionStart;
  } catch (e) {
    return false;
  }
  return selectionStart != null || (elem: any).contentEditable === "true";
}

export class ArrayMap<K, V> extends Map<K, V[]> {
  add(k: K, v: V): V[] {
    let vs = this.get(k);
    if (vs == null) {
      vs = [];
      this.set(k, vs);
    }
    vs.push(v);
    return vs;
  }
  delete(k: K, v?: V): boolean {
    if (v == null) return super.delete(k);

    const vs = this.get(k);
    if (vs == null) return false;

    const idx = vs.indexOf(v);
    if (idx < 0) return false;

    vs.splice(idx, 1);
    if (vs.length === 0) super.delete(k);
    return true;
  }
}

export class SetMap<K, V> extends Map<K, Set<V>> {
  add(k: K, v: V): Set<V> {
    let vs = this.get(k);
    if (vs == null) {
      vs = new Set;
      this.set(k, vs);
    }
    return vs.add(v);
  }

  has(k: K, v?: V): boolean {
    if (v == null) {
      return this.has(k);
    }

    const vs = this.get(k);
    if (vs == null) return false;
    return vs.has(v);
  }

  delete(k: K, v?: V): boolean {
    if (v == null) return super.delete(k);

    const vs = this.get(k);
    if (vs == null) return false;
    const b = vs.delete(v);
    if (vs.size === 0) super.delete(k);
    return b;
  }
}

export async function waitUntil(predicate: () => boolean) {
  while (!predicate()) {
    await nextAnimationFrame();
  }
}
