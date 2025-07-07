import { ethers } from 'ethers';
import TicketMarketplace from '@/abi/TicketMarketplace.json';


export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

export const CONTRACT_ABI = TicketMarketplace.abi

export const getContract = (provider: ethers.Provider | ethers.Signer) => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};
