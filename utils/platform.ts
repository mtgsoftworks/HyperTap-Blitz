import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for Capacitor apps
 */

export const isNative = () => {
    return Capacitor.isNativePlatform();
};

export const isWeb = () => {
    return !Capacitor.isNativePlatform();
};

export const isIOS = () => {
    return Capacitor.getPlatform() === 'ios';
};

export const isAndroid = () => {
    return Capacitor.getPlatform() === 'android';
};

export const getPlatform = () => {
    return Capacitor.getPlatform();
};

export const isCapacitor = () => {
    return Capacitor.isPluginAvailable('App');
};
