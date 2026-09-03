import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status = this.statusFor(exception.code);
    res.status(status).json({
      statusCode: status,
      message: this.messageFor(exception),
    });
  }

  private statusFor(code: string): number {
    switch (code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      case 'P2003':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private messageFor(e: Prisma.PrismaClientKnownRequestError): string {
    switch (e.code) {
      case 'P2002': {
        const target = (e.meta?.target as string[])?.join(', ') ?? 'campo';
        return `Registro duplicado (${target})`;
      }
      case 'P2025':
        return 'Registro não encontrado';
      case 'P2003':
        return 'Referência inválida';
      default:
        return e.message;
    }
  }
}
