import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateUserDto, CreateUserResponse } from './dtos/create-user.dto';
import { CreateGroupDto, CreateGroupResponse } from './dtos/create-group.dto';
import { AssociateGroupDto } from './dtos/associate-group.dto';
import { UserService } from 'src/node/application/services/user.service';
import { GroupService } from 'src/node/application/services/group.service';
import { NodeService } from 'src/node/application/services/nodes.service';
import { ZodResponse } from 'nestjs-zod';
import { ListOfNodesResponse } from './dtos/node-list.dtos';

@Controller()
export class NodesController {
  constructor(
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly nodesService: NodeService,
  ) {}
  @Post('users')
  @HttpCode(201)
  @ZodResponse({ type: CreateUserResponse })
  async createUser(@Body() body: CreateUserDto) {
    const { id, email, name, type } = await this.userService.createUser(body);
    return {
      id,
      email: email!,
      name,
      type,
    };
  }

  @Post('groups')
  @HttpCode(201)
  @ZodResponse({ type: CreateGroupResponse })
  async createGroup(@Body() body: CreateGroupDto) {
    return this.groupService.createGroup(body);
  }

  @Post('users/:userId/groups')
  @HttpCode(204)
  async associateNodeWithGroup(
    @Param('userId', ParseUUIDPipe)
    userId: string,
    @Body() body: AssociateGroupDto,
  ) {
    return this.userService.addUserToGroup(userId, body.groupId);
  }

  @Get('users/:userId/organizations')
  @ZodResponse({ type: ListOfNodesResponse })
  async getUserOrganizations(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.groupService.getUserOrganizations(userId);
  }

  @Get('nodes/:nodeId/ancestors')
  @ZodResponse({ type: ListOfNodesResponse })
  async getNodeAncestors(@Param('nodeId', ParseUUIDPipe) nodeId: string) {
    return this.nodesService.getAncestors(nodeId);
  }

  @Get('nodes/:nodeId/descendants')
  @ZodResponse({ type: ListOfNodesResponse })
  async getNodeDescendants(@Param('nodeId', ParseUUIDPipe) nodeId: string) {
    return this.nodesService.getDescendants(nodeId);
  }
}
