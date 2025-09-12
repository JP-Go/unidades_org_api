import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { AssociateGroupDto } from './dtos/group.dto';

@Controller('users')
export class UserController {
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // TODO: Implement user creation
    return { message: 'User created' };
  }

  @Post(':id/groups')
  async associateGroup(
    @Param('id', ParseIntPipe) userId: number,
    @Body() groupDto: AssociateGroupDto,
  ) {
    // TODO: Implement group association
    return { message: 'Group associated with user' };
  }

  @Get(':id/organizations')
  async getUserOrganizations(@Param('id', ParseIntPipe) userId: number) {
    // TODO: Implement get user organizations
    return { message: 'User organizations retrieved' };
  }
}
