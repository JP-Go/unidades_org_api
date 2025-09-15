import { Injectable } from '@nestjs/common';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { Group, type NodeId, User } from 'src/node/domain/entities/node';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly nodeRepository: NodeRepository) {}

  createUser(user: User): Promise<User> {
    throw new Error('Method not implemented.');
  }
  addUserToGroup(user: User, group: Group): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserById(userId: NodeId): Promise<User> {
    throw new Error('Method not implemented.');
  }
}
