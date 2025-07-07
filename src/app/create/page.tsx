'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { getContract } from '@/lib/contract';
import { ethers } from 'ethers';

export default function CreateEvent() {
    const { account, signer } = useWallet();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        maxSupply: '',
        eventDate: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signer) {
            alert('Please connect your wallet');
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
        } catch (error) {
            console.error('Event creation failed:', error);
            alert('Event creation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                        Wallet Connection Required
                    </h2>
                    <p className="text-yellow-700">
                        Please connect your wallet to create an event
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
                <p className="text-gray-600">Set up your event and start selling tickets</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Name
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (ETH)
                        </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Supply
                        </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date
                    </label>
                    <input
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="input"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? 'Creating Event...' : 'Create Event'}
                </button>
            </form>
        </div>
    );
}