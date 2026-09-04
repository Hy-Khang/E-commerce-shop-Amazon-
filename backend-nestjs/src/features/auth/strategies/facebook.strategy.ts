import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { IOAuthProfile } from '../types/auth.types';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.facebook.appId')!,
      clientSecret: configService.get<string>('oauth.facebook.appSecret')!,
      callbackURL: configService.get<string>('oauth.facebook.callbackUrl')!,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'displayName'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): void {
    const email = profile.emails?.[0]?.value;
    const oauthProfile: IOAuthProfile = {
      provider: 'facebook',
      providerId: profile.id,
      email: email || '',
      fullName:
        profile.displayName ||
        `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
    };
    done(null, oauthProfile);
  }
}
