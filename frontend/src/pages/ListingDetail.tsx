import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { 
  MapPin, Loader2, ArrowLeft, Image as ImageIcon, 
  PlaySquare, FileText, CheckCircle2, TrendingUp,
  PieChart, Building2, Coins, ChevronRight, User
} from 'lucide-react';

export const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents' | 'cap_table'>('overview');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const listing = response?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h2 className="text-2xl font-bold text-dark-900 mb-4">Listing not found</h2>
        <Link to="/listings" className="text-primary-600 hover:underline flex items-center">
          <ArrowLeft size={20} className="mr-2" /> Back to listings
        </Link>
      </div>
    );
  }

  const mediaImages = listing.listing_media?.filter((m: any) => m.type === 'image') || [];
  const mediaDocs = listing.listing_media?.filter((m: any) => m.type === 'document') || [];
  const capTable = listing.cap_table || [];

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Back button & Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/listings" className="inline-flex items-center text-sm font-medium text-dark-500 hover:text-primary-600 mb-4 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to explore
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {listing.project_type.replace('_', ' ')}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  listing.status === 'active' ? 'bg-green-100 text-green-800' :
                  listing.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {listing.status}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-dark-900 mb-2">{listing.title}</h1>
              <div className="flex items-center text-dark-500">
                <MapPin size={18} className="mr-1" />
                <span>{listing.location}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAuthenticated && user?.role === 'investor' && listing.status === 'active' && (
                <button className="btn-primary py-3 px-8 text-lg font-bold shadow-lg animate-pulse hover:animate-none">
                  Invest Now
                </button>
              )}
              {isAuthenticated && user?.id !== listing.owner_id && (
                <button className="btn-secondary py-3 px-6 text-lg">
                  Message Owner
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Left 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Media Gallery */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 relative mb-2">
                {mediaImages.length > 0 ? (
                  <img 
                    src={mediaImages[activeMediaIndex].url} 
                    alt="Property" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={48} className="mb-2" />
                    <p>No images available</p>
                  </div>
                )}
              </div>
              
              {mediaImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {mediaImages.map((media: any, idx: number) => (
                    <button 
                      key={media.id}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                        activeMediaIndex === idx ? 'ring-2 ring-primary-500 ring-offset-1' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={media.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'financials', label: 'Financials & Tokens', icon: TrendingUp },
                  { id: 'documents', label: 'Documents', icon: FileText },
                  { id: 'cap_table', label: 'Cap Table', icon: PieChart },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id 
                        ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50/50' 
                        : 'text-dark-500 hover:text-dark-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={18} className="mr-2 hidden sm:block" /> {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="p-6 md:p-8">
                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-xl font-bold text-dark-900 mb-4">About the Project</h3>
                    <div className="prose max-w-none text-dark-600 whitespace-pre-wrap mb-8 leading-relaxed">
                      {listing.description}
                    </div>
                    
                    <h3 className="text-xl font-bold text-dark-900 mb-4">Key Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-dark-500 mb-1">Plot Size</p>
                        <p className="font-semibold text-dark-900">{listing.plot_size_sqft.toLocaleString()} sq.ft.</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-dark-500 mb-1">Timeline</p>
                        <p className="font-semibold text-dark-900">{listing.timeline_months} Months</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-dark-500 mb-1">Land Owner</p>
                        <p className="font-semibold text-dark-900 flex items-center">
                          <User size={16} className="mr-1 text-primary-600" />
                          {listing.users?.full_name}
                        </p>
                      </div>
                    </div>

                    {listing.listing_amenities && listing.listing_amenities.length > 0 && (
                      <>
                        <h3 className="text-xl font-bold text-dark-900 mb-4 mt-8">Amenities & Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {listing.listing_amenities.map((a: any) => (
                            <span key={a.id} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center border border-green-100">
                              <CheckCircle2 size={14} className="mr-1" /> {a.amenity_name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Financials */}
                {activeTab === 'financials' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="glass p-6 rounded-xl border border-primary-100">
                        <h4 className="text-primary-800 font-semibold mb-4 flex items-center"><TrendingUp size={20} className="mr-2" /> Investment Profile</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-primary-100 pb-2">
                            <span className="text-dark-600">Total Investment Required</span>
                            <span className="font-bold text-dark-900">₹ {listing.investment_required.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-primary-100 pb-2">
                            <span className="text-dark-600">Current Market Value</span>
                            <span className="font-bold text-dark-900">₹ {listing.market_value.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pb-2">
                            <span className="text-dark-600">Expected Annual Returns</span>
                            <span className="font-bold text-primary-600 text-lg">{listing.expected_returns}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="glass p-6 rounded-xl border border-blue-100 bg-blue-50/30">
                        <h4 className="text-blue-800 font-semibold mb-4 flex items-center"><Coins size={20} className="mr-2" /> Tokenomics</h4>
                        {listing.tokens && listing.tokens.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                              <span className="text-dark-600">Total Supply</span>
                              <span className="font-bold text-dark-900">{listing.tokens[0].total_supply.toLocaleString()} Tokens</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-100 pb-2">
                              <span className="text-dark-600">Value Per Token</span>
                              <span className="font-bold text-dark-900">₹ {listing.tokens[0].token_value.toLocaleString()}</span>
                            </div>
                            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100 text-sm text-dark-600 flex items-start">
                              <div className="text-blue-500 mr-2 mt-0.5">ℹ️</div>
                              Tokens represent your fractional ownership and right to revenue distributions.
                            </div>
                          </div>
                        ) : (
                          <div className="text-dark-500 text-sm flex flex-col items-center py-4">
                            <Coins size={32} className="text-gray-300 mb-2" />
                            <p>Tokens not yet minted for this project.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Cap Table */}
                {activeTab === 'cap_table' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-xl font-bold text-dark-900 mb-4">Capitalization Table</h3>
                    {capTable.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="py-3 px-4 text-dark-500 font-semibold text-sm">Stakeholder</th>
                              <th className="py-3 px-4 text-dark-500 font-semibold text-sm text-right">Tokens Held</th>
                              <th className="py-3 px-4 text-dark-500 font-semibold text-sm text-right">Ownership</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {capTable.map((entry: any) => (
                              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-4">
                                  <div className="font-medium text-dark-900">{entry.users?.full_name || 'Anonymous Investor'}</div>
                                  {entry.stakeholder_id === listing.owner_id && (
                                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded ml-2">Project Owner</span>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-right font-medium">{entry.tokens_held.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right font-bold text-primary-600">{Number(entry.ownership_pct).toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-dark-500">
                        Cap table will be available once the project is funded and tokens are distributed.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Documents */}
                {activeTab === 'documents' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-xl font-bold text-dark-900 mb-4">Project Documents</h3>
                    {mediaDocs.length > 0 ? (
                      <div className="grid gap-4">
                        {mediaDocs.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all group">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mr-4">
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-dark-900">{doc.label || 'Project Document'}</p>
                                <p className="text-xs text-dark-500 uppercase">{doc.url.split('.').pop() || 'PDF'}</p>
                              </div>
                            </div>
                            <button className="text-primary-600 hover:text-primary-800 font-medium text-sm hidden group-hover:block px-4 py-2 bg-primary-50 rounded-lg">
                              View Securely
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center">
                        <FileText size={32} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-dark-600 font-medium">No public documents available.</p>
                        <p className="text-sm text-dark-500 mt-1">Detailed legal documents are shared securely during the negotiation phase.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar CTA (Right 1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              
              <div className="glass p-6 rounded-2xl shadow-lg border border-primary-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 rounded-bl-full pointer-events-none"></div>
                
                <h3 className="text-xl font-bold text-dark-900 mb-2">Funding Status</h3>
                <div className="text-3xl font-extrabold text-primary-600 mb-1">
                  ₹ 0 <span className="text-sm font-medium text-dark-500">raised</span>
                </div>
                <div className="text-sm text-dark-600 mb-6">of ₹ {listing.investment_required.toLocaleString()} goal</div>
                
                <div className="w-full h-3 bg-gray-100 rounded-full mb-2 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-green-400 w-[0%]"></div>
                </div>
                <div className="flex justify-between text-xs font-semibold text-dark-500 mb-8">
                  <span>0%</span>
                  <span>100%</span>
                </div>

                {isAuthenticated ? (
                  user?.role === 'investor' ? (
                    <button className="w-full btn-primary py-4 text-lg shadow-xl shadow-primary-500/20">
                      Submit Proposal
                    </button>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 text-center p-3 rounded-lg text-sm text-dark-600">
                      You are logged in as a Landowner. Only Investors can submit proposals.
                    </div>
                  )
                ) : (
                  <Link to="/login" className="w-full btn-primary py-4 text-lg shadow-xl shadow-primary-500/20 flex justify-center items-center">
                    Login to Invest
                  </Link>
                )}
                
                <div className="mt-6 flex items-center justify-center text-sm text-dark-500">
                  <ShieldCheck size={16} className="text-green-500 mr-1" /> Secure transaction via Smart Escrow
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-semibold text-dark-900 mb-4 border-b border-gray-100 pb-2">Why Invest Here?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 size={18} className="text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-dark-700">Prime location with high growth potential</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 size={18} className="text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-dark-700">Clear title & pre-verified documents</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 size={18} className="text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-dark-700">Quarterly automated revenue distributions</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
