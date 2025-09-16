import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { Group, NodeId, User } from 'src/node/domain/entities/node';
import { DRIZZLE, type DrizzleDatabase } from '../drizzle.module';
import type { NodeColumns } from './@types';
import type { PgSelectBase, PgSelectPrepare } from 'drizzle-orm/pg-core';
import { node } from '../node.model';
import { eq, sql } from 'drizzle-orm';
import { WithTracing } from 'src/decorators';

@Injectable()
@WithTracing
export class DrizzleUserRepository implements UserRepository {
  private readonly getUserByEmailQuery: PgSelectPrepare<
    PgSelectBase<'node', NodeColumns, 'single', never>
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
  async getUserByEmail(email: string): Promise<User | null> {
    const [existing] = await this.getUserByEmailQuery.execute({ email });
    if (!existing) {
      return null;
    }
    return User.existing(existing.email!, existing.name, 0, existing.id);
  }

  async createUser(user: User): Promise<User> {
    const [emailInUse] = await this.getUserByEmailQuery.execute({
      email: user.email,
    });
    if (emailInUse) {
      throw new ConflictException('User already exists');
    }
    const newNode = await this.nodeRepository.addNode(user);
    return User.existing(
      newNode.email!,
      newNode.name,
      newNode.depth,
      newNode.id,
    );
  }
  async addUserToGroup(user: User, group: Group): Promise<void> {
    return this.nodeRepository.addEdge(group, user);
  }
  async getUserById(userId: NodeId): Promise<User> {
    try {
      const node = await this.nodeRepository.getNodeById(userId);
      if (node.type !== 'user') throw new BadRequestException('User not found');
      return User.existing(node.email!, node.name, node.depth, node.id);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      } else if (e instanceof BadRequestException) {
        throw e;
      }
      throw new InternalServerErrorException(e);
    }
  }
}
