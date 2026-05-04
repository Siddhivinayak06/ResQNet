'use client';
import Link from 'next/link';
import { AlertCircle, MapPin, Book, BarChart3, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/navigation';
import SOS from '@/components/sos-button';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4 p-3 bg-red-500/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            ResQNet
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-2">
            Rescue Network
          </p>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Fast, reliable emergency reporting and rescue coordination with offline support. Report emergencies anywhere, anytime.
          </p>

          {/* SOS Button */}
          <SOS />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Quick Report */}
          <Link href="/report">
            <div className="group cursor-pointer bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-700/50 hover:border-red-500/50 transition-all duration-300">
              <div className="mb-4 p-3 bg-red-500/10 rounded-lg w-fit group-hover:bg-red-500/20 transition">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Report Emergency</h3>
              <p className="text-gray-400">
                Quickly report emergencies with location, photo, and detailed description.
              </p>
            </div>
          </Link>

          {/* First Aid */}
          <Link href="/first-aid">
            <div className="group cursor-pointer bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-700/50 hover:border-red-500/50 transition-all duration-300">
              <div className="mb-4 p-3 bg-red-500/10 rounded-lg w-fit group-hover:bg-red-500/20 transition">
                <Book className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">First Aid Guide</h3>
              <p className="text-gray-400">
                Access offline emergency instructions for CPR, bleeding, burns, and more.
              </p>
            </div>
          </Link>

          {/* Dashboard */}
          <Link href="/dashboard">
            <div className="group cursor-pointer bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-700/50 hover:border-red-500/50 transition-all duration-300">
              <div className="mb-4 p-3 bg-red-500/10 rounded-lg w-fit group-hover:bg-red-500/20 transition">
                <MapPin className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Dashboard</h3>
              <p className="text-gray-400">
                View all emergency reports on an interactive map with real-time updates.
              </p>
            </div>
          </Link>
        </div>

        {/* Key Features */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/20">
                  <span className="text-red-500 font-bold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Offline Support</h3>
                <p className="text-gray-400 text-sm">Reports are saved locally and sync when internet returns</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/20">
                  <span className="text-red-500 font-bold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">GPS Location</h3>
                <p className="text-gray-400 text-sm">Automatic location capture for faster emergency response</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/20">
                  <span className="text-red-500 font-bold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Severity Detection</h3>
                <p className="text-gray-400 text-sm">Smart classification of emergency severity levels</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/20">
                  <span className="text-red-500 font-bold">✓</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Real-time Map</h3>
                <p className="text-gray-400 text-sm">Interactive map showing all emergency locations</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-red-500/10 border border-red-500/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">In An Emergency?</h2>
          <p className="text-gray-300 mb-6">Don&apos;t wait. Report now and get help immediately.</p>
          <Link href="/report">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              Report Emergency Now
            </Button>
          </Link>
        </div>

        {/* Auth Section */}
        {!user && (
          <div className="text-center bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Access Your Account</h2>
            <p className="text-gray-300 mb-6">Sign in to your role-specific dashboard and manage emergencies efficiently.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="mt-6 text-sm text-slate-400">
              <p className="mb-2 font-semibold">Demo Credentials Available:</p>
              <p>Try citizen@example.com, responder@example.com, admin@hospital.com or admin@ers.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        )}

        {user && (
          <div className="text-center bg-green-500/10 border border-green-500/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Welcome Back, {user.name}!</h2>
            <p className="text-gray-300 mb-6">You&apos;re logged in as a {user.role}. Access your personalized dashboard.</p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <BarChart3 className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
