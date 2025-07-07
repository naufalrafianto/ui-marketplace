'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getContract, isContractConfigured } from '@/lib/contract';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import { ethers } from 'ethers';

export default function Home() {
  const { account, provider, signer, isConnected } = useWallet();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [contractConfigured, setContractConfigured] = useState(false);

  useEffect(() => {
    setContractConfigured(isContractConfigured());
  }, []);

  useEffect(() => {
    if (contractConfigured) {
      loadEvents();
    }
  }, [provider, contractConfigured]);

  const loadEvents = async () => {
    if (!provider || !contractConfigured) return;

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
    } catch (error: any) {
      console.error('Purchase failed:', error);

      let errorMessage = 'Purchase failed. Please try again.';
      if (error.reason) {
        errorMessage = `Error: ${error.reason}`;
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction cancelled by user.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction.';
      }

      alert(errorMessage);
    } finally {
      setPurchasing(null);
    }
  };

  if (!contractConfigured) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Contract Not Configured
          </h2>
          <p className="text-red-700 mb-4">
            The smart contract address is not configured. Please:
          </p>
          <ol className="text-left text-red-700 space-y-2 max-w-md mx-auto">
            <li>1. Deploy your smart contract to a blockchain network</li>
            <li>2. Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root</li>
            <li>3. Add: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here</code></li>
            <li>4. Restart your development server</li>
          </ol>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Events</h1>
        <p className="text-gray-600">Discover and purchase tickets for upcoming events</p>
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
          <p className="text-gray-600">No events available at the moment</p>
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