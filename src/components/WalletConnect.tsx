'use client';

import { useWallet } from '@/hooks/useWallet';

export default function WalletConnect() {
  const { account, connect, disconnect, loading } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {formatAddress(account)}
        </span>
        <button
          onClick={disconnect}
          className="btn btn-secondary text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}