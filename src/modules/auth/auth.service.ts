import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { parseTimeToSeconds } from '@common/utils/time';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password' | 'currentRefreshTokenHash'>> {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Return user without password or refresh token hash
    const { password: _, currentRefreshTokenHash: __, ...result } = savedUser;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      } // Explicitly select password which is hidden by default
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Update refresh token in DB
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      email: user.email,
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Find user and explicitly select refresh token hash
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        currentRefreshTokenHash: true,
      }
    });

    if (!user || !user.currentRefreshTokenHash) {
      throw new UnauthorizedException('Access denied or user not found');
    }

    // Compare refresh tokens
    const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.currentRefreshTokenHash);
    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Update refresh token hash in DB
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      currentRefreshTokenHash: undefined,
    });
  }

  // Helper method to generate access and refresh tokens
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super-secret-access-token-key-change-me-in-production',
        expiresIn: parseTimeToSeconds(this.configService.get<string>('JWT_ACCESS_EXPIRATION'), 900), // 15m default (900 seconds)
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-token-key-change-me-in-production',
        expiresIn: parseTimeToSeconds(this.configService.get<string>('JWT_REFRESH_EXPIRATION'), 604800), // 7d default (604800 seconds)
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Helper method to update refresh token hash in DB
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      currentRefreshTokenHash: hashedRefreshToken,
    });
  }

  // Utility method to verify a refresh token external to guards
  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-token-key-change-me-in-production',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
