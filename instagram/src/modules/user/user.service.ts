import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '../auth/service/jwt.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private userOlderThan13(dob: Date) {
    const today = new Date();
    let currentAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      currentAge--;
    }
    return currentAge >= 13;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Ensure no duplication of email or instaHandle
    const userExists = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { instaHandle: createUserDto.instaHandle },
      ],
    });

    if (userExists) {
      const duplicateField =
        userExists.email === createUserDto.email ? 'email' : 'handle';
      throw new HttpException(
        `User with this ${duplicateField} exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure user is of at least 13 years old
    const dob = new Date(createUserDto.dateOfBirth);
    if (!this.userOlderThan13(dob)) {
      throw new HttpException(
        'User must be older than 13',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure password and confirmPassword fields match
    const passwordMatched: boolean =
      createUserDto.password === createUserDto.confirmPassword ? true : false;
    if (!passwordMatched) {
      throw new HttpException('Pasword does not match', HttpStatus.BAD_REQUEST);
    }

    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      instaHandle: createUserDto.instaHandle,
      DOB: createUserDto.dateOfBirth,
      password: this.jwtService.encodePassword(createUserDto.password),
      avatarUrl: createUserDto.avatarUrl,
    });

    return await this.userRepository.save(user);
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
