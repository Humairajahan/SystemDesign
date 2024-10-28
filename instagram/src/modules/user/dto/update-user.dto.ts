import { PartialType } from '@nestjs/mapped-types';
import { RegistrationDto } from '../../auth/dto/registration.dto';

export class UpdateUserDto extends PartialType(RegistrationDto) {}
