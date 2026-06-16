import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, TrendingUp, Users, ChevronRight, CheckCircle2 } from 'lucide-react';

export const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.png" 
            alt="Vast green landscape with digital overlay" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-800 px-4 py-2 rounded-full mb-6 font-medium text-sm animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
              </span>
              <span>New feature: Secondary Token Marketplace is live!</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-dark-900 leading-tight mb-6 tracking-tight">
              Tokenize your land. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-green-400">
                Unlock its potential.
              </span>
            </h1>
            
            <p className="text-xl text-dark-700 mb-10 leading-relaxed max-w-lg">
              Connect directly with investors to fund your real estate projects. Convert idle land into thriving assets like sports turfs, solar farms, or coworking spaces.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register?role=investor" className="btn-primary flex items-center justify-center text-lg px-8 py-4">
                Start Investing <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/register?role=landowner" className="btn-secondary flex items-center justify-center text-lg px-8 py-4 bg-white/80 backdrop-blur-sm border-primary-200">
                List Your Land
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Glassmorphism Cards */}
        <div className="absolute hidden lg:block right-10 top-1/4 transform -translate-y-12 animate-[bounce_6s_infinite]">
          <div className="glass p-6 rounded-2xl max-w-xs shadow-xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-primary-100 p-3 rounded-xl text-primary-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-800">Expected ROI</p>
                <p className="text-2xl font-bold text-primary-600">12-18%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 w-3/4"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">How LandConnect Works</h2>
            <p className="text-lg text-dark-600 max-w-2xl mx-auto">A seamless platform bridging the gap between property owners and capital investors.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-primary-100 -translate-y-1/2 z-0" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-glass flex items-center justify-center text-primary-600 mb-6 border border-primary-100 transition-transform hover:scale-110">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">1. List & Verify</h3>
              <p className="text-dark-600">Landowners list their property and project plans. All documents undergo strict KYC and legal verification.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-glass flex items-center justify-center text-primary-600 mb-6 border border-primary-100 transition-transform hover:scale-110">
                <Users size={36} />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">2. Connect & Negotiate</h3>
              <p className="text-dark-600">Investors browse verified projects, submit proposals, and negotiate terms directly with landowners via in-app chat.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-glass flex items-center justify-center text-primary-600 mb-6 border border-primary-100 transition-transform hover:scale-110">
                <TrendingUp size={36} />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">3. Tokenize & Earn</h3>
              <p className="text-dark-600">Upon agreement, ownership is tokenized. Manage your cap table and receive automated revenue distributions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">Featured Projects</h2>
              <p className="text-lg text-dark-600">Discover high-yield investment opportunities.</p>
            </div>
            <Link to="/listings" className="hidden md:flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              View all listings <ChevronRight size={20} className="ml-1" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="card group cursor-pointer">
              <div className="relative h-64 overflow-hidden">
                <img src="/turf.png" alt="Sports Turf" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary-800 text-xs font-bold px-3 py-1 rounded-full">
                  SPORTS TURF
                </div>
                <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
                  85% FUNDED
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark-900 mb-2">Premium Football Turf Facility</h3>
                <p className="text-dark-600 text-sm mb-4 line-clamp-2">A high-demand 5-a-side football turf in the heart of the tech park district. High footfall guaranteed.</p>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Target Raise</span>
                    <span className="font-semibold text-dark-900">₹ 45,00,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Expected ROI</span>
                    <span className="font-semibold text-primary-600">14.5% p.a.</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div className="h-full bg-primary-500 w-[85%] transition-all duration-1000"></div>
                </div>
                <button className="w-full btn-secondary group-hover:bg-primary-50 group-hover:border-primary-300">View Details</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card group cursor-pointer">
              <div className="relative h-64 overflow-hidden">
                <img src="/solar.png" alt="Solar Farm" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary-800 text-xs font-bold px-3 py-1 rounded-full">
                  SOLAR
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark-900 mb-2">5MW Grid-Connected Solar Farm</h3>
                <p className="text-dark-600 text-sm mb-4 line-clamp-2">Long-term PPA secured with the state utility board. Low risk, steady returns for 25 years.</p>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Target Raise</span>
                    <span className="font-semibold text-dark-900">₹ 2,50,00,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Expected ROI</span>
                    <span className="font-semibold text-primary-600">11.0% p.a.</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div className="h-full bg-primary-500 w-[40%] transition-all duration-1000"></div>
                </div>
                <button className="w-full btn-secondary group-hover:bg-primary-50 group-hover:border-primary-300">View Details</button>
              </div>
            </div>

            {/* CTA Card */}
            <div className="card bg-gradient-to-br from-primary-600 to-green-500 p-8 flex flex-col justify-center items-center text-center text-white sm:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Want to see more opportunities?</h3>
              <p className="text-primary-50 mb-8 opacity-90">Join thousands of investors already earning passive income through LandConnect.</p>
              <Link to="/register?role=investor" className="bg-white text-primary-700 font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 w-full">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-24 bg-dark-900 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Bank-Grade Security for Your Peace of Mind</h2>
              <p className="text-dark-300 text-lg mb-8 leading-relaxed">
                We take security seriously. From rigorous legal due diligence to immutable cap tables, your investments are protected at every step.
              </p>
              <ul className="space-y-4">
                {[
                  'Comprehensive legal verification for all properties',
                  'Strict KYC/AML checks for all participants',
                  'Smart escrow for secure transaction handling',
                  'Real-time automated cap table management',
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="text-primary-400 mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-dark-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-dark p-8 rounded-2xl relative">
              <div className="absolute -top-4 -right-4 bg-primary-500 text-white p-4 rounded-xl shadow-lg animate-bounce">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-semibold mb-6">Our Due Diligence Process</h3>
              <div className="space-y-6">
                <div className="relative pl-8 border-l-2 border-primary-500/30">
                  <div className="absolute w-4 h-4 bg-primary-500 rounded-full -left-[9px] top-1"></div>
                  <h4 className="font-medium text-lg">Title Verification</h4>
                  <p className="text-sm text-dark-400 mt-1">30-year encumbrance certificate check by empaneled lawyers.</p>
                </div>
                <div className="relative pl-8 border-l-2 border-primary-500/30">
                  <div className="absolute w-4 h-4 bg-primary-500 rounded-full -left-[9px] top-1"></div>
                  <h4 className="font-medium text-lg">Zoning & Compliance</h4>
                  <p className="text-sm text-dark-400 mt-1">Local municipality approvals and environmental clearance checks.</p>
                </div>
                <div className="relative pl-8 border-l-2 border-transparent">
                  <div className="absolute w-4 h-4 border-2 border-primary-500 bg-dark-900 rounded-full -left-[9px] top-1"></div>
                  <h4 className="font-medium text-lg">Financial Viability</h4>
                  <p className="text-sm text-dark-400 mt-1">Independent auditing of project cost and revenue projections.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
