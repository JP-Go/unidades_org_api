import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AssociateGroupDto } from './dtos/associate-group.dto';
import { UserService } from 'src/node/application/services/user.service';
import { GroupService } from 'src/node/application/services/group.service';
import { NodeService } from 'src/node/application/services/nodes.service';

@Controller()
export class NodesController {
  constructor(
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly nodesService: NodeService,
  ) {}
  @Post('users')
  @HttpCode(201)
  async createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body.data);
  }

  @Post('groups')
  @HttpCode(201)
  async createGroup(@Body() body: CreateGroupDto) {
    return this.groupService.createGroup(body.data);
  }

  @Post('users/:userId/groups')
  @HttpCode(204)
  async associateNodeWithGroup(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: AssociateGroupDto,
  ) {
    return this.userService.addUserToGroup(userId, body.data.groupId);
  }

  @Get('users/:userId/organizations')
  async getUserOrganizations(@Param('userId', ParseIntPipe) userId: number) {
    return this.groupService.getUserOrganizations(userId);
  }

  @Get('nodes/:nodeId/ancestors')
  async getNodeAncestors(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return this.nodesService.getAncestors(nodeId);
  }

  @Get('nodes/:nodeId/descendants')
  async getNodeDescendants(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return this.nodesService.getDescendants(nodeId);
  }
}
