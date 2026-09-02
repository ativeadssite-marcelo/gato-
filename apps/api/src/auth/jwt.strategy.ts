import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'altere-este-segredo-em-producao',
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
