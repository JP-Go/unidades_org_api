import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const listOfNodesResponse = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    depth: z.number().int(),
  }),
);

export class ListOfNodesResponse extends createZodDto(listOfNodesResponse) {}
