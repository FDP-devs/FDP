import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvitationService } from '../../src/domain/invitation/invitation.service';
import { Invitation } from '../../src/domain/invitation/invitation.entity';
import { Group } from '../../src/domain/group/group.entity';
import { BadRequestException } from '@nestjs/common';
import { IsNull } from 'typeorm';

describe('InvitationService', () => {
  let invitationService: InvitationService;

  const mockGroupId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';

  const mockInvitationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockGroupRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: mockInvitationRepository,
        },
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    invitationService = module.get<InvitationService>(InvitationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateInviteLink', () => {
    it('should generate invite link successfully', async () => {
      mockGroupRepository.findOne.mockResolvedValue({
        id: mockGroupId,
        name: 'Test Group',
        deletedAt: null,
      });
      mockInvitationRepository.create.mockReturnValue({
        inviteCode: 'testCode',
        group: { id: mockGroupId },
      });
      mockInvitationRepository.save.mockResolvedValue({
        inviteCode: 'testCode',
        group: { id: mockGroupId },
      });

      const result = await invitationService.generateInviteLink(
        mockGroupId,
        mockUserId
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if group does not exist', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        invitationService.generateInviteLink(mockGroupId, mockUserId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateInvitation', () => {
    const mockInvitation = {
      inviteCode: 'testCode',
      group: { id: mockGroupId, name: 'Test Group' },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    it('should validate invitation successfully', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);

      const result = await invitationService.validateInvitation('testCode');

      expect(result).toEqual(mockInvitation);
      expect(mockInvitationRepository.findOne).toHaveBeenCalledWith({
        where: {
          inviteCode: 'testCode',
          deletedAt: IsNull(),
          expiresAt: expect.any(Object),
        },
        relations: ['group'],
      });
    });

    it('should throw BadRequestException for invalid invite code', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(
        invitationService.validateInvitation('invalidCode')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInvitationInfo', () => {
    const mockInvitation = {
      group: { id: 'group-id', name: 'Test Group' },
      expiresAt: new Date(),
    };

    it('should return invitation info', async () => {
      jest
        .spyOn(invitationService, 'validateInvitation')
        .mockResolvedValue(mockInvitation as any);

      const result = await invitationService.getInvitationInfo('testCode');

      expect(result).toEqual({
        groupId: mockInvitation.group.id,
        groupName: mockInvitation.group.name,
        expiresAt: mockInvitation.expiresAt,
      });
    });
  });

  describe('deactivateInvitation', () => {
    it('should deactivate invitation', async () => {
      const mockInvitation = { inviteCode: 'testCode', isActive: true };
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);

      await invitationService.deactivateInvitation('testCode');

      expect(mockInvitationRepository.save).toHaveBeenCalledWith({
        ...mockInvitation,
        isActive: false,
      });
    });

    it('should do nothing if invitation not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await invitationService.deactivateInvitation('testCode');

      expect(mockInvitationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteInvitation', () => {
    it('should soft delete invitation', async () => {
      const mockInvitation = { id: 'invitation-id', inviteCode: 'testCode' };
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);

      await invitationService.deleteInvitation('testCode');

      expect(mockInvitationRepository.softDelete).toHaveBeenCalledWith({
        id: mockInvitation.id,
      });
    });

    it('should do nothing if invitation not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await invitationService.deleteInvitation('testCode');

      expect(mockInvitationRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
