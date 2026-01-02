import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com';
      const mockUser: User = {
        id: 'user-123',
        email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null if user not found', async () => {
      const email = 'notfound@example.com';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const email = 'new@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed-password';
      const mockUser: User = {
        id: 'user-123',
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockRepository.findOne.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(email, password);

      expect(result).toEqual(mockUser);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';
      const existingUser: User = {
        id: 'user-123',
        email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(email, password)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
