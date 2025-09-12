import { TypeschemaDto } from '@nest-lab/typeschema';
import * as v from 'valibot';

const createGroupSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  parentId: v.optional(v.pipe(v.string(), v.minLength(1))),
});

export class CreateGroupDto extends TypeschemaDto(createGroupSchema) {}
