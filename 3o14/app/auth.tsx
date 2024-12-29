import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';
import * as Linking from 'expo-linking';
import { StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function Auth() {
  const { handleAuthCode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const server = await StorageService.get('server');
        if (!server) throw new Error('Server URL not found.');

        if (Platform.OS === 'web') {
          const { queryParams } = Linking.parse(window.location.href);
          const authorizationCode = queryParams?.code;
          if (authorizationCode) {
            await handleAuthCode(authorizationCode, server);
            return;
          }
          router.replace('/');
        } else {
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
              const { queryParams } = Linking.parse(initialUrl);
              const authorizationCode = queryParams?.code;
              if (authorizationCode) {
                await handleAuthCode(authorizationCode, server);
                return;
              }
            }

            const subscription = Linking.addEventListener('url', async (event) => {
              const { queryParams } = Linking.parse(event.url);
              const authorizationCode = queryParams?.code;
              if (authorizationCode) {
                await handleAuthCode(authorizationCode, server);
                subscription.remove();
              }
            });

            return () => {
              subscription.remove();
            };
          } catch (err) {
            console.warn('Deep link processing warning:', err);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error('Auth error:', err.message);
        } else {
          console.error('Auth error:', String(err));
        }
        router.replace('/');
      }
    };

    processAuth();
  }, []);

  return <Loading />;
}
