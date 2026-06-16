import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Chat = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['chat_rooms'],
    queryFn: async () => {
      const res = await api.get('/chat/rooms');
      return res.data;
    }
  });

  const rooms = data?.data || [];

  return (
    <div className="bg-background min-h-[calc(100vh-64px)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col md:flex-row gap-6">
        
        {/* Rooms Sidebar */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[80vh]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-dark-900">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary-600" size={32} />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-10 px-4 text-dark-500">
                No conversations yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {rooms.map((room: any) => {
                  const otherUser = user?.id === room.landowner_id ? room.investor : room.landowner;
                  return (
                    <div key={room.id} className="p-4 hover:bg-primary-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-primary-500">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-dark-900 truncate pr-4">{otherUser?.full_name}</h4>
                      </div>
                      <p className="text-xs text-primary-600 font-medium truncate mb-1">{room.listings?.title}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[80vh]">
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-300 mb-4">
              <MessageSquare size={36} />
            </div>
            <h3 className="text-xl font-semibold text-dark-900 mb-2">Select a conversation</h3>
            <p className="text-dark-500 max-w-md">
              Choose a conversation from the sidebar to view messages, negotiate terms, or finalize investments.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
