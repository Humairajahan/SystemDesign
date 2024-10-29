import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from './jwt.service';
import { RegistrationDto } from '../dto/registration.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
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

  // UNIFIED RESPONSE FOR AUTH
  async unifiedAuthResponse(user: User) {
    const token: string = this.jwtService.generateToken(user);
    const refreshToken: string = this.jwtService.generateRefreshToken(user);
    return {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      instaHandle: user.instaHandle,
      dateOfBirth: user.DOB,
      token: token,
      refreshToken: refreshToken,
      isVerified: user.isVerified,
    };
  }

  async registration(registrationDto: RegistrationDto): Promise<User> {
    // Ensure no duplication of email or instaHandle
    const userExists = await this.userRepository.findOne({
      where: [
        { email: registrationDto.email },
        { instaHandle: registrationDto.instaHandle },
      ],
    });

    if (userExists) {
      const duplicateField =
        userExists.email === registrationDto.email ? 'email' : 'handle';
      throw new HttpException(
        `User with this ${duplicateField} exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure user is of at least 13 years old
    const dob = new Date(registrationDto.dateOfBirth);
    if (!this.userOlderThan13(dob)) {
      throw new HttpException(
        'User must be older than 13',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure password and confirmPassword fields match
    const passwordMatched: boolean =
      registrationDto.password === registrationDto.confirmPassword
        ? true
        : false;
    if (!passwordMatched) {
      throw new HttpException('Pasword does not match', HttpStatus.BAD_REQUEST);
    }

    const user = this.userRepository.create({
      name: registrationDto.name,
      email: registrationDto.email,
      instaHandle: registrationDto.instaHandle,
      DOB: registrationDto.dateOfBirth,
      password: this.jwtService.encodePassword(registrationDto.password),
      avatarUrl: registrationDto.avatarUrl,
    });

    return await this.userRepository.save(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [
        { email: loginDto.identifier },
        { instaHandle: loginDto.identifier },
      ],
    });

    if (!user) {
      throw new HttpException(
        'Invalid user credentials',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Password Validation
    const passwordValid = this.jwtService.validatePassword(
      loginDto.password,
      user.password,
    );
    if (!passwordValid) {
      throw new HttpException(
        'Invalid user credential',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.unifiedAuthResponse(user);
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
