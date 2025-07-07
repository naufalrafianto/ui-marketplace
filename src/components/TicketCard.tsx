import { Ticket, Event } from '@/types';

interface TicketCardProps {
    ticket: Ticket;
    event: Event;
    onUse?: (tokenId: number) => void;
    canUse?: boolean;
    isVerifier?: boolean;
}

export default function TicketCard({ ticket, event, onUse, canUse = false, isVerifier = false }: TicketCardProps) {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const isEventToday = () => {
        const eventDate = new Date(event.eventDate * 1000);
        const today = new Date();
        const timeDiff = eventDate.getTime() - today.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        // Event dapat digunakan 1 jam sebelum hingga 6 jam setelah event
        return hoursDiff >= -6 && hoursDiff <= 1;
    };

    const canUseTicket = isEventToday() && !ticket.isUsed && isVerifier;

    return (
        <div className="card">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{event.name}</h3>
                <span className={`px-2 py-1 text-xs rounded ${ticket.isUsed ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {ticket.isUsed ? 'Used' : 'Valid'}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span>Token ID:</span>
                    <span className="font-medium">#{ticket.tokenId}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Owner:</span>
                    <span className="font-medium text-xs">
                        {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Purchased:</span>
                    <span className="font-medium">{formatDate(ticket.purchaseDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Event Date:</span>
                    <span className="font-medium">{formatTime(event.eventDate)}</span>
                </div>
                {ticket.isUsed && (
                    <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span className="font-medium">{formatTime(ticket.usageDate)}</span>
                    </div>
                )}
            </div>

            {/* Status Event */}
            {!ticket.isUsed && (
                <div className="mb-4">
                    {isEventToday() ? (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="text-green-800 text-xs font-medium">✅ Event Active - Ticket can be used</p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-yellow-800 text-xs font-medium">⏳ Event not yet active</p>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {canUse && canUseTicket && (
                <button
                    onClick={() => onUse?.(ticket.tokenId)}
                    className="btn btn-primary w-full"
                >
                    Use Ticket
                </button>
            )}

            {!ticket.isUsed && !isEventToday() && (
                <button
                    disabled
                    className="btn bg-gray-200 text-gray-500 w-full cursor-not-allowed"
                >
                    Event Not Active
                </button>
            )}

            {ticket.isUsed && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                    <p className="text-gray-600 text-sm font-medium">🎫 Ticket Used</p>
                </div>
            )}
        </div>
    );
}