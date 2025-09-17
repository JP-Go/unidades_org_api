import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  DRIZZLE,
  type DrizzleDatabase,
} from '../../infrastructure/database/drizzle.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { edges, node } from '../../infrastructure/database/node.model';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { DrizzleNodeRepository } from '../../infrastructure/database/repositories/drizzle-node.repository';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';
import { DrizzleGroupRepository } from '../../infrastructure/database/repositories/drizzle-group.repository';
import { NodeService, NodeServiceImpl } from './nodes.service';
import { Group, User } from 'src/node/domain/entities/node';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { DrizzleUserRepository } from '../../infrastructure/database/repositories/drizzle-user.repository';

describe('NodeService Integration Tests', () => {
  let service: NodeService;
  let groupRepository: GroupRepository;
  let userRepository: UserRepository;
  let db: DrizzleDatabase;
  let container: StartedPostgreSqlContainer;
  let pool: Pool;

  let root: Group, child1: Group, child2: Group, grandChild1: Group, user: User;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    db = drizzle(pool);
    await migrate(db, { migrationsFolder: './src/migrations' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: DRIZZLE, useValue: db },
        { provide: NodeRepository, useClass: DrizzleNodeRepository },
        { provide: GroupRepository, useClass: DrizzleGroupRepository },
        { provide: UserRepository, useClass: DrizzleUserRepository },
        { provide: NodeService, useClass: NodeServiceImpl },
      ],
    }).compile();

    service = moduleRef.get<NodeService>(NodeService);
    groupRepository = moduleRef.get<GroupRepository>(GroupRepository);
    userRepository = moduleRef.get<UserRepository>(UserRepository);
  }, 30000);

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await db.delete(edges);
    await db.delete(node);

    // Setup a hierarchy for tests
    root = await groupRepository.createGroup(Group.create('root'));
    child1 = await groupRepository.createGroup(Group.create('child1'), root.id);
    child2 = await groupRepository.createGroup(Group.create('child2'), root.id);
    grandChild1 = await groupRepository.createGroup(
      Group.create('grandChild1'),
      child1.id,
    );
    user = await userRepository.createUser(
      User.create('user@test.com', 'Test User'),
    );
    await userRepository.addUserToGroup(user, grandChild1);
  });

  describe('getDescendants', () => {
    it('should return all descendants of a node', async () => {
      const descendants = await service.getDescendants(root.id);
      expect(descendants).toHaveLength(4);
      const descendantIds = descendants.map((d) => d.id).sort();
      const expectedIds = [
        child1.id,
        child2.id,
        grandChild1.id,
        user.id,
      ].sort();
      expect(descendantIds).toEqual(expectedIds);
    });

    it('should respect minDepth', async () => {
      const descendants = await service.getDescendants(root.id, 2);
      expect(descendants).toHaveLength(2);
      const descendantIds = descendants.map((d) => d.id).sort();
      const expectedIds = [grandChild1.id, user.id].sort();
      expect(descendantIds).toEqual(expectedIds);
    });

    it('should respect maxDepth', async () => {
      const descendants = await service.getDescendants(root.id, 1, 1);
      expect(descendants).toHaveLength(2);
      const descendantIds = descendants.map((d) => d.id).sort();
      const expectedIds = [child1.id, child2.id].sort();
      expect(descendantIds).toEqual(expectedIds);
    });
  });

  describe('getAncestors', () => {
    it('should return all ancestors of a node', async () => {
      const ancestors = await service.getAncestors(user.id);
      expect(ancestors).toHaveLength(3);
      const ancestorIds = ancestors.map((a) => a.id).sort();
      const expectedIds = [root.id, child1.id, grandChild1.id].sort();
      expect(ancestorIds).toEqual(expectedIds);
    });

    it('should respect minDepth', async () => {
      const ancestors = await service.getAncestors(user.id, 2);
      expect(ancestors).toHaveLength(2);
      const ancestorIds = ancestors.map((a) => a.id).sort();
      const expectedIds = [root.id, child1.id].sort();
      expect(ancestorIds).toEqual(expectedIds);
    });

    it('should respect maxDepth', async () => {
      const ancestors = await service.getAncestors(user.id, 1, 1);
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe(grandChild1.id);
    });
  });
});
