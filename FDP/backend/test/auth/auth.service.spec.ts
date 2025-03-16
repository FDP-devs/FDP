import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/domain/auth/auth.service';
import { EmailService } from '../../src/domain/email/email.service';
import { Member } from '../../src/domain/member/member.entity';
import { UnauthorizedException } from '@nestjs/common';
import { SigninDto } from '../../src/domain/auth/dto/signin.dto';

// bcrypt 모듈을 모킹
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

// 모킹된 bcrypt 모듈 가져오기
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let memberRepository: Repository<Member>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Member),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            verifyEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member)
    );

    // 각 테스트 전에 모킹 초기화
    jest.clearAllMocks();
  });

  describe('signin', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      // Given
      const signinDto: SigninDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(null);

      // When & Then
      await expect(authService.signin(signinDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { email: signinDto.email },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Given
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const member = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        isEmailVerified: true,
        role: 'MEMBER',
      };
      jest
        .spyOn(memberRepository, 'findOne')
        .mockResolvedValue(member as Member);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

      // When & Then
      await expect(authService.signin(signinDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { email: signinDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signinDto.password,
        member.password
      );
    });

    it('should return member without password if signin is successful', async () => {
      // Given
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const member = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        isEmailVerified: true,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(memberRepository, 'findOne')
        .mockResolvedValue(member as Member);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      // When
      const result = await authService.signin(signinDto);

      // Then
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { email: signinDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signinDto.password,
        member.password
      );
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: member.id,
        email: member.email,
        isEmailVerified: member.isEmailVerified,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    });

    it('should also allow login for users with unverified email', async () => {
      // Given
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const member = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        isEmailVerified: false,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(memberRepository, 'findOne')
        .mockResolvedValue(member as Member);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      // When
      const result = await authService.signin(signinDto);

      // Then
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { email: signinDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signinDto.password,
        member.password
      );
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: member.id,
        email: member.email,
        isEmailVerified: member.isEmailVerified,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    });
  });
});
