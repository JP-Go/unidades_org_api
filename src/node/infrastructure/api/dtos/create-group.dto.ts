import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1),
  parentId: z.uuid().optional(),
});

export class CreateGroupDto extends createZodDto(createGroupSchema) {}

const createGroupResponse = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  type: z.string().toUpperCase(),
});
export class CreateGroupResponse extends createZodDto(createGroupResponse) {}
