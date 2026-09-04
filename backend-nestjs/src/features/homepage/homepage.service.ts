import { Injectable, Logger } from '@nestjs/common';
import { HomepageRepository } from './repositories/homepage.repository';
import type { IHomepageData } from './types/homepage.types';

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);

  constructor(private readonly homepageRepository: HomepageRepository) {}

  async getHomepageData(): Promise<IHomepageData> {
    const results = await Promise.allSettled([
      this.homepageRepository.getSpecialOffers(12),
      this.homepageRepository.getBestSellers(8),
      this.homepageRepository.getTrending(8),
      this.homepageRepository.getDiscoverMore(8),
    ]);

    const sectionNames = [
      'specialOffers',
      'bestSellers',
      'trending',
      'discoverMore',
    ];
    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Homepage section "${sectionNames[i]}" failed: ${result.reason}`,
        );
      }
    }

    return {
      specialOffers: results[0].status === 'fulfilled' ? results[0].value : [],
      bestSellers: results[1].status === 'fulfilled' ? results[1].value : [],
      trending: results[2].status === 'fulfilled' ? results[2].value : [],
      discoverMore: results[3].status === 'fulfilled' ? results[3].value : [],
    };
  }
}
