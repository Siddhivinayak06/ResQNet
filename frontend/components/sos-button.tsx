'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SOS() {
  return (
    <Link href="/report">
      <Button 
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded-full animate-pulse hover:animate-none"
      >
        🚨 REPORT EMERGENCY
      </Button>
    </Link>
  );
}
