import { MarketplaceAdapter } from '../marketplaces.port';

export class ShopeeAdapter implements MarketplaceAdapter {
  readonly slug = 'shopee';

  private log(action: string) {
    const message = `[Shopee stub] ${action} — conector real pendente (OpenAPI + webhooks)`;
    console.log(message);
    return { ok: true, message };
  }

  syncCatalog() {
    return Promise.resolve(this.log('syncCatalog'));
  }
  syncStock() {
    return Promise.resolve(this.log('syncStock'));
  }
  syncPrice() {
    return Promise.resolve(this.log('syncPrice'));
  }
  pullOrders() {
    return Promise.resolve(this.log('pullOrders'));
  }
  pushTracking() {
    return Promise.resolve(this.log('pushTracking'));
  }
}
