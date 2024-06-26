import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsModule } from '../sms/sms.module';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import TokenModule from '../token/token.module';
import MailModule from '../mail/mail.module';

@Module({
  imports: [UsersModule, SmsModule, TokenModule, MailModule],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}

/**
 *
 * auth guard, checks for presence of cookie, set request user for consumption. Rejects if invalid
 *
 * request-otp, { email, phone number }
 * [TODO] request-otp-with-password, { email, password } -> if has valid but expired token, sets
 * login-with-one-time-password, { email, one time password } -> sets http only
 */
