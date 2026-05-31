export interface WorkspaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

let workspaceBounds: WorkspaceBounds | null = null;
const listeners: Set<(bounds: WorkspaceBounds) => void> = new Set();

export function setWorkspaceBounds(bounds: WorkspaceBounds): void {
  workspaceBounds = bounds;
  listeners.forEach((cb) => {
    cb(bounds);
  });
}

export function getWorkspaceBounds(): WorkspaceBounds | null {
  return workspaceBounds;
}

export function subscribeToWorkspaceBounds(callback: (bounds: WorkspaceBounds) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function isWorkspaceBoundsSet(): boolean {
  return workspaceBounds !== null && workspaceBounds.width > 0 && workspaceBounds.height > 0;
}
