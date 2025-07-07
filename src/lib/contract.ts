import { ethers } from 'ethers';
import TicketMarketplace from '@/abi/TicketMarketplace.json';


export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

export const CONTRACT_ABI = TicketMarketplace.abi

export const getContract = (provider: ethers.Provider | ethers.Signer) => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '') {
        throw new Error('Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables.');
    }

    if (!ethers.isAddress(CONTRACT_ADDRESS)) {
        throw new Error('Invalid contract address format.');
    }

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

export const isContractConfigured = (): boolean => {
    return !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '' && ethers.isAddress(CONTRACT_ADDRESS);
};
