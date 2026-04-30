import { useState, useEffect } from 'react';
import api from '../../api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function formatFaults(faults) {
  if (!faults) return 'Unknown fault';
  if (typeof faults === 'string') return faults;
  if (Array.isArray(faults)) return faults.join(', ');
  if (Array.isArray(faults.active)) return faults.active.join(', ');
  return JSON.stringify(faults);
}

export default function FaultHistory({ vehicleId }) {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get(`/api/vehicles/${vehicleId}/faults`, { params });
      setFaults(res.data);
    } catch {
      setFaults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [vehicleId]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading...</p>
        ) : faults.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
            <p>No faults recorded in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Fault Description</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Speed</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">SoC</th>
                </tr>
              </thead>
              <tbody>
                {faults.map((f) => (
                  <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(f.recorded_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                        <span className="text-red-300">{formatFaults(f.faults)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {f.speed !== null ? `${parseFloat(f.speed).toFixed(1)} km/h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.soc !== null ? (
                        <span
                          className={
                            f.soc > 50 ? 'text-green-400' : f.soc > 20 ? 'text-yellow-400' : 'text-red-400'
                          }
                        >
                          {parseFloat(f.soc).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-600 px-4 py-2">
              Showing {faults.length} fault record{faults.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
