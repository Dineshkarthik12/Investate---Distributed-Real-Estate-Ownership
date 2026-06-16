import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { 
  Building2, Briefcase, PlusCircle, AlertCircle, 
  CheckCircle2, Loader2, ArrowRight, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  // Dynamic dashboard based on role
  const isLandowner = user?.role === 'landowner';
  const profile = profileData?.data;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-dark-900">Welcome back, {user?.full_name}</h1>
              <p className="text-dark-500 mt-1">
                {isLandowner ? 'Manage your properties and active proposals.' : 'Track your investments and portfolio.'}
              </p>
            </div>
            {isLandowner && (
              <button className="btn-primary flex items-center shrink-0 w-fit">
                <PlusCircle size={20} className="mr-2" /> List New Property
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KYC Alert */}
        {profile?.kyc_status === 'pending' && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start text-yellow-800 shadow-sm">
            <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">KYC Verification Pending</h3>
              <p className="text-sm mt-1 opacity-90">Your account is currently under review. You'll be able to fully interact with the platform once approved.</p>
            </div>
          </div>
        )}
        
        {profile?.kyc_status === 'not_submitted' && (
          <div className="mb-8 bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-blue-800 shadow-sm">
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Complete your KYC</h3>
                <p className="text-sm mt-1 opacity-90">Please complete identity verification to start {isLandowner ? 'listing properties' : 'investing'}.</p>
              </div>
            </div>
            <button className="btn-secondary bg-white text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 w-fit">
              Verify Now
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm' : 'text-dark-600 hover:bg-white hover:border hover:border-gray-200 border border-transparent'
              }`}
            >
              <Briefcase size={18} className="mr-3" /> Overview
            </button>
            {isLandowner ? (
              <>
                <button 
                  onClick={() => setActiveTab('listings')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'listings' ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm' : 'text-dark-600 hover:bg-white hover:border hover:border-gray-200 border border-transparent'
                  }`}
                >
                  <Building2 size={18} className="mr-3" /> My Properties
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setActiveTab('portfolio')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'portfolio' ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm' : 'text-dark-600 hover:bg-white hover:border hover:border-gray-200 border border-transparent'
                  }`}
                >
                  <Wallet size={18} className="mr-3" /> My Portfolio
                </button>
              </>
            )}
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-8">
            
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {isLandowner ? (
                    <>
                      <div className="glass p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-dark-500 text-sm font-medium mb-1">Total Properties</p>
                        <p className="text-3xl font-bold text-dark-900">{profile?.profile?.total_listings || 0}</p>
                      </div>
                      <div className="glass p-6 rounded-xl border border-primary-100 bg-primary-50/30 shadow-sm">
                        <p className="text-primary-800 text-sm font-medium mb-1">Total Raised</p>
                        <p className="text-3xl font-bold text-primary-700">₹ 0</p>
                      </div>
                      <div className="glass p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-dark-500 text-sm font-medium mb-1">Active Proposals</p>
                        <p className="text-3xl font-bold text-dark-900">0</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="glass p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-dark-500 text-sm font-medium mb-1">Total Investments</p>
                        <p className="text-3xl font-bold text-dark-900">₹ 0</p>
                      </div>
                      <div className="glass p-6 rounded-xl border border-green-100 bg-green-50/30 shadow-sm">
                        <p className="text-green-800 text-sm font-medium mb-1">Total Payouts Received</p>
                        <p className="text-3xl font-bold text-green-700">₹ 0</p>
                      </div>
                      <div className="glass p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-dark-500 text-sm font-medium mb-1">Active Tokens Held</p>
                        <p className="text-3xl font-bold text-dark-900">0</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Empty state for fresh accounts */}
                <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    {isLandowner ? <Building2 size={32} className="text-gray-400" /> : <Wallet size={32} className="text-gray-400" />}
                  </div>
                  <h3 className="text-xl font-semibold text-dark-900 mb-2">
                    {isLandowner ? "You haven't listed any properties yet" : "You haven't made any investments yet"}
                  </h3>
                  <p className="text-dark-500 max-w-md mx-auto mb-6">
                    {isLandowner 
                      ? "Start by listing your land to connect with investors and fund your projects." 
                      : "Explore the marketplace to find high-yield real estate projects backed by solid assets."}
                  </p>
                  {isLandowner ? (
                    <button className="btn-primary" disabled={profile?.kyc_status !== 'approved'}>
                      Create First Listing
                    </button>
                  ) : (
                    <Link to="/listings" className="btn-primary inline-flex">
                      Browse Opportunities
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Other tabs would go here... we keep it simple for the demo */}
            {(activeTab === 'listings' || activeTab === 'portfolio') && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-dark-500">
                  Detailed view coming soon.
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
