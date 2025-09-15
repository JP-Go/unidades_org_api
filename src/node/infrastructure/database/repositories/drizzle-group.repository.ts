import { Injectable } from '@nestjs/common';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { Group, type NodeId } from 'src/node/domain/entities/node';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';

@Injectable()
export class DrizzleGroupRepository implements GroupRepository {
  constructor(private readonly nodeRepository: NodeRepository) {}
  createGroup(group: Group, parentId?: NodeId): Promise<Group> {
    throw new Error('Method not implemented.');
  }
}
