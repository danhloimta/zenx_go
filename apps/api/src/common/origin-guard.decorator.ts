import { SetMetadata } from '@nestjs/common';

export const SKIP_ORIGIN_GUARD = 'skipOriginGuard';
export const SkipOriginGuard = () => SetMetadata(SKIP_ORIGIN_GUARD, true);
