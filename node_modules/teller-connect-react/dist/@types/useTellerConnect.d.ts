import { TellerConnectOptions } from './types';
export declare const useTellerConnect: (options: TellerConnectOptions) => {
    error: ErrorEvent | null;
    ready: boolean;
    open: () => void;
};
