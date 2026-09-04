import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FiscalEmitInput, FiscalProvider } from './fiscal.provider';

/**
 * Adapter para a Nuvem Fiscal (https://api.nuvemfiscal.com.br).
 *
 * Ponto de partida: monta um payload mínimo de emissão e chama a API com
 * token de acesso (`NUVEMFISCAL_TOKEN`). O mapeamento completo dos campos
 * fiscais (CFOP por estado, ICMS/ST, MDF-e, etc.) deve ser completado conforme
 * o regime tributário de cada empresa.
 */
@Injectable()
export class NuvemFiscalProvider implements FiscalProvider {
  async emit(input: FiscalEmitInput) {
    const token = process.env.NUVEMFISCAL_TOKEN;
    const base =
      process.env.NUVEMFISCAL_API_URL || 'https://api.nuvemfiscal.com.br';

    if (!token) {
      throw new InternalServerErrorException(
        'NUVEMFISCAL_TOKEN não configurado. Gere um token de acesso no painel da Nuvem Fiscal e preencha no .env.',
      );
    }

    const endpoint = input.type === 'nfce' ? '/nfce' : '/nfe';
    const res = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ambiente: 'homologacao',
        data_emissao: new Date().toISOString(),
        ...input.payload,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      chave?: string;
    };

    return {
      providerId: data?.id ?? null,
      accessKey: data?.chave,
      status: res.ok ? ('enfileirado' as const) : ('rejeitado' as const),
    };
  }
}
