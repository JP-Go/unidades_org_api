import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DRIZZLE, DrizzleDatabase } from '../drizzle.module';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { Group, Node, NodeId, User } from 'src/node/domain/entities/node';
import { edges, node } from '../node.model';
import { and, eq, getTableColumns, gte, lte, sql } from 'drizzle-orm';
import type { PgSelectPrepare, PgSelectBase } from 'drizzle-orm/pg-core';
import type { NodeColumns } from './@types';

@Injectable()
export class DrizzleNodeRepository implements NodeRepository {
  private readonly getNodeByIdQuery: PgSelectPrepare<
    PgSelectBase<'node', NodeColumns, 'single', never>
  >;
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
  ) {
    this.getNodeByIdQuery = this.db
      .select()
      .from(node)
      .where(eq(node.id, sql.placeholder('id')))
      .prepare('get_node_by_id');
  }
  async addEdge(fromNode: Node, toNode: Node): Promise<void> {
    if (fromNode.id === toNode.id) {
      throw new UnprocessableEntityException('Cyclic reference not allowed');
    }
    const fromNodeDb = await this.getNodeById(fromNode.id);
    const toNodeDb = await this.getNodeById(toNode.id);
    await this.ensureSelfReference(fromNodeDb);
    await this.ensureSelfReference(toNodeDb);

    const isCyclic = await this.checkCyclicReference(
      fromNodeDb.id,
      toNodeDb.id,
    );
    if (isCyclic) {
      throw new UnprocessableEntityException('Cyclic reference not allowed');
    }

    const ancestors = await this.getAncestors(fromNodeDb, 0);
    const descendants = await this.getDescendants(toNodeDb, 0);
    await this.db.transaction(async (tx) => {
      await tx.insert(edges).values({
        id: crypto.randomUUID(),
        parentId: fromNodeDb.id,
        childId: toNodeDb.id,
        depth: 1,
      });
      const relatedEdges: (typeof edges.$inferInsert)[] = [];
      for (const a of ancestors) {
        for (const d of descendants) {
          const newDepth = a.depth + d.depth + 1;
          const [existingEdge] = await this.checkEdge(a.id, d.id);

          if (
            !existingEdge ||
            (existingEdge && existingEdge.depth! < newDepth)
          ) {
            relatedEdges.push({
              id: crypto.randomUUID(),
              childId: d.id,
              parentId: a.id,
              depth: newDepth,
            });
          }
        }
      }
      if (relatedEdges.length > 0) {
        await tx
          .insert(edges)
          .values(relatedEdges)
          .onConflictDoUpdate({
            target: [edges.parentId, edges.childId],
            set: {
              depth: sql`EXCLUDED.depth`,
            },
          })
          .execute();
      }
    });
  }

  async getDescendants(
    aNode: Node,
    minDepth: number = 1,
    maxDepth: number = -1,
  ): Promise<Node[]> {
    let query = this.db
      .select({
        ...getTableColumns(node),
        depth: edges.depth,
      })
      .from(node)
      .innerJoin(edges, eq(node.id, edges.childId))
      .where(and(eq(edges.parentId, aNode.id), gte(edges.depth, minDepth)))
      .$dynamic();
    if (maxDepth !== -1) {
      query = query.where(
        and(
          eq(edges.parentId, aNode.id),
          gte(edges.depth, minDepth),
          lte(edges.depth, maxDepth),
        ),
      );
    }
    const results = await query;

    return results.map((r) => {
      const params = {
        name: r.name,
        depth: r.depth!,
      };

      if (r.type === 'user') {
        if (!r.email) {
          throw new UnprocessableEntityException(
            `User with id ${r.id} has no email`,
          );
        }
        return User.existing(r.email, r.name, params.depth, r.id);
      }

      if (r.type === 'group') {
        return Group.existing(params.name, params.depth, r.id);
      }

      throw new UnprocessableEntityException(`Invalid node type`);
    });
  }
  async getAncestors(
    aNode: Node,
    minDepth: number = 1,
    maxDepth: number = -1,
  ): Promise<Node[]> {
    let query = this.db
      .select({
        ...getTableColumns(node),
        depth: edges.depth,
      })
      .from(node)
      .innerJoin(edges, eq(node.id, edges.parentId))
      .where(and(eq(edges.childId, aNode.id), gte(edges.depth, minDepth)))
      .$dynamic();
    if (maxDepth !== -1) {
      query = query.where(
        and(
          eq(edges.childId, aNode.id),
          gte(edges.depth, minDepth),
          lte(edges.depth, maxDepth),
        ),
      );
    }
    const results = await query;

    return results.map((r) => {
      const params = {
        name: r.name,
        depth: r.depth!,
      };

      if (r.type === 'user') {
        if (!r.email) {
          throw new UnprocessableEntityException(
            `User with id ${r.id} has no email`,
          );
        }
        return User.existing(r.email, r.name, params.depth, r.id);
      }

      if (r.type === 'group') {
        return Group.existing(params.name, params.depth, r.id);
      }

      throw new UnprocessableEntityException(`Invalid node type`);
    });
  }
  async addNode(aNode: Node): Promise<Node> {
    const savedNode = await this.db.transaction(async (tx) => {
      const insertValue: typeof node.$inferInsert = {
        id: crypto.randomUUID(),
        name: aNode.name,
        type: aNode.type,
        createdAt: new Date(),
      };
      if (aNode.type === 'user') {
        insertValue.email = (aNode as User).email;
      }
      const [saved] = await tx
        .insert(node)
        .values({ ...insertValue })
        .returning();
      if (!saved) {
        throw new InternalServerErrorException('Failed to save node');
      }
      await tx.insert(edges).values({
        id: crypto.randomUUID(),
        childId: saved.id,
        parentId: saved.id,
        depth: 0,
      });

      return {
        ...saved,
        depth: 0,
      };
    });

    return new Node(
      {
        depth: savedNode.depth,
        name: savedNode.name,
        type: savedNode.type,
        email: savedNode.email,
      },
      savedNode.id,
    );
  }
  async getNodeById(id: NodeId): Promise<Node> {
    const [nd] = await this.getNodeByIdQuery.execute({ id });
    if (!nd) {
      throw new NotFoundException(`Node with ${id} not found.`);
    }
    return new Node(
      {
        depth: 0,
        name: nd.name,
        type: nd.type,
        email: nd.email,
      },
      nd.id,
    );
  }

  private async checkCyclicReference(parentId: NodeId, childId: NodeId) {
    const result = await this.checkEdge(childId, parentId);

    return result.length > 0;
  }

  private async checkEdge(parentId: NodeId, childId: NodeId) {
    const result = await this.db
      .select()
      .from(edges)
      .where(and(eq(edges.parentId, parentId), eq(edges.childId, childId)));

    return result;
  }

  private async ensureSelfReference(aNode: Node) {
    await this.db
      .insert(edges)
      .values({
        id: crypto.randomUUID(),
        childId: aNode.id,
        parentId: aNode.id,
        depth: 0,
      })
      .onConflictDoNothing();
  }
}
