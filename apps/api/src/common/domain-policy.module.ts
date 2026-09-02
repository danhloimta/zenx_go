import { Global, Module } from '@nestjs/common';
import { DomainPolicyService } from './domain-policy.service';

@Global()
@Module({ providers: [DomainPolicyService], exports: [DomainPolicyService] })
export class DomainPolicyModule {}
