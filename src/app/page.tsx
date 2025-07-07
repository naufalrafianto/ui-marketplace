'use client';

import { useState, useEffect } from 'react';
import { getContract } from '@/lib/contract';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import { useWallet } from '@/context/WalletContext';

export default function Home() {
  const { account, provider, signer, isConnected } = useWallet();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  useEffect(() => {
    loadEvents();
  }, [provider]);

  const loadEvents = async () => {
    if (!provider) return;

    try {
      const contract = getContract(provider);
      const eventCount = await contract.eventCounter();
      const eventList: Event[] = [];

      for (let i = 1; i <= eventCount; i++) {
        try {
          const eventData = await contract.getEventInfo(i);
          eventList.push({
            eventId: eventData[0],
            name: eventData[1],
            description: eventData[2],
            price: eventData[3],
            maxSupply: Number(eventData[4]),
            currentSupply: Number(eventData[5]),
            eventDate: Number(eventData[6]),
            isActive: eventData[7],
            organizer: eventData[8],
          });
        } catch (error) {
          console.error(`Error loading event ${i}:`, error);
        }
      }

      setEvents(eventList);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (eventId: number) => {
    if (!signer) {
      alert('Please connect your wallet');
      return;
    }

    const event = events.find(e => e.eventId === eventId);
    if (!event) return;

    setPurchasing(eventId);
    try {
      const contract = getContract(signer);
      const tokenURI = `https://api.example.com/ticket/${eventId}/${Date.now()}`;

      const tx = await contract.purchaseTicket(eventId, tokenURI, {
        value: event.price
      });

      await tx.wait();
      alert('Ticket purchased successfully!');
      loadEvents(); // Refresh events
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Events</h1>
        <p className="text-black">Discover and purchase tickets for upcoming events</p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Please connect your wallet to purchase tickets
          </p>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-black">No events available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              onPurchase={handlePurchase}
              canPurchase={isConnected && purchasing !== event.eventId}
            />
          ))}
        </div>
      )}
    </div>
  );
}