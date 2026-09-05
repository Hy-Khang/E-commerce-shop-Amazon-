import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SellerApplicationRepository } from './repositories/seller-application.repository';
import { CreateSellerApplicationDto } from './dto/create-seller-application.dto';
import { SellerApplicationFilterDto } from './dto/seller-application-filter.dto';
import { SellerApplication } from './entities/seller-application.entity';
import { SellerApplicationStatus } from './types/seller-application.types';
import { AuthService } from '../auth/auth.service';
import { ShopService } from '../shop/shop.service';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

const SELLER_ROLE_NAME = 'seller';

@Injectable()
export class SellerApplicationService {
  private readonly logger = new Logger(SellerApplicationService.name);

  constructor(
    private readonly repo: SellerApplicationRepository,
    private readonly authService: AuthService,
    private readonly shopService: ShopService,
  ) {}

  // ─── Customer ───

  async apply(
    userId: number,
    roleId: number,
    dto: CreateSellerApplicationDto,
  ): Promise<SellerApplication> {
    const sellerRoleId =
      await this.authService.resolveRoleIdByName(SELLER_ROLE_NAME);

    if (roleId === sellerRoleId) {
      throw new ConflictException({
        code: 'SELLER_APP_002',
        message: 'You are already a seller',
      });
    }

    const existingShop =
      await this.shopService.findShopByUserIdOrNull(userId);
    if (existingShop) {
      throw new ConflictException({
        code: 'SELLER_APP_002',
        message: 'You are already a seller',
      });
    }

    const hasPending = await this.repo.existsPendingByUserId(userId);
    if (hasPending) {
      throw new ConflictException({
        code: 'SELLER_APP_003',
        message: 'You already have a pending application',
      });
    }

    const application = await this.repo.create({
      user_id: userId,
      status: SellerApplicationStatus.Pending,
      shop_name: dto.shop_name,
      phone: dto.phone,
      business_name: dto.business_name ?? null,
      tax_id: dto.tax_id ?? null,
      description: dto.description ?? null,
      logo_url: dto.logo_url ?? null,
      banner_url: dto.banner_url ?? null,
    });

    this.logger.log(
      `Seller application #${application.id} submitted by user ${userId}`,
    );
    return application;
  }

  async getMine(userId: number): Promise<SellerApplication | null> {
    return this.repo.findLatestByUserId(userId);
  }

  // ─── Admin ───

  async listForAdmin(
    filter: SellerApplicationFilterDto,
  ): Promise<IPaginatedResult<SellerApplication>> {
    return this.repo.findPaginated({
      status: filter.status,
      page: filter.page,
      limit: filter.limit,
    });
  }

  async getByIdForAdmin(id: number): Promise<SellerApplication> {
    const application = await this.repo.findById(id);
    if (!application) {
      throw new NotFoundException({
        code: 'SELLER_APP_001',
        message: 'Seller application not found',
      });
    }
    return application;
  }

  /**
   * Approve an application: grant the seller role + materialize an active shop,
   * then mark the application approved. The shop is created first (SHOP_002
   * guards the 1:1 constraint); if the user somehow already has a shop it is
   * reused, so a retry after a partial failure is safe.
   */
  async approve(id: number, adminId: number): Promise<SellerApplication> {
    const application = await this.getByIdForAdmin(id);
    if (application.status !== SellerApplicationStatus.Pending) {
      throw new BadRequestException({
        code: 'SELLER_APP_004',
        message: 'Only pending applications can be reviewed',
      });
    }

    const sellerRoleId =
      await this.authService.resolveRoleIdByName(SELLER_ROLE_NAME);

    const existingShop = await this.shopService.findShopByUserIdOrNull(
      application.user_id,
    );
    if (!existingShop) {
      await this.shopService.createShopFromApplication(
        application.user_id,
        {
          name: application.shop_name,
          description: application.description,
          logo_url: application.logo_url,
          banner_url: application.banner_url,
        },
        adminId,
      );
    }

    await this.authService.changeUserRole(application.user_id, {
      role_id: sellerRoleId,
    });

    await this.repo.update(id, {
      status: SellerApplicationStatus.Approved,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    this.logger.log(
      `Seller application #${id} approved by admin ${adminId} (user ${application.user_id} is now a seller)`,
    );

    return this.getByIdForAdmin(id);
  }

  async reject(
    id: number,
    adminId: number,
    rejectReason?: string,
  ): Promise<SellerApplication> {
    const application = await this.getByIdForAdmin(id);
    if (application.status !== SellerApplicationStatus.Pending) {
      throw new BadRequestException({
        code: 'SELLER_APP_004',
        message: 'Only pending applications can be reviewed',
      });
    }

    await this.repo.update(id, {
      status: SellerApplicationStatus.Rejected,
      reject_reason: rejectReason ?? null,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    this.logger.log(`Seller application #${id} rejected by admin ${adminId}`);

    return this.getByIdForAdmin(id);
  }
}
