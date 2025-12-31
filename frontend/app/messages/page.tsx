'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import AdvancedMessaging from '@/components/AdvancedMessaging';

export default function MessagesPage() {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.warning('Please log in to view messages');
      router.push('/auth/login');
    }
  }, [isAuthenticated, router, toast]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Chat with hosts and guests in real-time</p>
        </div>

        <AdvancedMessaging />
      </main>
    </div>
  );
}
