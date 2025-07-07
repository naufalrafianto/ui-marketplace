import { Ticket, Event } from '@/types';

interface TicketCardProps {
    ticket: Ticket;
    event: Event;
    onUse?: (tokenId: number) => void;
    canUse?: boolean;
}

export default function TicketCard({ ticket, event, onUse, canUse = false }: TicketCardProps) {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

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
                    <span>Purchased:</span>
                    <span className="font-medium">{formatDate(ticket.purchaseDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Event Date:</span>
                    <span className="font-medium">{formatDate(event.eventDate)}</span>
                </div>
                {ticket.isUsed && (
                    <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span className="font-medium">{formatDate(ticket.usageDate)}</span>
                    </div>
                )}
            </div>

            {canUse && !ticket.isUsed && (
                <button
                    onClick={() => onUse?.(ticket.tokenId)}
                    className="btn btn-primary w-full"
                >
                    Use Ticket
                </button>
            )}
        </div>
    );
}