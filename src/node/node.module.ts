import { Module } from '@nestjs/common';
import { NodesController } from './infrastructure/api/nodes.controller';
import { DrizzleNodeRepository } from './infrastructure/database/repositories/drizzle-node-repository';
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { UserRepository } from './domain/repositories/user.repository';
import { UserService } from './application/services/user.service';

@Module({
  imports: [DrizzleModule],
  providers: [
    {
      provide: UserRepository,
      useClass: DrizzleNodeRepository,
    },
    UserService,
  ],
  controllers: [NodesController],
})
export class NodeModule {}
