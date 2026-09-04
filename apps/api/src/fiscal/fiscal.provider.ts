import { Injectable } from '@nestjs/common';

export type FiscalEmitInput = {
  orderId: string;
  type: 'nfce' | 'nfe';
  payload?: Record<string, unknown>;
};

export interface FiscalProvider {
  emit(input: FiscalEmitInput): Promise<{
    providerId?: string | null;
    status: 'enfileirado' | 'autorizado' | 'rejeitado';
    accessKey?: string;
  }>;
}

@Injectable()
export class StubFiscalProvider implements FiscalProvider {
  async emit(input: FiscalEmitInput) {
    return {
      providerId: `stub-${input.orderId}`,
      status: 'enfileirado' as const,
    };
  }
}
