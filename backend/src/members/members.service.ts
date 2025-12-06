import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  Member,
  Category,
  MemberStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMembersDto } from './dto/list-members.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

type MemberWithCategory = Member & { category: Category };

export type MemberDto = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: MemberStatus;
  category: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(member: MemberWithCategory): MemberDto {
    return {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      status: member.status,
      category: {
        id: member.category.id,
        name: member.category.name,
      },
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  async create(dto: CreateMemberDto): Promise<MemberDto> {
    try {
      const member = await this.prisma.member.create({
        data: {
          fullName: dto.fullName.trim(),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone.trim(),
          status: dto.status ?? MemberStatus.ACTIVE,
          category: { connect: { id: dto.categoryId } },
        },
        include: { category: true },
      });
      return this.toDto(member);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Categoria não encontrada');
        }
      }
      throw error;
    }
  }

  async findAll(filters: ListMembersDto): Promise<MemberDto[]> {
    const where: Prisma.MemberWhereInput = {};

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const members = await this.prisma.member.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((member) => this.toDto(member));
  }

  async findOne(id: string): Promise<MemberDto> {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    return this.toDto(member);
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto> {
    const data: Prisma.MemberUpdateInput = {
      fullName: dto.fullName?.trim(),
      email: dto.email?.toLowerCase().trim(),
      phone: dto.phone?.trim(),
      status: dto.status,
    };

    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }

    try {
      const member = await this.prisma.member.update({
        where: { id },
        data,
        include: { category: true },
      });
      return this.toDto(member);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Membro ou categoria não encontrada');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.member.delete({ where: { id } });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Membro não encontrado');
        }
      }
      throw error;
    }
  }
}
