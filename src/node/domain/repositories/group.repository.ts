import { Group, type NodeId } from '../entities/node';

export abstract class GroupRepository {
  abstract createGroup(group: Group, parentId?: NodeId): Promise<Group>;
}
