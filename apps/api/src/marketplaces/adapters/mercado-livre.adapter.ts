import { MarketplaceAdapter } from '../marketplaces.port';

export class MercadoLivreAdapter implements MarketplaceAdapter {
  readonly slug = 'mercado_livre';

  private log(action: string) {
    const message = `[Mercado Livre stub] ${action} — conector real pendente (OAuth + API)`;
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
