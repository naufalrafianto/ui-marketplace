'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getContract, isContractConfigured } from '@/lib/contract';
import TicketCard from '@/components/TicketCard';
import { Ticket, Event } from '@/types';

export default function MyTickets() {
    const { account, provider, signer, isConnected } = useWallet();
    const [tickets, setTickets] = useState<Array<{ ticket: Ticket; event: Event }>>([]);
    const [loading, setLoading] = useState(true);
    const [contractConfigured, setContractConfigured] = useState(false);
    const [usingTicket, setUsingTicket] = useState<number | null>(null);

    useEffect(() => {
        setContractConfigured(isContractConfigured());
    }, []);

    useEffect(() => {
        if (account && contractConfigured) {
            loadTickets();
        } else {
            setLoading(false);
        }
    }, [account, provider, contractConfigured]);

    const loadTickets = async () => {
        if (!provider || !account || !contractConfigured) return;

        setLoading(true);
        try {
            const contract = getContract(provider);
            const ticketIds = await contract.getUserTickets(account);
            const ticketList: Array<{ ticket: Ticket; event: Event }> = [];

            for (const tokenId of ticketIds) {
                try {
                    const ticketData = await contract.getTicketInfo(tokenId);
                    const eventData = await contract.getEventInfo(ticketData[1]);

                    const ticket: Ticket = {
                        tokenId: Number(ticketData[0]),
                        eventId: Number(ticketData[1]),
                        owner: ticketData[2],
                        isUsed: ticketData[3],
                        purchaseDate: Number(ticketData[4]),
                        usageDate: Number(ticketData[5]),
                    };

                    const event: Event = {
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

                    ticketList.push({ ticket, event });
                } catch (error) {
                    console.error(`Error loading ticket ${tokenId}:`, error);
                }
            }

            setTickets(ticketList);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTicket = async (tokenId: number) => {
        if (!signer) {
            alert('Please connect your wallet');
            return;
        }

        setUsingTicket(tokenId);
        try {
            const contract = getContract(signer);
            const tx = await contract.useTicket(tokenId);

            await tx.wait();
            alert('Ticket used successfully! The ticket has been burned.');
            loadTickets(); // Refresh tickets
        } catch (error: any) {
            console.error('Use ticket failed:', error);

            let errorMessage = 'Failed to use ticket. Please try again.';
            if (error.reason) {
                errorMessage = `Error: ${error.reason}`;
            } else if (error.message.includes('Not authorized verifier')) {
                errorMessage = 'You are not authorized to use this ticket. Only event organizers or authorized verifiers can use tickets.';
            } else if (error.message.includes('Event access window closed')) {
                errorMessage = 'Event access window is closed. Tickets can only be used 1 hour before to 6 hours after the event.';
            } else if (error.message.includes('Ticket already used')) {
                errorMessage = 'This ticket has already been used.';
            } else if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user.';
            }

            alert(errorMessage);
        } finally {
            setUsingTicket(null);
        }
    };

    // Check if user is verifier or organizer for any event
    const isVerifierOrOrganizer = (eventId: number) => {
        const event = tickets.find(t => t.event.eventId === eventId)?.event;
        return event?.organizer.toLowerCase() === account?.toLowerCase();
    };

    if (!contractConfigured) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">
                        Contract Not Configured
                    </h2>
                    <p className="text-red-700 mb-4">
                        The smart contract address is not configured. Please check your environment variables.
                    </p>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                        Wallet Connection Required
                    </h2>
                    <p className="text-yellow-700">
                        Please connect your wallet to view your tickets
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
                <p className="text-gray-600">View and manage your purchased tickets</p>
                {account && (
                    <p className="text-sm text-gray-500 mt-1">
                        Connected as: {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <span className="text-blue-600 text-lg">ℹ️</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">How to use tickets:</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Tickets can only be used by event organizers or authorized verifiers</li>
                                <li>Usage window: 1 hour before event starts to 6 hours after event starts</li>
                                <li>Once used, tickets are automatically burned (permanently destroyed)</li>
                                <li>If you're the event organizer, you can use any ticket for your event</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {tickets.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">You haven't purchased any tickets yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Purchase tickets from the Events page to see them here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map(({ ticket, event }) => (
                        <TicketCard
                            key={ticket.tokenId}
                            ticket={ticket}
                            event={event}
                            onUse={handleUseTicket}
                            canUse={usingTicket !== ticket.tokenId}
                            isVerifier={isVerifierOrOrganizer(event.eventId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}