'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getContract, isContractConfigured } from '@/lib/contract';
import { ethers } from 'ethers';

export default function CreateEvent() {
    const { account, signer, isConnected } = useWallet();
    const [loading, setLoading] = useState(false);
    const [contractConfigured, setContractConfigured] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        maxSupply: '',
        eventDate: '',
    });

    useEffect(() => {
        setContractConfigured(isContractConfigured());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contractConfigured) {
            alert('Contract address not configured. Please check your environment variables.');
            return;
        }

        if (!signer) {
            alert('Please connect your wallet');
            return;
        }

        if (Number(formData.price) <= 0 || isNaN(Number(formData.price))) {
            alert('Invalid ticket price');
            return;
        }

        setLoading(true);
        try {
            const contract = getContract(signer);
            const priceInWei = ethers.parseEther(formData.price);
            const eventTimestamp = Math.floor(new Date(formData.eventDate).getTime() / 1000);

            const tx = await contract.createEvent(
                formData.name,
                formData.description,
                priceInWei,
                parseInt(formData.maxSupply),
                eventTimestamp
            );

            await tx.wait();
            alert('Event created successfully!');
            setFormData({ name: '', description: '', price: '', maxSupply: '', eventDate: '' });
        } catch (error: any) {
            console.error('Event creation failed:', error);

            let errorMessage = 'Event creation failed. Please try again.';
            if (error.reason) {
                errorMessage = `Error: ${error.reason}`;
            } else if (error.message?.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user.';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for gas fee.';
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!contractConfigured) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Contract Not Configured</h2>
                    <p className="text-red-700 mb-4">
                        The smart contract address is not configured. Please:
                    </p>
                    <ol className="text-left text-red-700 space-y-2">
                        <li>1. Deploy your smart contract to a blockchain network</li>
                        <li>2. Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root</li>
                        <li>3. Add: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here</code></li>
                        <li>4. Restart your development server</li>
                    </ol>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">Wallet Connection Required</h2>
                    <p className="text-yellow-700">Please connect your wallet to create an event</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
                <p className="text-black">Set up your event and start selling tickets</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-6 text-black">
                <div>
                    <label className="block text-sm font-medium text-black mb-1">Event Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-black mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input"
                        rows={3}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Price (ETH)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Max Supply</label>
                        <input
                            type="number"
                            value={formData.maxSupply}
                            onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-black mb-1">Event Date</label>
                    <input
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="input"
                        required
                    />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                    {loading ? 'Creating Event...' : 'Create Event'}
                </button>
            </form>
        </div>
    );
}
