import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FiscalStatus } from '@prisma/client';

type WebhookBody = {
  id?: string;
  status?: string;
  chave?: string;
  access_key?: string;
  xml?: string;
  xml_url?: string;
  pdf?: string;
  danfe_url?: string;
};

function mapStatus(status?: string): FiscalStatus {
  switch (status) {
    case 'autorizado':
      return 'autorizado';
    case 'rejeitado':
    case 'erro':
      return 'rejeitado';
    case 'cancelado':
      return 'cancelado';
    default:
      return 'enfileirado';
  }
}

/**
 * Recebe notificações de status do provedor fiscal (sem JWT — o provedor chama
 * diretamente). Em produção, validar a assinatura/segredo do webhook antes de
 * aplicar a atualização.
 */
@Controller('fiscal')
export class FiscalWebhookController {
  constructor(private prisma: PrismaService) {}

  @Post('webhook')
  async webhook(@Body() body: WebhookBody) {
    const providerId = body?.id;
    if (!providerId) {
      throw new BadRequestException('Campo "id" ausente no webhook');
    }

    await this.prisma.fiscalDocument.updateMany({
      where: { providerId },
      data: {
        status: mapStatus(body?.status),
        accessKey: body?.access_key ?? body?.chave,
        xmlUrl: body?.xml_url ?? body?.xml,
        danfeUrl: body?.danfe_url ?? body?.pdf,
      },
    });

    return { ok: true };
  }
}
