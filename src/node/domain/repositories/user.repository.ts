import { Group, type NodeId, User } from '../entities/node';

export abstract class UserRepository {
  abstract createUser(user: User): Promise<User>;
  abstract addUserToGroup(user: User, group: Group): Promise<void>;
  abstract getUserById(userId: NodeId): Promise<User>;
}
