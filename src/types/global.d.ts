declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}
interface EthereumProvider {
    isMetaMask?: boolean;
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    on(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
    on(event: 'chainChanged', listener: (chainId: string) => void): void;
    removeListener(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
    removeListener(event: 'chainChanged', listener: (chainId: string) => void): void;
}
