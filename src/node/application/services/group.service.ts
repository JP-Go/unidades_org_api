import { Inject, Injectable } from '@nestjs/common';
import { WithTracing } from 'src/decorators';
import { Group, NodeId } from 'src/node/domain/entities/node';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';
import { CreateGroupDto } from 'src/node/infrastructure/api/dtos/create-group.dto';

@Injectable()
export abstract class GroupService {
  abstract createGroup(
    group: CreateGroupDto,
    parentId?: NodeId,
  ): Promise<Group>;
  abstract getUserOrganizations(
    userId: NodeId,
    maxDepth?: number,
  ): Promise<Group[]>;
}

@Injectable()
@WithTracing
export class GroupServiceImpl implements GroupService {
  constructor(
    @Inject(GroupRepository)
    private readonly groupRepository: GroupRepository,
  ) {}

  async createGroup(group: CreateGroupDto, parentId?: NodeId): Promise<Group> {
    return this.groupRepository.createGroup(Group.create(group.name), parentId);
  }

  async getUserOrganizations(
    userId: NodeId,
    maxDepth?: number,
  ): Promise<Group[]> {
    return this.groupRepository.getUserOrganizations(userId, maxDepth ?? -1);
  }
}
