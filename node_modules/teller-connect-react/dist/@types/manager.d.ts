import { TellerConnectOptions, TellerConnectInstance } from './types';
export declare const createTeller: (config: TellerConnectOptions, creator: (config: TellerConnectOptions) => TellerConnectInstance) => {
    open: () => void;
    destroy: () => void;
};
