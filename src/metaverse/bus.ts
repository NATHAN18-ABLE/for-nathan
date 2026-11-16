// A tiny in-page signal so UI buttons can start things in the 3D scene.
type Fn = () => void;
const listeners = new Map<string, Set<Fn>>();

export function on(name: string, fn: Fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(fn);
  return () => void listeners.get(name)?.delete(fn);
}

export function emit(name: string) {
  listeners.get(name)?.forEach((fn) => fn());
}
