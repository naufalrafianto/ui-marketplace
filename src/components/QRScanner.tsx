'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const scanner = new Html5QrcodeScanner('qr-reader', {
            fps: 30,
            qrbox: 250,
        }, /* verbose */ false);

        scanner.render(
            (decodedText) => {
                scanner.clear(); // Optional: stop scanning after success
                onScanSuccess(decodedText);
            },
            (error) => {
                onScanError?.(error);
            }
        );

        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(() => { });
        };
    }, []);

    return (
        <div className="w-full max-w-md mx-auto">
            <div id="qr-reader" className="w-full" />
        </div>
    );
}
