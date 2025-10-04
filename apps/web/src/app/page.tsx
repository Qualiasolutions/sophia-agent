import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              SophiaAI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
              Intelligent WhatsApp Assistant for Cyprus Real Estate
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                What is SophiaAI?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Sophia is an AI-powered assistant designed specifically for real estate agents at zyprus.com.
                She automates administrative tasks, generates documents, performs real estate calculations,
                and provides intelligent conversational support through WhatsApp.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Document Generation
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Automated creation of registration forms, contracts, and marketing materials
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                  Real Estate Calculators
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Transfer fees, capital gains tax, and VAT calculations on demand
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                  Conversational AI
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  Natural language understanding powered by OpenAI GPT-4
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg text-center"
            >
              Admin Dashboard
            </Link>
            <a
              href="https://github.com/Qualiasolutions/sophia-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg text-center"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 px-8 py-4">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Qualia Solutions. Powered by Next.js, Supabase, and OpenAI.
          </p>
        </div>
      </div>
    </div>
  );
}
