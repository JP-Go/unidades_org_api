import { Group, NodeId, User } from '../entities/node';

export abstract class UserRepository {
  abstract createUser(user: User): Promise<User>;
  abstract addUserToGroup(user: User, group: Group): Promise<Node>;
  abstract getUserById(userId: NodeId): Promise<User>;
}
