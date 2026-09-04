import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FiscalController } from './fiscal.controller';
import { FiscalWebhookController } from './fiscal-webhook.controller';
import { StubFiscalProvider } from './fiscal.provider';
import { NuvemFiscalProvider } from './nuvem-fiscal.provider';

@Module({
  controllers: [FiscalController, FiscalWebhookController],
  providers: [
    {
      provide: 'FISCAL_PROVIDER',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const kind = config.get<string>('FISCAL_PROVIDER') || 'stub';
        return kind === 'nuvemfiscal'
          ? new NuvemFiscalProvider()
          : new StubFiscalProvider();
      },
    },
  ],
  exports: ['FISCAL_PROVIDER'],
})
export class FiscalModule {}
