import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { Invitation } from './invitation.entity';
import { Group } from '../group/group.entity';

@Injectable()
export class InvitationService {
  private static readonly INVITE_CHARACTERS =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private static readonly CODE_LENGTH = 8;

  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>
  ) {}

  async generateInviteLink(groupId: string, userId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, deletedAt: IsNull() },
    });
    if (!group) {
      throw new BadRequestException('존재하지 않는 그룹입니다.');
    }

    const inviteCode = await this.generateUniqueCode();
    const invitation = this.invitationRepository.create({
      inviteCode,
      group: { id: groupId },
      createdById: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 유효
    });

    return await this.invitationRepository.save(invitation);
  }

  async validateInvitation(inviteCode: string) {
    const invitation = await this.invitationRepository.findOne({
      where: {
        inviteCode,
        deletedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['group'],
    });

    if (!invitation || invitation.group.deletedAt) {
      throw new BadRequestException('유효하지 않은 초대 링크입니다.');
    }

    return invitation;
  }

  async getInvitationInfo(inviteCode: string) {
    const invitation = await this.validateInvitation(inviteCode);
    return {
      groupId: invitation.group.id,
      groupName: invitation.group.name,
      expiresAt: invitation.expiresAt,
    };
  }

  async deactivateInvitation(inviteCode: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { inviteCode, deletedAt: IsNull() },
    });

    if (invitation) {
      invitation.isActive = false;
      await this.invitationRepository.save(invitation);
    }
  }

  async deleteInvitation(inviteCode: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { inviteCode, deletedAt: IsNull() },
    });

    if (invitation) {
      invitation.deletedAt = new Date();
      await this.invitationRepository.save(invitation);
    }
  }

  private async generateUniqueCode(): Promise<string> {
    let isUnique = false;
    let inviteCode = '';

    while (!isUnique) {
      inviteCode = Array.from(
        { length: InvitationService.CODE_LENGTH },
        () =>
          InvitationService.INVITE_CHARACTERS[
            Math.floor(
              Math.random() * InvitationService.INVITE_CHARACTERS.length
            )
          ]
      ).join('');

      const existingInvitation = await this.invitationRepository.findOne({
        where: { inviteCode, deletedAt: IsNull() },
      });

      isUnique = !existingInvitation;
    }

    return inviteCode;
  }
}
