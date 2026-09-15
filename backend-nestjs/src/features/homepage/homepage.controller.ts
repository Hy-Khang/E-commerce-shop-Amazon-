import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HomepageService } from './homepage.service';
import { HomepageResponseDto } from './dto/homepage-response.dto';

@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get homepage product sections' })
  @ApiResponse({
    status: 200,
    description:
      'Homepage data with special offers, best sellers, trending, and discover more',
    type: HomepageResponseDto,
  })
  async getHomepage() {
    return this.homepageService.getHomepageData();
  }
}
