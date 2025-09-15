import { Injectable } from '@nestjs/common';
import { Group, type NodeId, User } from '../entities/node';

@Injectable()
export abstract class UserRepository {
  abstract createUser(user: User): Promise<User>;
  abstract addUserToGroup(user: User, group: Group): Promise<void>;
  abstract getUserById(userId: NodeId): Promise<User>;
  abstract getUserByEmail(email: string): Promise<User | null>;
}
