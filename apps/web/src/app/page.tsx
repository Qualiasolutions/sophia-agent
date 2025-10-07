import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-12 md:p-16">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png"
                alt="Qualia Solutions"
                width={400}
                height={120}
                priority
                className="h-auto w-auto max-w-sm"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Qualia AI Agents Suite™
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
              Unified AI operations hub for Cyprus real estate teams
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Document Generation
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Automated creation of registration forms, contracts, and marketing materials
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Real Estate Calculators
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Transfer fees, capital gains tax, and VAT calculations on demand
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-xl p-6 border border-violet-200 dark:border-violet-800">
              <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Conversational AI
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Natural language understanding powered by OpenAI GPT-4
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              href="/admin"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
            >
              Access Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 px-8 py-6 border-t border-gray-300 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Qualia Solutions. Powered by Next.js, Supabase, and OpenAI.
          </p>
        </div>
      </div>
    </div>
  );
}
