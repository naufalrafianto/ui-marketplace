import { CONTRACT_ADDRESS } from '@/lib/contract';
import { Ticket, Event } from '@/types';
import QRCode from 'react-qr-code';
interface TicketCardProps {
    ticket: Ticket;
    event: Event;
    onUse?: (tokenId: number) => void;
    canUse?: boolean;
    isVerifier?: boolean;
}

export default function TicketCard({
    ticket,
    event,
    onUse,
    canUse = false,
    isVerifier = false,
}: TicketCardProps) {
    const formatDate = (timestamp: number) =>
        new Date(timestamp * 1000).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }); const formatTime = (ts: number) => new Date(ts * 1000).toLocaleString();

    const isEventActive = () => {
        const diff = (event.eventDate * 1000 - Date.now()) / (1000 * 3600);
        return diff >= -6 && diff <= 6;
    };

    const canUseTicket = isEventActive() && !ticket.isUsed && isVerifier;

    const copy = (text: string, label: string) =>
        navigator.clipboard.writeText(text).then(
            () => alert(`${label} copied!`),
            () => alert('Copy failed.')
        );

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
        <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
            {/* Left section (event & status) */}
            <div className={`${bannerColor} text-white p-4 md:w-2/5 flex flex-col justify-between`}>
                <div>

                    <h3 className="text-xl font-bold">{event.name}</h3>
                    <p className="text-sm opacity-80 mt-1">{formatDate(event.eventDate)}</p>
                </div>

                {/* QR Code */}
                <div className="mt-4 bg-white p-2 rounded-md w-fit">
                    <QRCode
                        size={80}
                        value={`https://cardona-zkevm.polygonscan.com/token/${CONTRACT_ADDRESS}?a=${ticket.tokenId}`}
                        level="M"
                    />
                </div>
            </div>
            {/* Ticket perforation divider */}
            <div className="hidden md:block w-1 border-l border-dashed border-gray-400 my-4"></div>

            {/* Right section (details) */}
            <div className="flex-1 p-4 space-y-2 text-sm text-gray-800">
                <div className="flex justify-between">
                    <span className="font-medium">Owner</span>
                    <span className="font-mono">
                        {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
                        <button onClick={() => copy(ticket.owner, 'Owner')} className="ml-2 text-blue-600 underline text-xs">Copy</button>
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium">Purchased</span>
                    <span>{formatDate(ticket.purchaseDate)}</span>
                </div>

                {ticket.isUsed && (
                    <div className="flex justify-between">
                        <span className="font-medium">Used</span>
                        <span>{formatTime(ticket.usageDate)}</span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="font-medium">Token ID</span>
                    <span>#{ticket.tokenId}</span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium">Contract</span>
                    <span className="text-xs font-mono">{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
                </div>


                {/* Status */}
                {!ticket.isUsed && (
                    <div className={`p-2 rounded text-xs font-medium ${isEventActive() ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {isEventActive() ? '✅ Event Active' : '⏳ Not Active Yet'}
                    </div>
                )}

            </div>
        </div>
    );
}
