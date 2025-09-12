import { TypeschemaDto } from '@nest-lab/typeschema';

import * as v from 'valibot';
const associateGroupSchema = v.object({
  groupId: v.pipe(v.number(), v.integer()),
});

export class AssociateGroupDto extends TypeschemaDto(associateGroupSchema) {}
