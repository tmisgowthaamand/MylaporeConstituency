import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';

export default function Footer() {
  const { t } = useLang();


  return (
    <footer className="relative w-full bg-[#990000] overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          alt="Footer background image"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          src="/bg.png"
          loading="eager"
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 w-full border-b border-white/50">
        <div className="flex flex-col md:flex-row">
          {/* Images */}
          <div className="flex w-full md:w-[35%] xl:w-[30%] flex-col items-center md:items-end relative order-2 md:order-1 mt-2 md:mt-0">
            <div className="w-[85%] sm:w-[70%] md:w-full aspect-[1.4/1] pointer-events-none mt-auto relative flex items-end justify-start pl-2 gap-2">
              <img
                alt="Thalaivar Vijay"
                decoding="async"
                className="w-[60%] h-[130%] object-contain object-bottom"
                style={{ filter: 'brightness(1.18) contrast(1.05)' }}
                src="/footer-1.png"
                loading="eager"
              />
              <img
                alt="MLA"
                decoding="async"
                className="w-[38%] h-[75%] object-contain object-bottom"
                src="/footer-2.png"
                loading="eager"
              />
            </div>
          </div>

          {/* Content - Full width on mobile, 65% on desktop */}
          <div className="w-full md:w-[65%] xl:w-[70%] px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 flex flex-col justify-between order-1 md:order-2">
            <div>
              <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4">Join the movement</h2>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-4 md:mb-6">
                Driven by the core vision that everyone deserves everything, Tamilaga Vetri Kazhagam works to advance people-centric politics - for the people, with the people, as one among the people.
              </p>
              <div className="flex justify-end">
                <a href="https://tvk.family/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#FFD700] rounded-lg px-4 py-2 text-black font-semibold hover:bg-[#FFD700]/90 transition-colors text-sm flex-shrink-0">
                  <span className="whitespace-nowrap">Join TVK</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex flex-col gap-4 md:gap-6 mt-6 md:mt-8">
              <div className="flex gap-2 flex-wrap justify-end">
                <a href="https://x.com/TVKVijayHQ" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="p-2 text-white hover:text-[#FFD700] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75-2.45 7-7 7-11.6V3z" /></svg>
                </a>
                <a href="https://www.instagram.com/tvkvijayhq/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 text-white hover:text-[#FFD700] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="#990000" /><circle cx="17.5" cy="6.5" r="1.5" fill="#990000" /></svg>
                </a>
                <a href="https://www.facebook.com/TVKVijayHQ/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 text-white hover:text-[#FFD700] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z" /></svg>
                </a>
                <a href="https://www.youtube.com/@TVKVijayHQ-Offl" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 text-white hover:text-[#FFD700] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.54c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.25z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#990000" /></svg>
                </a>
                <a href="https://www.threads.com/@tvkvijayhq" target="_blank" rel="noopener noreferrer" aria-label="Threads" className="p-2 text-white hover:text-[#FFD700] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1" /><path d="M12 13a8 8 0 0 1 0-16 8 8 0 0 1 0 16m0-2a6 6 0 0 0 0-12 6 6 0 0 0 0 12" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Footer Links Section */}
      <div className="relative z-10 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="mb-8">
          <h3 className="text-[#FFD700] text-xl md:text-2xl font-bold mb-6">Tamilaga Vettri Kazhagam</h3>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            <div>
              <h4 className="text-[#FFD700] font-semibold text-sm mb-3">2026 - Election</h4>
              <ul className="space-y-2 text-xs text-white/90">
                <li><a href="/en/election-candidates/tamilnadu" className="hover:text-white">Candidates</a></li>
                <li><a href="/en/manifesto" className="hover:text-white">Guarantees</a></li>
                <li><a href="/en/disclosures/TN2026C7form" className="hover:text-white">Disclosures</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-sm mb-3">Party</h4>
              <ul className="space-y-2 text-xs text-white/90">
                <li><a href="/en/about-party" className="hover:text-white">About</a></li>
                <li><a href="/en/ideology" className="hover:text-white">Ideology</a></li>
                <li><a href="/en/action-plan" className="hover:text-white">Action Plan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-sm mb-3">Organisation</h4>
              <ul className="space-y-2 text-xs text-white/90">
                <li><a href="/en/leadership" className="hover:text-white">Leadership</a></li>
                <li><a href="/en/district-leadership" className="hover:text-white">Districts</a></li>
                <li><a href="/en/wings" className="hover:text-white">Wings</a></li>
                <li><a href="/en/committees" className="hover:text-white">Committees</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-sm mb-3">Updates</h4>
              <ul className="space-y-2 text-xs text-white/90">
                <li><a href="/en/resolutions" className="hover:text-white">Resolutions</a></li>
                <li><a href="/en/announcements" className="hover:text-white">News</a></li>
                <li><a href="/en/events" className="hover:text-white">Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-sm mb-3">More</h4>
              <ul className="space-y-2 text-xs text-white/90">
                <li><a href="/en/gallery" className="hover:text-white">Gallery</a></li>
                <li><a href="/en/contact-us" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Mobile Stack */}
          <div className="md:hidden space-y-4">
            <div>
              <h4 className="text-[#FFD700] font-semibold text-xs mb-2">Election</h4>
              <div className="flex flex-wrap gap-3 text-xs text-white/90">
                <a href="/en/election-candidates/tamilnadu" className="hover:text-white">Candidates</a>
                <a href="/en/manifesto" className="hover:text-white">Guarantees</a>
              </div>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-xs mb-2">Party</h4>
              <div className="flex flex-wrap gap-3 text-xs text-white/90">
                <a href="/en/about-party" className="hover:text-white">About</a>
                <a href="/en/ideology" className="hover:text-white">Ideology</a>
              </div>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-xs mb-2">Organisation</h4>
              <div className="flex flex-wrap gap-3 text-xs text-white/90">
                <a href="/en/leadership" className="hover:text-white">Leadership</a>
                <a href="/en/wings" className="hover:text-white">Wings</a>
              </div>
            </div>
            <div>
              <h4 className="text-[#FFD700] font-semibold text-xs mb-2">Updates</h4>
              <div className="flex flex-wrap gap-3 text-xs text-white/90">
                <a href="/en/resolutions" className="hover:text-white">News</a>
                <a href="/en/events" className="hover:text-white">Events</a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/30"></div>

        {/* Copyright */}
        <div className="text-center text-white/60 text-xs mt-6 pt-4">
          <p>© 2026 Tamilaga Vettri Kazhagam. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
