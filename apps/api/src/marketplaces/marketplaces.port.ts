export interface MarketplaceAdapter {
  readonly slug: string;
  syncCatalog(): Promise<{ ok: boolean; message: string }>;
  syncStock(): Promise<{ ok: boolean; message: string }>;
  syncPrice(): Promise<{ ok: boolean; message: string }>;
  pullOrders(): Promise<{ ok: boolean; message: string }>;
  pushTracking(): Promise<{ ok: boolean; message: string }>;
}
