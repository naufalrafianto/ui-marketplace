import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

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


export const useWallet = () => {
    const [account, setAccount] = useState<string>('');
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [loading, setLoading] = useState(false);

    const connect = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask');
            return;
        }

        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setProvider(provider);
            setSigner(signer);
            setAccount(address);
        } catch (error) {
            console.error('Connection failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const disconnect = () => {
        setAccount('');
        setProvider(null);
        setSigner(null);
    };

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAccount(accounts[0]);
                }
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            return () => window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        }
    }, []);

    return { account, provider, signer, connect, disconnect, loading };
};