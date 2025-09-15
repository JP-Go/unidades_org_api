import { createZodDto } from 'nestjs-zod';
import z from 'zod';
const associateGroupSchema = z.object({
  groupId: z.number().int().min(1),
});

export class AssociateGroupDto extends createZodDto(associateGroupSchema) {}
