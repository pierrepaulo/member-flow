import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Category } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export type CategoryDto = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDto> {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          isActive: dto.isActive ?? true,
        },
      });
      return this.toDto(category);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Nome da categoria já em uso');
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return categories.map((c) => this.toDto(c));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description,
          isActive: dto.isActive,
        },
      });
      return this.toDto(category);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Nome da categoria já em uso');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Categoria não encontrada');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Categoria não encontrada');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Categoria em uso');
        }
      }
      throw error;
    }
  }
}
