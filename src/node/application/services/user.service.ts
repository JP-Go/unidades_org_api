import { ConflictException, Injectable } from '@nestjs/common';
import { NodeId, User } from 'src/node/domain/entities/node';
import { GroupRepository } from 'src/node/domain/repositories/group.repository';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { type ICreateUserDto } from 'src/node/infrastructure/api/dtos/create-user.dto';

@Injectable()
export abstract class UserService {
  abstract createUser(dto: ICreateUserDto): Promise<User>;
  abstract addUserToGroup(user: NodeId, group: NodeId): Promise<void>;
  abstract getUserById(userId: NodeId): Promise<User>;
}

@Injectable()
export class UserServiceImpl implements UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly groupRepository: GroupRepository,
  ) {}
  async createUser(dto: ICreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.getUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    return await this.userRepository.createUser(
      User.create(dto.email, dto.name),
    );
  }
  async addUserToGroup(user: NodeId, group: NodeId): Promise<void> {
    const [userFound, groupFound] = await Promise.all([
      this.userRepository.getUserById(user),
      this.groupRepository.getGroupById(group),
    ]);
    return this.userRepository.addUserToGroup(userFound, groupFound);
  }
  async getUserById(userId: NodeId): Promise<User> {
    return this.userRepository.getUserById(userId);
  }
}
