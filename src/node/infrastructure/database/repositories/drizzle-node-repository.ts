import { User, Group, NodeId } from 'src/node/domain/entities/node';
import { node } from '../node.model';
import { eq, sql } from 'drizzle-orm';
import {
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { AnyPgSelect, PgSelectPrepare } from 'drizzle-orm/pg-core';
import { DRIZZLE, DrizzleDatabase } from '../drizzle.module';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
// import { GroupRepository } from 'src/node/domain/repositories/group.repository';
// import { NodeRepository } from 'src/node/domain/repositories/node.repository';

@Injectable()
// implements UserRepository, GroupRepository, NodeRepository, OnModuleInit
export class DrizzleNodeRepository implements UserRepository, OnModuleInit {
  // TODO: type this better
  private existsByEmailPreparedQuery: PgSelectPrepare<AnyPgSelect>;
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
  ) {}

  onModuleInit() {
    const stmt = this.db
      .select()
      .from(node)
      .where(eq(node.email, sql.placeholder('email')))
      .prepare('userByEmail');
    this.existsByEmailPreparedQuery = stmt;
  }
  async createUser(user: User): Promise<User> {
    const [userExists] = await this.existsByEmailPreparedQuery.execute({
      email: user.email,
    });
    if (userExists) {
      throw new ConflictException('User already exists');
    }
    // TODO: organize tree
    const [savedUser] = await this.db
      .insert(node)
      .values({
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: new Date(),
      })
      .returning();
    return new User(
      {
        depth: 1,
        email: savedUser.email!,
        name: user.name,
        type: 'user',
      },
      savedUser.id,
    );
  }
  addUserToGroup(user: User, group: Group): Promise<Node> {
    throw new Error('Method not implemented.');
  }
  async createGroup(group: Group, parentId?: NodeId): Promise<Group> {
    // TODO: organize tree
    const [savedGroup] = await this.db
      .insert(node)
      .values({
        name: group.name,
        type: group.type,
        createdAt: new Date(),
      })
      .returning();
    return new Group(
      {
        depth: 1,
        name: savedGroup.name,
        type: 'group',
      },
      savedGroup.id,
    );
  }
  getDescendants(node: Node): Promise<Node> {
    throw new Error('Method not implemented.');
  }
  getAncestors(node: Node): Promise<Node> {
    throw new Error('Method not implemented.');
  }
  getUserById(userId: NodeId): Promise<User> {
    throw new Error('Method not implemented.');
  }
}
