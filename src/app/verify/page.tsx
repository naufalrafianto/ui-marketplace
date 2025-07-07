'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getContract, isContractConfigured } from '@/lib/contract';
import { Ticket, Event } from '@/types';

export default function VerifyTickets() {
    const { account, provider, signer, isConnected } = useWallet();
    const [tokenId, setTokenId] = useState('');
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [contractConfigured, setContractConfigured] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        setContractConfigured(isContractConfigured());
    }, []);

    const searchTicket = async () => {
        if (!provider || !tokenId) return;

        setLoading(true);
        setTicket(null);
        setEvent(null);
        setIsAuthorized(false);

        try {
            const contract = getContract(provider);

            // Check if token exists
            const tokenExists = await contract.tokenExists(tokenId);
            if (!tokenExists) {
                alert('Ticket not found or has been burned');
                setLoading(false);
                return;
            }

            // Get ticket info
            const ticketData = await contract.getTicketInfo(tokenId);
            const eventData = await contract.getEventInfo(ticketData[1]);

            const ticketInfo: Ticket = {
                tokenId: Number(ticketData[0]),
                eventId: Number(ticketData[1]),
                owner: ticketData[2],
                isUsed: ticketData[3],
                purchaseDate: Number(ticketData[4]),
                usageDate: Number(ticketData[5]),
            };

            const eventInfo: Event = {
                eventId: Number(eventData[0]),
                name: eventData[1],
                description: eventData[2],
                price: eventData[3],
                maxSupply: Number(eventData[4]),
                currentSupply: Number(eventData[5]),
                eventDate: Number(eventData[6]),
                isActive: eventData[7],
                organizer: eventData[8],
            };

            setTicket(ticketInfo);
            setEvent(eventInfo);

            // Check if current user is authorized to verify this ticket
            if (account) {
                const isOrganizer = eventInfo.organizer.toLowerCase() === account.toLowerCase();
                const authorizedVerifier = await contract.authorizedVerifiers(eventInfo.eventId);
                const isVerifier = authorizedVerifier.toLowerCase() === account.toLowerCase();

                setIsAuthorized(isOrganizer || isVerifier);
            }

        } catch (error) {
            console.error('Error searching ticket:', error);
            alert('Error searching ticket. Please check the token ID.');
        } finally {
            setLoading(false);
        }
    };

    const useTicket = async () => {
        if (!signer || !ticket) return;

        setVerifying(true);
        try {
            const contract = getContract(signer);
            const tx = await contract.useTicket(ticket.tokenId);

            await tx.wait();
            alert('✅ Ticket verified and used successfully! The ticket has been burned.');

            // Clear the form after successful verification
            setTokenId('');
            setTicket(null);
            setEvent(null);
            setIsAuthorized(false);

        } catch (error: any) {
            console.error('Verify ticket failed:', error);

            let errorMessage = 'Failed to verify ticket.';
            if (error.reason) {
                errorMessage = `Error: ${error.reason}`;
            } else if (error.message.includes('Not authorized verifier')) {
                errorMessage = 'You are not authorized to verify tickets for this event.';
            } else if (error.message.includes('Event access window closed')) {
                errorMessage = 'Event access window is closed. Tickets can only be used 1 hour before to 6 hours after the event.';
            } else if (error.message.includes('Ticket already used')) {
                errorMessage = 'This ticket has already been used.';
            } else if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user.';
            }

            alert(errorMessage);
        } finally {
            setVerifying(false);
        }
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const isEventActive = () => {
        if (!event) return false;
        const eventDate = new Date(event.eventDate * 1000);
        const now = new Date();
        const timeDiff = eventDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        // Event dapat digunakan 1 jam sebelum hingga 6 jam setelah event
        return hoursDiff >= -6 && hoursDiff <= 1;
    };

    if (!contractConfigured) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">
                        Contract Not Configured
                    </h2>
                    <p className="text-red-700">
                        The smart contract address is not configured. Please check your environment variables.
                    </p>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                        Wallet Connection Required
                    </h2>
                    <p className="text-yellow-700">
                        Please connect your wallet to verify tickets
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket Verification</h1>
                <p className="text-gray-600">Scan and verify event tickets</p>
                {account && (
                    <p className="text-sm text-gray-500 mt-1">
                        Connected as: {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                )}
            </div>

            {/* Search Form */}
            <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4">Search Ticket</h2>
                <div className="flex gap-4">
                    <input
                        type="number"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        placeholder="Enter Ticket ID (Token ID)"
                        className="input flex-1"
                    />
                    <button
                        onClick={searchTicket}
                        disabled={loading || !tokenId}
                        className="btn btn-primary"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Ticket Information */}
            {ticket && event && (
                <div className="card">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold">Ticket Information</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${ticket.isUsed
                                ? 'bg-red-100 text-red-800'
                                : isEventActive()
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {ticket.isUsed ? '❌ Used' : isEventActive() ? '✅ Valid' : '⏳ Not Active'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ticket Details */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Ticket Details</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Token ID:</span>
                                    <span className="font-medium">#{ticket.tokenId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Owner:</span>
                                    <span className="font-medium text-xs">
                                        {ticket.owner.slice(0, 8)}...{ticket.owner.slice(-6)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Purchased:</span>
                                    <span className="font-medium">{formatDateTime(ticket.purchaseDate)}</span>
                                </div>
                                {ticket.isUsed && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Used:</span>
                                        <span className="font-medium">{formatDateTime(ticket.usageDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Event Details */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-gray-600">Event:</span>
                                    <div className="font-medium">{event.name}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Description:</span>
                                    <div className="font-medium text-sm">{event.description}</div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium">{formatDateTime(event.eventDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Organizer:</span>
                                    <span className="font-medium text-xs">
                                        {event.organizer.slice(0, 8)}...{event.organizer.slice(-6)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authorization Status */}
                    <div className="mt-6">
                        {!isAuthorized ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <span className="text-red-600 mr-2">🚫</span>
                                    <span className="text-red-800 font-medium">
                                        You are not authorized to verify tickets for this event
                                    </span>
                                </div>
                                <p className="text-red-700 text-sm mt-1">
                                    Only the event organizer or authorized verifiers can use tickets.
                                </p>
                            </div>
                        ) : !isEventActive() ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <span className="text-yellow-600 mr-2">⏰</span>
                                    <span className="text-yellow-800 font-medium">
                                        Event access window is not active
                                    </span>
                                </div>
                                <p className="text-yellow-700 text-sm mt-1">
                                    Tickets can only be used 1 hour before to 6 hours after the event starts.
                                </p>
                            </div>
                        ) : ticket.isUsed ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <span className="text-gray-600 mr-2">✓</span>
                                    <span className="text-gray-800 font-medium">
                                        This ticket has already been used
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                    <span className="text-green-600 mr-2">✅</span>
                                    <span className="text-green-800 font-medium">
                                        Ticket is valid and ready to be used
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    {isAuthorized && isEventActive() && !ticket.isUsed && (
                        <div className="mt-6">
                            <button
                                onClick={useTicket}
                                disabled={verifying}
                                className="btn btn-primary w-full"
                            >
                                {verifying ? 'Verifying Ticket...' : '🎫 Use Ticket'}
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                ⚠️ Warning: Using this ticket will permanently burn it
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">How to verify tickets:</h3>
                <div className="space-y-2 text-blue-800">
                    <p>• Enter the Ticket ID (Token ID) in the search box above</p>
                    <p>• Check the ticket status and event details</p>
                    <p>• If you're authorized and the event is active, click "Use Ticket"</p>
                    <p>• The ticket will be permanently burned after use to prevent reuse</p>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Authorization Requirements:</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                        <p>• You must be the event organizer, OR</p>
                        <p>• You must be an authorized verifier for the event</p>
                        <p>• Tickets can only be used during the event access window</p>
                    </div>
                </div>
            </div>
        </div>
    );
}