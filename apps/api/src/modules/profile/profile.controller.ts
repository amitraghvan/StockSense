import { Controller, Get, Put, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdateProfileSchema } from '@stocksense/validation';
import { UpdateProfileDto } from '../auth/dto/auth.dto';
import { JwtAccessPayload } from '@stocksense/types';

@ApiTags('User Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile foundation' })
  @ApiResponse({ status: 200, description: 'Profile details returned' })
  async getProfile(@CurrentUser() user: JwtAccessPayload) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return profile;
  }

  @Put()
  @ApiOperation({ summary: 'Update profile information (display name)' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  @UsePipes(new ZodValidationPipe(UpdateProfileSchema))
  async updateProfile(@CurrentUser() user: JwtAccessPayload, @Body() dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.sub },
      data: { name: dto.name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
