import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DrizzleNodeRepository } from './drizzle-node.repository';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { DRIZZLE, type DrizzleDatabase } from '../drizzle.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Group, User } from 'src/node/domain/entities/node';
import { edges, node } from '../node.model';
import { and, eq } from 'drizzle-orm';
import { UnprocessableEntityException } from '@nestjs/common';

describe('DrizzleNodeRepository Integration Tests', () => {
  let repository: NodeRepository;
  let db: DrizzleDatabase;
  let container: StartedPostgreSqlContainer;
  let pool: Pool;

  beforeAll(async () => {
    const containerDef = new PostgreSqlContainer('postgres:16-alpine');
    container = await containerDef.start();
    pool = new Pool({
      connectionString: container.getConnectionUri(),
    });
    db = drizzle(pool, { logger: true });
    await migrate(db, { migrationsFolder: './src/migrations' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        DrizzleNodeRepository,
        {
          provide: DRIZZLE,
          useValue: db,
        },
      ],
    }).compile();

    repository = moduleRef.get<DrizzleNodeRepository>(DrizzleNodeRepository);
  }, 60000);

  afterAll(async () => {
    await pool.end();
    await container!.stop();
  });

  beforeEach(async () => {
    await db.delete(edges);
    await db.delete(node);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('addNode', () => {
    it('should add a new node and its self-reference edge', async () => {
      const group = Group.create('Group 1');
      const savedNode = await repository.addNode(group);

      expect(savedNode.id).toBeDefined();
      expect(savedNode.name).toBe('Group 1');

      const nodeInDb = await repository.getNodeById(savedNode.id);
      expect(nodeInDb).toBeDefined();
      expect(nodeInDb.name).toBe(savedNode.name);

      const selfEdge = await db
        .select()
        .from(edges)
        .where((e) =>
          and(eq(e.parentId, savedNode.id), eq(e.childId, savedNode.id)),
        );
      expect(selfEdge).toHaveLength(1);
      expect(selfEdge[0]!.depth).toBe(0);
    });
  });

  describe('getNodeById', () => {
    it('should return a node by its ID', async () => {
      const user = User.create('user@test.com', 'User 1');
      const savedNode = await repository.addNode(user);

      const foundNode = await repository.getNodeById(savedNode.id);

      expect(foundNode).toBeDefined();
      expect(foundNode.id).toBe(savedNode.id);
      expect(foundNode.name).toBe('User 1');
    });

    it('should throw NotFoundException for a non-existent ID', async () => {
      await expect(repository.getNodeById(15)).rejects.toThrow(
        'Node with 15 not found.',
      );
    });
  });

  describe('addEdge', () => {
    it('should create an edge between two nodes and all related edges for ancestors and descendants', async () => {
      const root = await repository.addNode(Group.create('Root'));
      const parent = await repository.addNode(Group.create('Parent'));
      const child = await repository.addNode(Group.create('Child'));
      const grandchild = await repository.addNode(Group.create('Grandchild'));

      await repository.addEdge(root, parent);
      await repository.addEdge(parent, child);
      await repository.addEdge(child, grandchild);

      const rootDescendants = await repository.getDescendants(root);
      expect(rootDescendants).toHaveLength(3);
      const parentDescendants = await repository.getDescendants(parent);
      expect(parentDescendants).toHaveLength(2);
      const childDescendants = await repository.getDescendants(child);
      expect(childDescendants).toHaveLength(1);

      const grandchildAncestors = await repository.getAncestors(grandchild);
      expect(grandchildAncestors).toHaveLength(3);
    });

    it('should not create a cyclic reference', async () => {
      const nodeA = await repository.addNode(Group.create('A'));
      const nodeB = await repository.addNode(Group.create('B'));

      await repository.addEdge(nodeA, nodeB);
      await expect(repository.addEdge(nodeB, nodeA)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('getDescendants', () => {
    it('should return all descendants of a given node', async () => {
      const parent = await repository.addNode(Group.create('Parent'));
      const child1 = await repository.addNode(Group.create('Child 1'));
      const child2 = await repository.addNode(
        User.create('child2@test.com', 'Child 2'),
      );
      const grandchild = await repository.addNode(Group.create('Grandchild'));

      await repository.addEdge(parent, child1);
      await repository.addEdge(parent, child2);
      await repository.addEdge(child1, grandchild);

      const descendants = await repository.getDescendants(parent);

      expect(descendants).toHaveLength(3);
      expect(descendants.map((d) => d.name).sort()).toEqual(
        ['Child 1', 'Child 2', 'Grandchild'].sort(),
      );

      const child1Descendants = await repository.getDescendants(child1);
      expect(child1Descendants).toHaveLength(1);
      expect(child1Descendants[0]!.name).toBe('Grandchild');
      const child2Descendants = await repository.getDescendants(child2);
      expect(child2Descendants).toHaveLength(0);
    });
    it('should return imediate descendants of a given node', async () => {
      const parent = await repository.addNode(Group.create('Parent'));
      const child1 = await repository.addNode(Group.create('Child 1'));
      const child2 = await repository.addNode(
        User.create('child2@test.com', 'Child 2'),
      );
      const grandchild = await repository.addNode(Group.create('Grandchild'));

      await repository.addEdge(parent, child1);
      await repository.addEdge(parent, child2);
      await repository.addEdge(child1, grandchild);

      const descendants = await repository.getDescendants(parent, 1, 1);

      expect(descendants).toHaveLength(2);
      expect(descendants.map((d) => d.name).sort()).toEqual([
        'Child 1',
        'Child 2',
      ]);

      const child1Descendants = await repository.getDescendants(child1, 1, 2);
      expect(child1Descendants).toHaveLength(1);
      expect(child1Descendants[0]!.name).toBe('Grandchild');
    });
  });

  describe('getAncestors', () => {
    it('should return all ancestors of a given node', async () => {
      const root = await repository.addNode(Group.create('Root'));
      const parent = await repository.addNode(Group.create('Parent'));
      const child = await repository.addNode(Group.create('Child'));
      const grandChild = await repository.addNode(Group.create('Grandchild'));

      await repository.addEdge(root, parent);
      await repository.addEdge(parent, child);
      await repository.addEdge(child, grandChild);

      const ancestors = await repository.getAncestors(grandChild);

      expect(ancestors).toHaveLength(3);
      expect(ancestors.map((a) => a.name).sort()).toEqual(
        ['Child', 'Parent', 'Root'].sort(),
      );
      const rootAncestors = await repository.getAncestors(root);
      expect(rootAncestors).toHaveLength(0);
    });
    it('should return imediate ancestors of a given node', async () => {
      const root = await repository.addNode(Group.create('Root'));
      const parent = await repository.addNode(Group.create('Parent'));
      const child = await repository.addNode(Group.create('Child'));
      const grandChild = await repository.addNode(Group.create('Grandchild'));

      await repository.addEdge(root, parent);
      await repository.addEdge(parent, child);
      await repository.addEdge(child, grandChild);

      const ancestors = await repository.getAncestors(grandChild, 1, 1);

      expect(ancestors).toHaveLength(1);
      expect(ancestors.map((a) => a.name).sort()).toEqual(['Child']);
    });
  });
});
