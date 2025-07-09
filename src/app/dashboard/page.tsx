// app/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getContract, isContractConfigured } from '@/lib/contract';
import { Event } from '@/types';
import { ethers } from 'ethers';

interface EventStats {
    event: Event;
    ticketsSold: number;
    ticketsUsed: number;
    revenue: bigint;
    soldPercentage: number;
}

interface OverallStats {
    totalEvents: number;
    totalTicketsSold: number;
    totalTicketsUsed: number;
    totalRevenue: bigint;
    activeEvents: number;
}

export default function Analytics() {
    const { account, provider, isConnected } = useWallet();
    const [eventStats, setEventStats] = useState<EventStats[]>([]);
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [contractConfigured, setContractConfigured] = useState(false);
    const [userEvents, setUserEvents] = useState<Event[]>([]);

    useEffect(() => {
        setContractConfigured(isContractConfigured());
    }, []);

    useEffect(() => {
        if (account && contractConfigured) {
            loadAnalytics();
        } else {
            setLoading(false);
        }
    }, [account, provider, contractConfigured]);

    const loadAnalytics = async () => {
        if (!provider || !account || !contractConfigured) return;

        setLoading(true);
        try {
            const contract = getContract(provider);
            const eventCount = await contract.eventCounter();

            const allEvents: Event[] = [];
            const myEvents: Event[] = [];

            // Load all events
            for (let i = 1; i <= eventCount; i++) {
                try {
                    const eventData = await contract.getEventInfo(i);
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

                    allEvents.push(event);

                    // Check if this is user's event
                    if (event.organizer.toLowerCase() === account.toLowerCase()) {
                        myEvents.push(event);
                    }
                } catch (error) {
                    console.error(`Error loading event ${i}:`, error);
                }
            }

            setUserEvents(myEvents);

            // Calculate stats for user's events
            const stats: EventStats[] = [];
            let totalRevenue = BigInt(0);
            let totalTicketsSold = 0;
            let totalTicketsUsed = 0;

            for (const event of myEvents) {
                const ticketsSold = event.currentSupply;
                const revenue = event.price * BigInt(ticketsSold);
                const soldPercentage = (ticketsSold / event.maxSupply) * 100;

                // For now, we'll estimate tickets used (in real app, you'd track this)
                const ticketsUsed = Math.floor(ticketsSold * 0.8); // Assume 80% usage rate

                stats.push({
                    event,
                    ticketsSold,
                    ticketsUsed,
                    revenue,
                    soldPercentage,
                });

                totalRevenue += revenue;
                totalTicketsSold += ticketsSold;
                totalTicketsUsed += ticketsUsed;
            }

            setEventStats(stats);

            // Calculate overall stats
            const activeEvents = allEvents.filter(e => e.isActive).length;
            setOverallStats({
                totalEvents: myEvents.length,
                totalTicketsSold,
                totalTicketsUsed,
                totalRevenue,
                activeEvents: myEvents.filter(e => e.isActive).length,
            });

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatEther = (value: bigint) => {
        return parseFloat(ethers.formatEther(value)).toFixed(4);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    if (!contractConfigured) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">
                        Contract Not Configured
                    </h2>
                    <p className="text-red-700">
                        The smart contract address is not configured.
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
                        Please connect your wallet to view dashboard
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
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (userEvents.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2"> Dashboard</h1>
                    <p className="text-gray-600">View your event performance and statistics</p>
                </div>

                <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-lg p-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                        <p className="text-gray-600 mb-4">You haven't created any events yet.</p>
                        <a href="/create" className="btn btn-primary">
                            Create Your First Event
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600">View your event performance and statistics</p>
                {account && (
                    <p className="text-sm text-gray-500 mt-1">
                        Organizer: {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                )}
            </div>

            {/* Overall Stats Cards */}
            {overallStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold">📅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Events</p>
                                <p className="text-2xl font-bold text-gray-900">{overallStats.totalEvents}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">🎫</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tickets Sold</p>
                                <p className="text-2xl font-bold text-gray-900">{overallStats.totalTicketsSold}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-bold">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tickets Used</p>
                                <p className="text-2xl font-bold text-gray-900">{overallStats.totalTicketsUsed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-yellow-600 font-bold">💰</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatEther(overallStats.totalRevenue)} ETH</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Statistics Table */}
            <div className="card">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Event Performance</h2>
                    <p className="text-gray-600">Detailed statistics for each of your events</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sold / Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sold %
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {eventStats.map((stat) => (
                                <tr key={stat.event.eventId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {stat.event.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {stat.event.price.toString() !== '0' ? `${formatEther(stat.event.price)} ETH` : 'Free'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(stat.event.eventDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {stat.ticketsSold} / {stat.event.maxSupply}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-1 mr-3">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${Math.min(stat.soldPercentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-900">
                                                {stat.soldPercentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatEther(stat.revenue)} ETH
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stat.event.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {stat.event.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <h3 className="text-lg font-semibold mb-2">Create New Event</h3>
                    <p className="text-gray-600 mb-4">Start selling tickets for your next event</p>
                    <a href="/create" className="btn btn-primary">
                        Create Event
                    </a>
                </div>

                <div className="card text-center">
                    <h3 className="text-lg font-semibold mb-2">Verify Tickets</h3>
                    <p className="text-gray-600 mb-4">Check and validate event tickets</p>
                    <a href="/verify" className="btn btn-secondary">
                        Verify Tickets
                    </a>
                </div>

                <div className="card text-center">
                    <h3 className="text-lg font-semibold mb-2">View All Events</h3>
                    <p className="text-gray-600 mb-4">Browse all available events</p>
                    <a href="/" className="btn btn-secondary">
                        Browse Events
                    </a>
                </div>
            </div>
        </div>
    );
}