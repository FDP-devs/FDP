import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationService } from './invitation.service';
import { Invitation } from './invitation.entity';
import { Group } from '../group/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, Group])],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
