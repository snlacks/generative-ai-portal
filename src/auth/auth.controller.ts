import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UseGuards,
  Get,
  UsePipes,
  ValidationPipe,
  Put,
  Param,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './dto/sign-in.dto';
import { RequestOTPDTO } from './dto/one-time-password.dto';
import { Request, Response } from 'express';
import { Public } from '../users/public.decorator';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Roles } from '../roles/roles.decorator';
import { ROLE } from '../roles/roles';
import { CreateUserDTO } from '../users/dto/create-user.dto';
import { UpdatePasswordDTO } from '../users/dto/update-password-dto';
import { SignInPasswordDto } from './dto/sign-in-password.dto';
import { UserResponse } from '../types';
import { HasOneTimePassword } from './types';
import TokenService from '../token/token.service';
import * as assert from 'assert';

const isDevTest =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

@Controller('/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private tokenService: TokenService,
  ) {}

  @Get('/users')
  @Roles(ROLE.ADMIN)
  async getUsers(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Post('/users')
  @UsePipes(new ValidationPipe({ transform: true }))
  @Public()
  async addUser(@Body() user: CreateUserDTO, @Res() res: Response) {
    const newUser = await this.usersService.add(user);
    res.status(201);
    res.send(newUser);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/request-otp')
  async requestOTP(@Body() requestOTPDTO: RequestOTPDTO, @Res() res: Response) {
    try {
      const otpResponse = await this.authService.requestOTP(requestOTPDTO);
      res.cookie(
        TokenService.LOGIN_NAME,
        await this.tokenService.getLoginCookie(otpResponse.oneTimePassword),
        this.tokenService.otpOptions(),
      );
      res.status(201);
      res.send(isDevTest ? otpResponse : null);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() signInDto: SignInDTO,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const { user, token, device } = await this.authService.verifyOTP(
        signInDto.username,
        req.cookies[TokenService.LOGIN_NAME],
        signInDto.one_time_password,
      );

      res.cookie(TokenService.AUTHORIZATION_COOKIE_NAME, token, {
        sameSite: 'strict',
        httpOnly: true,
      });
      res.cookie(
        TokenService.DEVICE_COOKIE_NAME,
        device,
        this.tokenService.deviceOptions(),
      );

      res.send(user);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login-password')
  async loginPassword(
    @Body() signInDto: SignInPasswordDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let user: UserResponse | HasOneTimePassword;
    try {
      const { data: knownDevice } = await this.tokenService.verifyAsync(
        req.cookies[TokenService.DEVICE_COOKIE_NAME],
      );
      user = (await this.authService.loginPasswordOnly(
        signInDto,
      )) as UserResponse;

      assert(knownDevice);
      assert(knownDevice === user.user_id);

      const { token, device } = await this.tokenService.getAuthorizationCookies(
        user as UserResponse,
      );

      res.cookie(
        TokenService.AUTHORIZATION_COOKIE_NAME,
        token,
        this.tokenService.authOptions(),
      );
      res.cookie(
        TokenService.DEVICE_COOKIE_NAME,
        device,
        this.tokenService.deviceOptions(),
      );
    } catch (e) {
      user = (await this.authService.loginPasswordOnly(
        signInDto,
      )) as HasOneTimePassword;
      res.cookie(
        TokenService.LOGIN_NAME,
        await this.tokenService.getLoginCookie(user.oneTimePassword),
        this.tokenService.otpOptions(),
      );
    }
    return res.send(user);
  }

  @Put('/users/password')
  updatePassword(@Body() dto: UpdatePasswordDTO) {
    return this.usersService.changePassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/dev-token')
  async devToken(@Body() user: User, @Res() res: Response) {
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NODE_ENV !== 'test'
    ) {
      return;
    }
    const { token, device } =
      await this.tokenService.getAuthorizationCookies(user);
    res.cookie(
      TokenService.AUTHORIZATION_COOKIE_NAME,
      token,
      this.tokenService.authOptions(),
    );
    res.cookie(
      TokenService.DEVICE_COOKIE_NAME,
      device,
      this.tokenService.deviceOptions(),
    );
    res.send(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    res.send(req['user']);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/sign-out')
  async signOut(@Res() res: Response) {
    res.cookie(TokenService.AUTHORIZATION_COOKIE_NAME, '', {
      ...this.tokenService.authOptions(),
      expires: new Date(0),
    });
    res.send();
  }

  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @Delete('/users/:id')
  async removeUser(@Param() params: { id: string }, @Res() res: Response) {
    await this.usersService.remove(params.id);
    res.status(204);
    res.send();
  }
}
