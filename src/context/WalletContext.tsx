'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
    account: string;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
    loading: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
}

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



const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

interface WalletProviderProps {
    children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [account, setAccount] = useState<string>('');
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

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
            setIsConnected(true);

            // Store connection state
            localStorage.setItem('walletConnected', 'true');
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
        setIsConnected(false);
        localStorage.removeItem('walletConnected');
    };

    // Auto-connect on page load if previously connected
    useEffect(() => {
        const autoConnect = async () => {
            const wasConnected = localStorage.getItem('walletConnected');
            if (wasConnected && typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.send('eth_accounts', []);

                    if (accounts.length > 0) {
                        const signer = await provider.getSigner();
                        const address = await signer.getAddress();

                        setProvider(provider);
                        setSigner(signer);
                        setAccount(address);
                        setIsConnected(true);
                    }
                } catch (error) {
                    console.error('Auto-connect failed:', error);
                    localStorage.removeItem('walletConnected');
                }
            }
        };

        autoConnect();
    }, []);

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                }
            };

            const handleChainChanged = () => {
                // Reload the page when chain changes
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum?.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const value = {
        account,
        provider,
        signer,
        loading,
        connect,
        disconnect,
        isConnected
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};
