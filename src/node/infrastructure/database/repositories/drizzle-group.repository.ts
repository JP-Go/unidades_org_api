import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { Group, type NodeId } from 'src/node/domain/entities/node';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';

@Injectable()
export class DrizzleGroupRepository implements GroupRepository {
  constructor(
    @Inject(NodeRepository)
    private readonly nodeRepository: NodeRepository,
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}
  async getGroupById(groupId: NodeId): Promise<Group> {
    try {
      const aNode = await this.nodeRepository.getNodeById(groupId);
      if (aNode.type !== 'group')
        throw new NotFoundException('Group not found');
      return Group.existing(aNode.name, 0, aNode.id);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new NotFoundException('Group not found');
      }
      throw new InternalServerErrorException(e);
    }
  }
  async getUserOrganizations(
    userId: NodeId,
    maxDepth: number = -1,
  ): Promise<Group[]> {
    const user = await this.userRepository.getUserById(userId);
    if (maxDepth !== -1) {
      return await this.nodeRepository.getAncestors(user, 1, maxDepth);
    }
    return await this.nodeRepository.getAncestors(user);
  }
  async createGroup(group: Group, parentId?: NodeId): Promise<Group> {
    if (parentId) {
      const parentGroup = await this.nodeRepository.getNodeById(parentId);
      const savedGroup = await this.nodeRepository.addNode(group);
      await this.nodeRepository.addEdge(parentGroup, savedGroup);
      return savedGroup;
    }
    const savedGroup = await this.nodeRepository.addNode(group);
    return savedGroup;
  }
}
