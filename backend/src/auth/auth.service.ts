import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(
      registerDto.email,
      registerDto.password,
    );

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      return { message: 'Если аккаунт существует, письмо отправлено' };
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.userService.setResetToken(user.id, token, expiry);

    try {
      await this.mailService.sendPasswordResetEmail(user.email, token);
    } catch {
      this.logger.error(`Failed to send reset email to ${user.email}`);
    }

    return { message: 'Если аккаунт существует, письмо отправлено' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findByResetToken(dto.token);

    if (!user) {
      throw new BadRequestException('Недействительный токен сброса');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      await this.userService.clearResetToken(user.id);
      throw new BadRequestException('Срок действия токена истёк');
    }

    await this.userService.resetPassword(user.id, dto.newPassword);

    return { message: 'Пароль успешно изменён' };
  }
}
