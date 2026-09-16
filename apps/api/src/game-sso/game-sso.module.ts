import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DomainPolicyModule } from '../common/domain-policy.module';
import { GameSsoController } from './game-sso.controller';
import { GameSsoService } from './game-sso.service';

@Module({ imports: [AuthModule, DomainPolicyModule], controllers: [GameSsoController], providers: [GameSsoService] })
export class GameSsoModule {}
