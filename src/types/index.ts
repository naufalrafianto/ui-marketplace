export interface Event {
    eventId: number;
    name: string;
    description: string;
    price: bigint;
    maxSupply: number;
    currentSupply: number;
    eventDate: number;
    isActive: boolean;
    organizer: string;
}

export interface Ticket {
    tokenId: number;
    eventId: number;
    owner: string;
    isUsed: boolean;
    purchaseDate: number;
    usageDate: number;
}