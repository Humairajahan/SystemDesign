import { Injectable } from '@nestjs/common';
import { JwtService as Jwt } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class JwtService {
  constructor(private readonly jwt: Jwt) {}

  // Encode Password
  public encodePassword(password: string): string {
    const salt: string = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  // Validate Password
  public validatePassword(password: string, userPassword: string): boolean {
    return bcrypt.compareSync(password, userPassword);
  }

  // Generate JWT access token
  public generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
    };
    return this.jwt.sign(payload);
  }
}
