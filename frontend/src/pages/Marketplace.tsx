import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Loader2, ArrowRight, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Marketplace = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['secondary_listings'],
    queryFn: async () => {
      const res = await api.get('/marketplace/secondary');
      return res.data;
    }
  });

  const listings = data?.data || [];

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="bg-dark-900 text-white border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-primary-500/20 text-primary-300 px-4 py-2 rounded-full mb-6 font-medium text-sm border border-primary-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span>Live Secondary Market</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Secondary Token Marketplace</h1>
            <p className="text-lg text-dark-300 leading-relaxed">
              Buy and sell fractional ownership tokens of active real estate projects. Gain liquidity before project completion or acquire tokens at competitive prices.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-200 border-dashed rounded-2xl">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-dark-300">
              <ArrowRightLeft size={32} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-2">No active secondary listings</h3>
            <p className="text-dark-500">Check back later when investors list their tokens for sale.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item: any) => (
              <div key={item.id} className="card p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-dark-900 text-lg mb-1 line-clamp-1">
                      {item.token_holdings?.tokens?.listings?.title || 'Unknown Project'}
                    </h4>
                    <p className="text-xs text-dark-500 uppercase font-semibold">
                      {item.token_holdings?.tokens?.listings?.project_type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-100 shrink-0 ml-2">
                    FOR SALE
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 flex-grow">
                  <div className="flex justify-between mb-3 border-b border-gray-200 pb-3">
                    <span className="text-dark-500 text-sm">Quantity</span>
                    <span className="font-bold text-dark-900">{item.quantity.toLocaleString()} Tokens</span>
                  </div>
                  <div className="flex justify-between mb-3 border-b border-gray-200 pb-3">
                    <span className="text-dark-500 text-sm">Asking Price / Token</span>
                    <span className="font-bold text-dark-900">₹ {item.ask_price_per_token.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-dark-700 font-medium text-sm">Total Value</span>
                    <span className="font-bold text-primary-600 text-lg">₹ {(item.quantity * item.ask_price_per_token).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-dark-500 mb-6">
                  <span>Seller: {item.users?.full_name}</span>
                </div>
                
                <button className="w-full btn-primary flex items-center justify-center">
                  Buy Tokens <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
