import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Search, MapPin, Loader2, SlidersHorizontal, ArrowRight } from 'lucide-react';
import type { Listing } from '@landconnect/shared';

export const BrowseListings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectType, setProjectType] = useState('');
  const [page, setPage] = useState(1);

  // Fetch listings
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', { page, search: searchTerm, project_type: projectType }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (projectType) params.append('project_type', projectType);
      
      const res = await api.get(`/listings?${params.toString()}`);
      return res.data;
    },
  });

  const listings: Listing[] = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-dark-900 mb-6">Explore Opportunities</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by title, description or location..." 
                className="input-field pl-12 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select 
                className="input-field h-12 w-48 bg-white"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="turf">Sports Turf</option>
                <option value="solar">Solar Farm</option>
                <option value="office">Office Space</option>
                <option value="warehouse">Warehouse</option>
                <option value="ev_station">EV Charging</option>
                <option value="coworking">Co-working</option>
                <option value="other">Other</option>
              </select>
              <button className="btn-secondary h-12 flex items-center px-4">
                <SlidersHorizontal size={20} className="mr-2" /> Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-600 mb-4" size={40} />
            <p className="text-dark-600">Loading opportunities...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-xl text-center">
            Failed to load listings. Please try again.
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-2xl font-semibold text-dark-900 mb-2">No listings found</h3>
            <p className="text-dark-600">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((listing: any) => (
                <Link to={`/listings/${listing.id}`} key={listing.id} className="card group hover:-translate-y-1 block">
                  <div className="relative h-60 overflow-hidden bg-gray-100">
                    {listing.listing_media?.[0]?.url ? (
                      <img 
                        src={listing.listing_media[0].url} 
                        alt={listing.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {listing.project_type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-dark-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center text-dark-500 text-sm mb-4">
                      <MapPin size={16} className="mr-1" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-dark-500 mb-1">Target Raise</p>
                        <p className="font-semibold text-dark-900">₹ {(listing.investment_required / 100000).toFixed(1)}L</p>
                      </div>
                      <div className="bg-primary-50 p-3 rounded-lg">
                        <p className="text-xs text-primary-600 mb-1">Exp. Returns</p>
                        <p className="font-bold text-primary-700">{listing.expected_returns}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-primary-600 font-medium group-hover:text-primary-700">
                      View full details <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-lg ${page === i + 1 ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-dark-600'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
