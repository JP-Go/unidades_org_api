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
import { UserService, UserServiceImpl } from './user.service';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { DrizzleUserRepository } from '../../infrastructure/database/repositories/drizzle-user.repository';
import { Group } from 'src/node/domain/entities/node';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService Integration Tests', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let groupRepository: GroupRepository;
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
        { provide: DRIZZLE, useValue: db },
        { provide: NodeRepository, useClass: DrizzleNodeRepository },
        { provide: GroupRepository, useClass: DrizzleGroupRepository },
        { provide: UserRepository, useClass: DrizzleUserRepository },
        { provide: UserService, useClass: UserServiceImpl },
      ],
    }).compile();

    service = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get<UserRepository>(UserRepository);
    groupRepository = moduleRef.get<GroupRepository>(GroupRepository);
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

  describe('createUser', () => {
    it('should create a user', async () => {
      const user = await service.createUser({
        email: 'test@test.com',
        name: 'Test User',
      });
      expect(user).toBeDefined();
      expect(user.email).toBe('test@test.com');
      expect(user.name).toBe('Test User');

      const userInDb = await userRepository.getUserById(user.id);
      expect(userInDb).toBeDefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      await service.createUser({ email: 'test@test.com', name: 'Test User' });
      await expect(
        service.createUser({ email: 'test@test.com', name: 'Another User' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const createdUser = await service.createUser({
        email: 'findme@test.com',
        name: 'Find Me',
      });
      const foundUser = await service.getUserById(createdUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.getUserById(crypto.randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addUserToGroup', () => {
    it('should add a user to a group', async () => {
      const user = await service.createUser({
        email: 'member@test.com',
        name: 'Group Member',
      });
      const group = await groupRepository.createGroup(
        Group.create('Test Group'),
      );

      await service.addUserToGroup(user.id, group.id);

      const descendants = await nodeRepository.getDescendants(group);
      expect(descendants).toHaveLength(1);
      expect(descendants[0].id).toBe(user.id);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const group = await groupRepository.createGroup(
        Group.create('Test Group'),
      );
      await expect(
        service.addUserToGroup(crypto.randomUUID(), group.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if group does not exist', async () => {
      const user = await service.createUser({
        email: 'member@test.com',
        name: 'Group Member',
      });
      await expect(
        service.addUserToGroup(user.id, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
