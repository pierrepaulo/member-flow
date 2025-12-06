import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MemberStatus } from '../../../generated/prisma/client';

export class ListMembersDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}
