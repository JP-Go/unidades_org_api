import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AssociateGroupDto } from './dtos/associate-group.dto';
import { UserService } from 'src/node/application/services/user.service';

@Controller()
export class NodesController {
  constructor(private readonly userService: UserService) {}
  @Post('users')
  @HttpCode(201)
  async createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body.data);
  }

  @Post('groups')
  @HttpCode(201)
  async createGroup(@Body() body: CreateGroupDto) {
    // TODO: Implement group creation
    return;
  }

  @Post('users/:nodeId/groups')
  @HttpCode(204)
  async associateNodeWithGroup(
    @Param('nodeId') nodeId: string,
    @Body() body: AssociateGroupDto,
  ) {
    // TODO: Implement node-group association
    return;
  }

  @Get('users/:userId/organizations')
  async getUserOrganizations(@Param('userId') userId: string) {
    // TODO: Implement user organizations retrieval
    return;
  }

  @Get('nodes/:nodeId/ancestors')
  async getNodeAncestors(@Param('nodeId') nodeId: string) {
    // TODO: Implement node ancestors retrieval
    return;
  }

  @Get('nodes/:nodeId/descendants')
  async getNodeDescendants(@Param('nodeId') nodeId: string) {
    // TODO: Implement node descendants retrieval
    return;
  }
}
