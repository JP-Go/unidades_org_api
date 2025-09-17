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
import { GroupService, GroupServiceImpl } from './group.service';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { DrizzleUserRepository } from '../../infrastructure/database/repositories/drizzle-user.repository';
import { User } from 'src/node/domain/entities/node';

describe('GroupService Integration Tests', () => {
  let service: GroupService;
  let userRepository: UserRepository;
  let nodeRepository: NodeRepository;
  let db: DrizzleDatabase;
  let container: StartedPostgreSqlContainer;
  let pool: Pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
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
          provide: GroupRepository,
          useClass: DrizzleGroupRepository,
        },
        {
          provide: UserRepository,
          useClass: DrizzleUserRepository,
        },
        {
          provide: GroupService,
          useClass: GroupServiceImpl,
        },
      ],
    }).compile();

    service = moduleRef.get<GroupService>(GroupService);
    userRepository = moduleRef.get<UserRepository>(UserRepository);
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
      const group = await service.createGroup({ name: 'Test Group' });

      expect(group).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.id).toBeDefined();
    });

    it('should create a group with a parent', async () => {
      const parentGroup = await service.createGroup({ name: 'Parent Group' });
      const childGroup = await service.createGroup(
        { name: 'Child Group' },
        parentGroup.id,
      );

      expect(childGroup).toBeDefined();
      const ancestors = await nodeRepository.getAncestors(childGroup);
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe(parentGroup.id);
    });
  });

  describe('getUserOrganizations', () => {
    it('should return all organizations for a user', async () => {
      const user = await userRepository.createUser(
        User.create('user@test.com', 'Test User'),
      );
      const org1 = await service.createGroup({ name: 'Org 1' });
      const org2 = await service.createGroup({ name: 'Org 2' }, org1.id);
      const org3 = await service.createGroup({ name: 'Org 3' }, org2.id);

      await userRepository.addUserToGroup(user, org3);

      const organizations = await service.getUserOrganizations(user.id);
      expect(organizations).toHaveLength(3);
      const orgNames = organizations.map((o) => o.name).sort();
      expect(orgNames).toEqual(['Org 1', 'Org 2', 'Org 3'].sort());
    });

    it('should respect maxDepth', async () => {
      const user = await userRepository.createUser(
        User.create('user@test.com', 'Test User'),
      );
      const org1 = await service.createGroup({ name: 'Org 1' });
      const org2 = await service.createGroup({ name: 'Org 2' }, org1.id);
      const org3 = await service.createGroup({ name: 'Org 3' }, org2.id);

      await userRepository.addUserToGroup(user, org3);

      const organizations = await service.getUserOrganizations(user.id, 2);
      expect(organizations).toHaveLength(2);
      const orgNames = organizations.map((o) => o.name).sort();
      expect(orgNames).toEqual(['Org 2', 'Org 3'].sort());
    });
  });
});
