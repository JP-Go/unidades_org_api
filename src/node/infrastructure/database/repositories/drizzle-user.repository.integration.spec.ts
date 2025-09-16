import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DRIZZLE, DrizzleDatabase } from '../drizzle.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Group, User } from 'src/node/domain/entities/node';
import { edges, node } from '../node.model';
import { DrizzleNodeRepository } from './drizzle-node.repository';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { DrizzleUserRepository } from './drizzle-user.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';
import { DrizzleGroupRepository } from './drizzle-group.repository';

describe('DrizzleUserRepository Integration Tests', () => {
  let repository: UserRepository;
  let nodeRepository: NodeRepository;
  let groupRepository: GroupRepository;
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
      ],
    }).compile();

    repository = moduleRef.get<UserRepository>(UserRepository);
    nodeRepository = moduleRef.get<NodeRepository>(NodeRepository);
    groupRepository = moduleRef.get<GroupRepository>(GroupRepository);
  }, 30000);

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await db.delete(edges);
    await db.delete(node);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const user = await repository.createUser(
        User.create('test@test.com', 'Test User'),
      );

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@test.com');
      expect(user.name).toBe('Test User');

      const userInDb = await nodeRepository.getNodeById(user.id);
      expect(userInDb).toBeDefined();
    });

    it('should throw ConflictException if email is already in use', async () => {
      await repository.createUser(User.create('test@test.com', 'Test User'));

      await expect(
        repository.createUser(User.create('test@test.com', 'Another User')),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserById', () => {
    it('should return a user by their ID', async () => {
      const createdUser = await repository.createUser(
        User.create('findme@test.com', 'Find Me'),
      );

      const foundUser = await repository.getUserById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe('findme@test.com');
    });

    it('should throw NotFoundException for a non-existent user ID', async () => {
      await expect(repository.getUserById(crypto.randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addUserToGroup', () => {
    it('should correctly add a user to a group', async () => {
      const user = await repository.createUser(
        User.create('member@test.com', 'Group Member'),
      );
      const group = await groupRepository.createGroup(
        Group.create('Test Group'),
      );

      await repository.addUserToGroup(user, group);

      const descendants = await nodeRepository.getDescendants(group);
      expect(descendants).toHaveLength(1);
      expect(descendants[0]?.id).toBe(user.id);
    });

    it('adding user to group should reflect in user organizations', async () => {
      const user = await repository.createUser(
        User.create('member@test.com', 'Group Member'),
      );
      const root = await groupRepository.createGroup(
        Group.create('Root Group'),
      );
      const parentGroup = await groupRepository.createGroup(
        Group.create('Parent Group'),
        root.id,
      );
      const childGroup = await groupRepository.createGroup(
        Group.create('Child Group'),
        parentGroup.id,
      );

      await repository.addUserToGroup(user, childGroup);

      const organizations = await groupRepository.getUserOrganizations(user.id);

      expect(organizations).toHaveLength(3);
      const orgNames = organizations.map((o) => o.name).sort();
      expect(orgNames).toEqual(
        ['Child Group', 'Parent Group', 'Root Group'].sort(),
      );
    });
  });
});
