import { Injectable } from '@nestjs/common';
import { Group, type NodeId } from '../entities/node';

@Injectable()
export abstract class GroupRepository {
  abstract getGroupById(groupId: NodeId): Promise<Group>;
  abstract createGroup(group: Group, parentId?: NodeId): Promise<Group>;
  abstract getUserOrganizations(
    userId: NodeId,
    maxDepth?: number,
  ): Promise<Group[]>;
}
