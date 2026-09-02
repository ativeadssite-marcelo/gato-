import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { StubFiscalProvider } from './fiscal.provider';

@Module({
  controllers: [FiscalController],
  providers: [
    { provide: 'FISCAL_PROVIDER', useClass: StubFiscalProvider },
  ],
  exports: ['FISCAL_PROVIDER'],
})
export class FiscalModule {}
