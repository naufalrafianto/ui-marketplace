import { Event } from '@/types';
import { ethers } from 'ethers';

interface EventCardProps {
    event: Event;
    onPurchase: (eventId: number) => void;
    canPurchase?: boolean;
}

export default function EventCard({ event, onPurchase, canPurchase = true }: EventCardProps) {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const formatPrice = (price: bigint) => {
        return ethers.formatEther(price);
    };

    const availableTickets = event.maxSupply - event.currentSupply;
    const isSoldOut = availableTickets === 0;
    const isPastEvent = event.eventDate < Date.now() / 1000;

    return (
        <div className="card">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{event.name}</h3>
                <span className={`px-2 py-1 text-xs rounded ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            <p className="text-gray-600 mb-3">{event.description}</p>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span>Price:</span>
                    <span className="font-medium">{formatPrice(event.price)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Available:</span>
                    <span className="font-medium">{availableTickets} / {event.maxSupply}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Event Date:</span>
                    <span className="font-medium">{formatDate(event.eventDate)}</span>
                </div>
            </div>

            {canPurchase && (
                <button
                    onClick={() => onPurchase(event.eventId)}
                    disabled={isSoldOut || isPastEvent || !event.isActive}
                    className="btn btn-primary w-full"
                >
                    {isSoldOut ? 'Sold Out' : isPastEvent ? 'Event Passed' : 'Purchase Ticket'}
                </button>
            )}
        </div>
    );
}