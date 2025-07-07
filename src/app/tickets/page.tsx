'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { getContract } from '@/lib/contract';
import TicketCard from '@/components/TicketCard';
import { Ticket, Event } from '@/types';

export default function MyTickets() {
    const { account, provider, signer } = useWallet();
    const [tickets, setTickets] = useState<Array<{ ticket: Ticket; event: Event }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account) {
            loadTickets();
        }
    }, [account, provider]);

    const loadTickets = async () => {
        if (!provider || !account) return;

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

    if (!account) {
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
            </div>

            {tickets.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">You haven't purchased any tickets yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map(({ ticket, event }) => (
                        <TicketCard
                            key={ticket.tokenId}
                            ticket={ticket}
                            event={event}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}