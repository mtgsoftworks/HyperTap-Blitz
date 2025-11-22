import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.mtgsoftworks.hypertapblitz',
    appName: 'HyperTap Blitz',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#0f172a',
            showSpinner: false,
            androidSpinnerStyle: 'small',
            iosSpinnerStyle: 'small'
        },
        StatusBar: {
            style: 'dark',
            backgroundColor: '#0f172a'
        }
    }
};

export default config;
