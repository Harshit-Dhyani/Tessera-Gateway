export type LayoutMode = 'single' | 'split' | 'grid';

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  gap: number;
  padding: number;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  gap: 4,
  padding: 8,
};

export class ProviderLayoutManager {
  private config: LayoutConfig;
  private currentLayout: LayoutMode = 'single';
  private openProviders: string[] = [];

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  }

  setLayout(layout: LayoutMode): void {
    this.currentLayout = layout;
  }

  getLayout(): LayoutMode {
    return this.currentLayout;
  }

  addProvider(providerId: string): void {
    if (!this.openProviders.includes(providerId)) {
      this.openProviders.push(providerId);
    }
  }

  removeProvider(providerId: string): void {
    this.openProviders = this.openProviders.filter((id) => id !== providerId);
  }

  setPrimaryProvider(providerId: string): void {
    if (!this.openProviders.includes(providerId)) return;
    this.openProviders = [providerId, ...this.openProviders.filter((id) => id !== providerId)];
  }

  getOpenProviders(): string[] {
    return [...this.openProviders];
  }

  calculateBounds(windowWidth: number, windowHeight: number): Map<string, ViewBounds> {
    const bounds = new Map<string, ViewBounds>();
    const providers = this.getOpenProviders();

    if (providers.length === 0) {
      return bounds;
    }

    const paddedWidth = windowWidth - this.config.padding * 2;
    const paddedHeight = windowHeight - this.config.padding * 2;

    // ALL providers get bounds - focus logic determines which is visible on top
    switch (this.currentLayout) {
      case 'single':
        if (providers.length > 0) {
          // Single mode always gives the first provider the full workspace.
          bounds.set(providers[0], {
            x: this.config.padding,
            y: this.config.padding,
            width: paddedWidth,
            height: paddedHeight,
          });
        }
        break;

      case 'split':
        if (providers.length === 1) {
          bounds.set(providers[0], {
            x: this.config.padding,
            y: this.config.padding,
            width: paddedWidth,
            height: paddedHeight,
          });
        } else {
          // Two providers in split mode
          const halfWidth = (paddedWidth - this.config.gap) / 2;
          providers.slice(0, 2).forEach((provider, index) => {
            bounds.set(provider, {
              x: this.config.padding + index * (halfWidth + this.config.gap),
              y: this.config.padding,
              width: halfWidth,
              height: paddedHeight,
            });
          });
        }
        break;

      case 'grid':
        if (providers.length === 1) {
          bounds.set(providers[0], {
            x: this.config.padding,
            y: this.config.padding,
            width: paddedWidth,
            height: paddedHeight,
          });
        } else if (providers.length === 2) {
          // 2 providers in grid mode = split
          const halfWidth = (paddedWidth - this.config.gap) / 2;
          providers.slice(0, 2).forEach((provider, index) => {
            bounds.set(provider, {
              x: this.config.padding + index * (halfWidth + this.config.gap),
              y: this.config.padding,
              width: halfWidth,
              height: paddedHeight,
            });
          });
        } else {
          // 3-4 providers in grid mode = 2x2 grid
          const gridWidth = (paddedWidth - this.config.gap) / 2;
          const gridHeight = (paddedHeight - this.config.gap) / 2;
          providers.slice(0, 4).forEach((provider, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            bounds.set(provider, {
              x: this.config.padding + col * (gridWidth + this.config.gap),
              y: this.config.padding + row * (gridHeight + this.config.gap),
              width: gridWidth,
              height: gridHeight,
            });
          });
        }
        break;
    }

    return bounds;
  }

  reset(): void {
    this.openProviders = [];
    this.currentLayout = 'single';
  }
}

let layoutManager: ProviderLayoutManager | null = null;

export function getProviderLayoutManager(): ProviderLayoutManager {
  if (!layoutManager) {
    layoutManager = new ProviderLayoutManager();
  }
  return layoutManager;
}
