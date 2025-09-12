import { Injectable } from '@nestjs/common';
import { User } from 'src/node/domain/entities/node';
import { UserRepository } from 'src/node/domain/repositories/user.repository';
import { ICreateUserDto } from 'src/node/infrastructure/api/dtos/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(dto: ICreateUserDto): Promise<User> {
    return this.userRepository.createUser(User.create(dto.email, dto.name, 0));
  }
}
