import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1),
  parentId: z.number().int().min(1).optional(),
});

export class CreateGroupDto extends createZodDto(createGroupSchema) {}

const createGroupResponse = z.object({
  name: z.string().min(1),
  parentId: z.number().int().min(1).optional(),
});
export class CreateGroupResponse extends createZodDto(createGroupResponse) {}
