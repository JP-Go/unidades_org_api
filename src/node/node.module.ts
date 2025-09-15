import { Module } from '@nestjs/common';
import { NodesController } from './infrastructure/api/nodes.controller';
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { UserRepository } from './domain/repositories/user.repository';
import {
  UserService,
  UserServiceImpl,
} from './application/services/user.service';
import { DrizzleNodeRepository } from './infrastructure/database/repositories/drizzle-node.repository';
import {
  GroupService,
  GroupServiceImpl,
} from './application/services/group.service';
import {
  NodeService,
  NodeServiceImpl,
} from './application/services/nodes.service';
import { DrizzleGroupRepository } from './infrastructure/database/repositories/drizzle-group.repository';
import { GroupRepository } from './domain/repositories/group.repository';
import { NodeRepository } from './domain/repositories/node.repository';
import { DrizzleUserRepository } from './infrastructure/database/repositories/drizzle-user.repository';

@Module({
  imports: [DrizzleModule],
  providers: [
    {
      provide: UserRepository,
      useClass: DrizzleUserRepository,
    },
    {
      provide: GroupRepository,
      useClass: DrizzleGroupRepository,
    },
    {
      provide: NodeRepository,
      useClass: DrizzleNodeRepository,
    },
    {
      provide: UserService,
      useClass: UserServiceImpl,
    },
    {
      provide: NodeService,
      useClass: NodeServiceImpl,
    },
    {
      provide: GroupService,
      useClass: GroupServiceImpl,
    },
  ],
  controllers: [NodesController],
})
export class NodeModule {}
