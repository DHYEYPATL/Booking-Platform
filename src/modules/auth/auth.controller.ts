import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Email address already in use.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get tokens' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated. Returns tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    // 1. Verify the refresh token first
    const payload = await this.authService.verifyRefreshToken(refreshDto.refreshToken);
    
    // 2. Perform rotation and return new tokens
    return this.authService.refreshTokens(payload.sub, refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@Req() req: any) {
    const userId = req.user.userId;
    await this.authService.logout(userId);
    return { message: 'Successfully logged out' };
  }
}
