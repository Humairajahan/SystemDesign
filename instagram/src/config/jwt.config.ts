import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    console.log(configService.get('APP_SECRET'));
    return {
      global: true,
      secret: configService.get('APP_SECRET'),
      signOptions: { expiresIn: configService.get<number>('APP_EXPIRES_IN') },
    };
  },
};
