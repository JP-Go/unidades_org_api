import { TypeschemaDto } from '@nest-lab/typeschema';
import * as v from 'valibot';

const createUserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email()),
});

export type ICreateUserDto = v.InferInput<typeof createUserSchema>;

export class CreateUserDto extends TypeschemaDto(createUserSchema) {}
