import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
import { DrizzleGroupRepository } from './drizzle-group.repository';
import { DrizzleNodeRepository } from './drizzle-node.repository';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { DrizzleUserRepository } from './drizzle-user.repository';

describe('DrizzleGroupRepository Integration Tests', () => {
  let repository: GroupRepository;
  let nodeRepository: NodeRepository;
  let db: DrizzleDatabase;
  let container: StartedPostgreSqlContainer;
  let pool: Pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({
      connectionString: container.getConnectionUri(),
    });
    db = drizzle(pool);
    await migrate(db, { migrationsFolder: './src/migrations' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DRIZZLE,
          useValue: db,
        },
        {
          provide: NodeRepository,
          useClass: DrizzleNodeRepository,
        },
        {
          provide: UserRepository,
          useClass: DrizzleUserRepository,
        },
        DrizzleGroupRepository,
      ],
    }).compile();

    repository = moduleRef.get<DrizzleGroupRepository>(DrizzleGroupRepository);
    nodeRepository = moduleRef.get<NodeRepository>(NodeRepository);
  }, 30000);

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await db.delete(edges);
    await db.delete(node);
  });

  describe('createGroup', () => {
    it('should create a group without a parent', async () => {
      const group = await repository.createGroup(Group.create('Root Group'));

      expect(group).toBeDefined();
      expect(group.id).toBeDefined();
      expect(group.name).toBe('Root Group');

      const ancestors = await nodeRepository.getAncestors(group);
      expect(ancestors).toHaveLength(0);
    });

    it('should create a group with a parent', async () => {
      const parentGroup = await repository.createGroup(
        Group.create('Parent Group'),
      );
      const childGroup = await repository.createGroup(
        Group.create('Child Group'),
        parentGroup.id,
      );

      const grandChildGroup = await repository.createGroup(
        Group.create('Grandchild Group'),
        childGroup.id,
      );
      expect(grandChildGroup).toBeDefined();
      expect(grandChildGroup.name).toBe('Grandchild Group');

      const ancestors = await nodeRepository.getAncestors(grandChildGroup, 1);
      expect(ancestors).toHaveLength(2);
    });
  });

  describe('getUserOrganizations', () => {
    it('should return immediate and inherited groups for a user', async () => {
      // 1. Create user
      const user = await nodeRepository.addNode(
        User.create('test@user.com', 'Test User'),
      );

      // 2. Create group hierarchy
      const rootGroup = await repository.createGroup(Group.create('Root'));
      const childGroup = await repository.createGroup(
        Group.create('Child'),
        rootGroup.id,
      );
      const grandchildGroup = await repository.createGroup(
        Group.create('Grandchild'),
        childGroup.id,
      );

      // 3. Add user to the lowest-level group
      await nodeRepository.addEdge(grandchildGroup, user);

      // 4. Get user organizations
      const organizations = await repository.getUserOrganizations(user.id);

      // 5. Assert results
      expect(organizations).toHaveLength(3);
      const orgNames = organizations.map((org) => org.name).sort();
      expect(orgNames).toEqual(['Child', 'Grandchild', 'Root'].sort());
    });

    it('should return only immediate groups if specified', async () => {
      const user = await nodeRepository.addNode(
        User.create('test@user.com', 'Test User'),
      );
      const rootGroup = await repository.createGroup(Group.create('Root'));
      const childGroup = await repository.createGroup(
        Group.create('Child'),
        rootGroup.id,
      );
      await nodeRepository.addEdge(childGroup, user);

      const organizations = await repository.getUserOrganizations(user.id, 1);

      expect(organizations).toHaveLength(1);
      expect(organizations[0]?.name).toBe('Child');
    });

    it('should return an empty array if user belongs to no groups', async () => {
      const user = await nodeRepository.addNode(
        User.create('lonely@user.com', 'Lonely User'),
      );
      await repository.createGroup(Group.create('Some Group'));

      const organizations = await repository.getUserOrganizations(user.id);

      expect(organizations).toHaveLength(0);
    });
  });
});
