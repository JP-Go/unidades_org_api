import { createZodDto } from 'nestjs-zod';
import z from 'zod';
const associateGroupSchema = z.object({
  groupId: z.uuid(),
});

export class AssociateGroupDto extends createZodDto(associateGroupSchema) {}
