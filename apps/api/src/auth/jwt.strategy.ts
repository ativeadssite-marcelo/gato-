import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-only-secret',
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    role: string;
    companyId: string;
    defaultBranchId: string;
    branchIds: string[];
  }) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
      defaultBranchId: payload.defaultBranchId,
      branchIds: payload.branchIds,
    };
  }
}
