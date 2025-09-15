import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { Group, NodeId, User } from 'src/node/domain/entities/node';
import { DRIZZLE, DrizzleDatabase } from '../drizzle.module';
import type { NodeColumns } from './@types';
import type { PgSelectBase, PgSelectPrepare } from 'drizzle-orm/pg-core';
import { node } from '../node.model';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  private readonly getUserByEmailQuery: PgSelectPrepare<
    PgSelectBase<'node', NodeColumns, 'single', {}>
  >;
  constructor(
    @Inject(NodeRepository)
    private readonly nodeRepository: NodeRepository,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
  ) {
    this.getUserByEmailQuery = this.db
      .select()
      .from(node)
      .where(eq(node.email, sql.placeholder('email')))
      .prepare('get-user-by-email');
  }

  async createUser(user: User): Promise<User> {
    const [emailInUse] = await this.getUserByEmailQuery.execute({
      email: user.email,
    });
    if (emailInUse) {
      throw new ConflictException('User already exists');
    }
    const newNode = await this.nodeRepository.addNode(user);
    console.log(newNode);
    return User.existing(
      newNode.email!,
      newNode.name,
      newNode.depth,
      newNode.id,
    );
  }
  async addUserToGroup(user: User, group: Group): Promise<void> {
    user = await this.getUserById(user.id);
    group = await this.nodeRepository.getNodeById(group.id);
    return this.nodeRepository.addEdge(group, user);
  }
  async getUserById(userId: NodeId): Promise<User> {
    const node = await this.nodeRepository.getNodeById(userId);
    return User.existing(node.email!, node.name, node.depth, node.id);
  }
}
