import { SetMetadata } from '@nestjs/common';

export const ThrottlePublic = () => SetMetadata('isPublic', true);

