import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

const createUserResponse = z.object({
  id: z.number().int(),
  type: z.string(),
  name: z.string(),
  email: z.email(),
});

export class CreateUserResponse extends createZodDto(createUserResponse) {}
