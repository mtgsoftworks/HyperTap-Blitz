import { AdMob, AdMobRewardItem, RewardAdOptions, InterstitialAdPluginEvents, AdMobError, RewardAdPluginEvents } from '@capacitor-community/admob';
import { isNative } from './platform';

// AdMob Production Ad Unit IDs
const AD_UNITS = {
    REWARDED: 'ca-app-pub-2923372871861852/8301227078', // HTB_And_Rewarded_GameOverRevive
    INTERSTITIAL: 'ca-app-pub-2923372871861852/8967441480', // HTB_And_Inter_GameLoop
};

export type AdRewardType = 'revive' | 'double_stars';

interface AdState {
    isInitialized: boolean;
    rewardedAdLoaded: boolean;
    interstitialAdLoaded: boolean;
    isShowingAd: boolean;
}

class AdMobService {
    private state: AdState = {
        isInitialized: false,
        rewardedAdLoaded: false,
        interstitialAdLoaded: false,
        isShowingAd: false,
    };

    private rewardCallback: ((success: boolean, type: AdRewardType, reward?: AdMobRewardItem) => void) | null = null;
    private interstitialCallback: (() => void) | null = null;
    private currentRewardType: AdRewardType | null = null;

    async initialize(): Promise<void> {
        if (!isNative()) {
            console.log('[AdMob] Not running on native platform, ads disabled');
            return;
        }

        if (this.state.isInitialized) {
            console.log('[AdMob] Already initialized');
            return;
        }

        try {
            await AdMob.initialize({
                testingDevices: [],
                initializeForTesting: false, // PRODUCTION MODE
            });

            this.state.isInitialized = true;
            console.log('[AdMob] Initialized successfully');

            this.setupAdListeners();
            await this.preloadAds();
        } catch (error) {
            console.error('[AdMob] Initialization failed:', error);
        }
    }

    private setupAdListeners(): void {
        AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            console.log('[AdMob] Rewarded ad loaded');
            this.state.rewardedAdLoaded = true;
        });

        AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
            console.log('[AdMob] User earned reward:', reward);
            if (this.rewardCallback && this.currentRewardType) {
                this.rewardCallback(true, this.currentRewardType, reward);
            }
        });

        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            console.log('[AdMob] Rewarded ad dismissed');
            this.state.isShowingAd = false;
            this.state.rewardedAdLoaded = false;

            if (this.rewardCallback && this.currentRewardType) {
                this.rewardCallback(false, this.currentRewardType);
            }

            this.rewardCallback = null;
            this.currentRewardType = null;
            this.loadRewardedAd();
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: AdMobError) => {
            console.error('[AdMob] Rewarded ad failed to load:', error);
            this.state.rewardedAdLoaded = false;
        });

        AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
            console.log('[AdMob] Interstitial ad loaded');
            this.state.interstitialAdLoaded = true;
        });

        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
            console.log('[AdMob] Interstitial ad dismissed');
            this.state.isShowingAd = false;
            this.state.interstitialAdLoaded = false;

            if (this.interstitialCallback) {
                this.interstitialCallback();
                this.interstitialCallback = null;
            }

            this.loadInterstitialAd();
        });

        AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
            console.error('[AdMob] Interstitial ad failed to load:', error);
            this.state.interstitialAdLoaded = false;
        });
    }

    private async preloadAds(): Promise<void> {
        await Promise.all([
            this.loadRewardedAd(),
            this.loadInterstitialAd(),
        ]);
    }

    private async loadRewardedAd(): Promise<void> {
        if (!this.state.isInitialized || !isNative()) return;

        try {
            const options: RewardAdOptions = {
                adId: AD_UNITS.REWARDED,
            };
            await AdMob.prepareRewardVideoAd(options);
            console.log('[AdMob] Rewarded ad prepared');
        } catch (error) {
            console.error('[AdMob] Failed to prepare rewarded ad:', error);
        }
    }

    private async loadInterstitialAd(): Promise<void> {
        if (!this.state.isInitialized || !isNative()) return;

        try {
            await AdMob.prepareInterstitial({
                adId: AD_UNITS.INTERSTITIAL,
            });
            console.log('[AdMob] Interstitial ad prepared');
        } catch (error) {
            console.error('[AdMob] Failed to prepare interstitial ad:', error);
        }
    }

    async showRewardedAd(
        type: AdRewardType,
        callback: (success: boolean, type: AdRewardType, reward?: AdMobRewardItem) => void
    ): Promise<void> {
        if (!isNative()) {
            console.log('[AdMob] Not on native platform, simulating reward');
            setTimeout(() => callback(true, type, { type: 'test', amount: 1 }), 1000);
            return;
        }

        if (!this.state.isInitialized) {
            console.error('[AdMob] Not initialized');
            callback(false, type);
            return;
        }

        if (!this.state.rewardedAdLoaded) {
            console.error('[AdMob] Rewarded ad not loaded yet');
            callback(false, type);
            return;
        }

        if (this.state.isShowingAd) {
            console.error('[AdMob] Already showing an ad');
            callback(false, type);
            return;
        }

        try {
            this.state.isShowingAd = true;
            this.rewardCallback = callback;
            this.currentRewardType = type;

            await AdMob.showRewardVideoAd();
            console.log(`[AdMob] Showing rewarded ad for: ${type}`);
        } catch (error) {
            console.error('[AdMob] Failed to show rewarded ad:', error);
            this.state.isShowingAd = false;
            this.rewardCallback = null;
            this.currentRewardType = null;
            callback(false, type);
        }
    }

    async showInterstitialAd(callback?: () => void): Promise<void> {
        if (!isNative()) {
            console.log('[AdMob] Not on native platform, skipping interstitial');
            if (callback) callback();
            return;
        }

        if (!this.state.isInitialized) {
            console.error('[AdMob] Not initialized');
            if (callback) callback();
            return;
        }

        if (!this.state.interstitialAdLoaded) {
            console.log('[AdMob] Interstitial ad not loaded yet, skipping');
            if (callback) callback();
            return;
        }

        if (this.state.isShowingAd) {
            console.error('[AdMob] Already showing an ad');
            if (callback) callback();
            return;
        }

        try {
            this.state.isShowingAd = true;
            this.interstitialCallback = callback || null;

            await AdMob.showInterstitial();
            console.log('[AdMob] Showing interstitial ad');
        } catch (error) {
            console.error('[AdMob] Failed to show interstitial ad:', error);
            this.state.isShowingAd = false;
            this.interstitialCallback = null;
            if (callback) callback();
        }
    }

    isRewardedAdReady(): boolean {
        return this.state.isInitialized && this.state.rewardedAdLoaded && !this.state.isShowingAd;
    }

    isInterstitialAdReady(): boolean {
        return this.state.isInitialized && this.state.interstitialAdLoaded && !this.state.isShowingAd;
    }
}

export const adMobService = new AdMobService();
