import React, { useState, useEffect } from 'react';
import { Search, Globe, Database, Code, Cpu, ExternalLink, AlertCircle, Loader2, FileText, Layers, ArrowRight, X, Copy, Check } from 'lucide-react';

// --- Mock Data Generator for Preview Mode ---
const generateMockResults = (url, query) => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `chunk-${i}`,
    score: (0.98 - (i * 0.05)).toFixed(3),
    content: `...This is a simulated matching chunk #${i + 1} from the website <b>${url}</b> based on your query "<b>${query}</b>". <br/><br/> In a real scenario, this would contain semantic matches extracted from the HTML DOM, cleaned of scripts and styles, and ranked by vector similarity via Pinecone...`,
    start_index: 100 * i,
    end_index: 100 * i + 500
  }));
};

const App = () => {
  const [url, setUrl] = useState('https://en.wikipedia.org/wiki/Artificial_intelligence');
  const [query, setQuery] = useState('machine learning history');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Modal & Copy State
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Check backend health on load
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await fetch('http://localhost:8000/health', { method: 'GET' });
        const data = await fetch('http://localhost:8000/health', { method: 'GET' }).then(res => res.json());
        if (data.status === 'ok') setBackendStatus('connected');
        else setBackendStatus('disconnected');
      } catch (e) {
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!url || !query) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Attempt to hit the real backend
      const response = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, query, limit: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Backend Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results);
      setBackendStatus('connected');

    } catch (err) {
      console.warn("Backend fetch failed, switching to Mock Mode for demo.");
      if (backendStatus === 'connected') {
          setError(err.message);
      } else {
          // Fallback to mock data for the preview environment
          setTimeout(() => {
            setResults(generateMockResults(url, query));
            setLoading(false);
          }, 1500);
      }
    } finally {
      if (backendStatus === 'connected' || error) {
        setLoading(false);
      }
    }
  };

  const handleCopy = (text, id) => {
      // Strip HTML tags for cleaner copying
      const cleanText = text.replace(/<[^>]+>/g, '');
      navigator.clipboard.writeText(cleanText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
              <Database size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              VectorWeb Search
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors duration-300 ${
                backendStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              {backendStatus === 'connected' ? 'Pinecone Connected' : 'Preview Mode'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero / Input Section */}
        <section className="mb-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Semantic Search for the Web
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Don't just match keywords. Match <i>meaning</i>. Enter a URL to vectorize its content and find context-aware answers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <form onSubmit={handleSearch} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Website URL</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semantic Query</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="e.g., What are the key benefits mentioned?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    <span>Vectorizing & Searching...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={22} />
                    <span>Process & Search</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Layers className="text-indigo-600" size={28}/>
                Search Results
              </h3>
              <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">Sorted by Relevance (Cosine Similarity)</span>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                    {results.length} Matches
                  </span>
              </div>
            </div>

            <div className="grid gap-6">
              {results.map((item, idx) => (
                <div key={item.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative">
                  {/* Relevance Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded shadow-sm">
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        <span className="font-bold">Score:</span>
                        {item.score}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                       Source ID: {item.id.substring(0, 8)}...
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-1.5 bg-slate-100 rounded text-slate-400 flex-shrink-0">
                            <FileText size={18} />
                        </div>
                        <div
                        className="prose prose-slate max-w-none prose-sm text-slate-600 leading-relaxed line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setSelectedChunk(item)}
                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wide cursor-pointer hover:text-indigo-800"
                      >
                          Read Context <ArrowRight size={14} />
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feature Grid (Empty State) */}
        {!results && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto opacity-80 pb-20">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
                <Code size={24} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">HTML Extraction</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Backend scrapes the DOM, removing noise like scripts and navbars to isolate meaningful text.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 border border-purple-100">
                <ExternalLink size={24} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Vector Embeddings</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Text is chunked (500 tokens) and converted into 384-dimensional vectors using SentenceTransformers.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                <Database size={24} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Pinecone Search</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Vectors are indexed in Pinecone (Cloud). We perform a nearest neighbor search to find relevant content.</p>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Reading Context */}
      {selectedChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileText size={18} className="text-indigo-600"/>
                        Result Details
                    </h3>
                    <button
                        onClick={() => setSelectedChunk(null)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
                    <div className="mb-6 flex gap-3 text-sm">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-mono text-xs border border-indigo-100 font-medium">
                            Similarity: {selectedChunk.score}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-mono text-xs border border-slate-200">
                            ID: {selectedChunk.id.substring(0,12)}...
                        </span>
                    </div>
                    <div
                        className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-700"
                        dangerouslySetInnerHTML={{ __html: selectedChunk.content }}
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button
                        onClick={() => handleCopy(selectedChunk.content, selectedChunk.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all border ${
                            copiedId === selectedChunk.id
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                        {copiedId === selectedChunk.id ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                        {copiedId === selectedChunk.id ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                        onClick={() => setSelectedChunk(null)}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;