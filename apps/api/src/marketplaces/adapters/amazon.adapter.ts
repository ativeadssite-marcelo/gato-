import { MarketplaceAdapter } from '../marketplaces.port';

export class AmazonAdapter implements MarketplaceAdapter {
  readonly slug = 'amazon';

  private log(action: string) {
    const message = `[Amazon stub] ${action} — conector real pendente (SP-API)`;
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
