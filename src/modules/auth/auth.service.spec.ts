import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUserRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  });

  const mockJwtService = () => ({
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  });

  const mockConfigService = () => ({
    get: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
        {
          provide: JwtService,
          useFactory: mockJwtService,
        },
        {
          provide: ConfigService,
          useFactory: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should throw ConflictException if email exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'some-uuid' } as User);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should successfully register a new user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const mockSavedUser = {
        id: 'user-uuid',
        email: dto.email,
        password: 'hashedPassword',
      } as User;
      userRepository.create.mockReturnValue(mockSavedUser);
      userRepository.save.mockResolvedValue(mockSavedUser);

      const result = await service.register(dto);
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(dto.email);
      expect(result).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password mismatch', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'uuid',
        email: dto.email,
        password: 'hashed',
      } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login and generate tokens', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: dto.email,
        password: 'hashed',
      } as User;
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jwtService.signAsync
        .mockResolvedValueOnce('accessTokenVal')
        .mockResolvedValueOnce('refreshTokenVal');

      const result = await service.login(dto);
      expect(result).toHaveProperty('accessToken', 'accessTokenVal');
      expect(result).toHaveProperty('refreshToken', 'refreshTokenVal');
      expect(result.userId).toBe(mockUser.id);
      expect(userRepository.update).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if user not found or hash missing', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens('user-uuid', 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token hashes do not match', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'uuid',
        currentRefreshTokenHash: 'hashedHash',
      } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshTokens('uuid', 'wrong-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should rotate tokens if matching', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'uuid',
        currentRefreshTokenHash: 'hashedHash',
      } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jwtService.signAsync
        .mockResolvedValueOnce('newAccessToken')
        .mockResolvedValueOnce('newRefreshToken');

      const result = await service.refreshTokens('uuid', 'matching-token');
      expect(result).toHaveProperty('accessToken', 'newAccessToken');
      expect(result).toHaveProperty('refreshToken', 'newRefreshToken');
      expect(userRepository.update).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash', async () => {
      await service.logout('user-uuid');
      expect(userRepository.update).toHaveBeenCalledWith('user-uuid', {
        currentRefreshTokenHash: undefined,
      });
    });
  });
});
