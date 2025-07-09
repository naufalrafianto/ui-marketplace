import { Event } from '@/types';
import { ethers } from 'ethers';
import Image from 'next/image';

interface EventCardProps {
    event: Event;
    onPurchase: (eventId: number) => void;
    canPurchase?: boolean;
}

export default function EventCard({ event, onPurchase, canPurchase = true }: EventCardProps) {
    const formatDate = (timestamp: number) =>
        new Date(timestamp * 1000).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const formatPrice = (price: bigint) => `${ethers.formatEther(price)} ETH`;

    const availableTickets = event.maxSupply - event.currentSupply;
    const isSoldOut = availableTickets === 0;
    const isPastEvent = event.eventDate < Date.now() / 1000;

    const isDisabled = isSoldOut || isPastEvent || !event.isActive;

    const getStatusLabel = () => {
        if (isPastEvent) return 'Event Passed';
        if (isSoldOut) return 'Sold Out';
        if (!event.isActive) return 'Inactive';
        return 'Available';
    };

    const statusColor = () => {
        if (isPastEvent || isSoldOut || !event.isActive) return 'hidden';
        return 'text-green-600';
    };


    // Color Banner
    const bgColors = [
        'bg-blue-500',
        'bg-red-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];
    const bannerColor = bgColors[Number(event.eventId) % bgColors.length];

    return (
        <div className="rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition bg-white">
            {/* Banner */}
            <div className={`w-full h-40 ${bannerColor} flex items-center justify-center`} />


            {/* Content */}
            <div className="p-4 space-y-3 text-sm">
                {/* Judul */}
                <div className="flex justify-between flex-col text-gray-600">
                    <h3 className="text-lg font-bold text-gray-900">{event.name}</h3>
                    <span className="font-medium text-black/50">{formatDate(event.eventDate)}</span>
                </div>



                {/* Status */}
                <div className="flex justify-between flex-col text-gray-600">
                    <span className=" text-red-500 font-bold text-xl">{formatPrice(event.price)}</span>
                    <span className={`font-semibold ${statusColor()}`}>{getStatusLabel()}</span>
                </div>

                {/* Tombol Beli */}
                {canPurchase && (
                    <button
                        onClick={() => onPurchase(event.eventId)}
                        disabled={isDisabled}
                        className={`mt-3 w-full py-2 text-sm font-medium rounded ${isDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isDisabled ? getStatusLabel() : 'Purchase Ticket'}
                    </button>
                )}
            </div>
        </div>
    );
}