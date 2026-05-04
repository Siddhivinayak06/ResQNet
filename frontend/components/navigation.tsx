'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import PwaStatus from '@/components/pwa/pwa-status';

export default function Navigation() {
  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-slate-800/50 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-red-600 rounded-lg group-hover:bg-red-700 transition">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ERS</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Home
              </Link>
              <Link href="/report" className="text-gray-300 hover:text-white transition">
                Report
              </Link>
              <Link href="/first-aid" className="text-gray-300 hover:text-white transition">
                First Aid
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
            </div>

            <div className="hidden md:flex items-center">
              <PwaStatus />
            </div>

            {/* Mobile Menu Indicator */}
            <div className="md:hidden text-white">☰</div>
          </div>
        </div>
      </nav>
      <div className="md:hidden border-b border-slate-700 bg-slate-900/80 px-4 py-2">
        <PwaStatus compact />
      </div>
    </div>
  );
}
