import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  BrainCircuit, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  Sliders, 
  ArrowUpRight,
  Zap,
  Clock,
  Sparkles,
  Gauge
} from 'lucide-react';

export interface TrafficDataInput {
  timeLabel: string;
  secondsAgo: number;
  ingressPackets: number;
  sanitizedPackets?: number;
  enclaveEncrypted?: number;
  quarantinedThreats?: number;
}

interface NeuralTrafficPredictionProps {
  recentTraffic: TrafficDataInput[];
}

interface PredictionDataPoint {
  timeLabel: string;
  timelineSec: number; // negative for past, 0 for now, positive for future
  isForecast: boolean;
  actualIngress: number | null;
  smaValue: number;
  predictedIngress: number | null;
  upperSpikeBand: number | null;
  lowerConfidenceBand: number | null;
  surgeRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export const NeuralTrafficPrediction: React.FC<NeuralTrafficPredictionProps> = ({
  recentTraffic
}) => {
  // Configurable Prediction Parameters
  const [smaWindow, setSmaWindow] = useState<5 | 10 | 20>(10);
  const [forecastHorizon, setForecastHorizon] = useState<10 | 20 | 30>(20);
  const [sensitivityMultiplier, setSensitivityMultiplier] = useState<number>(1.25);
  const [spikeInjected, setSpikeInjected] = useState<boolean>(false);

  // Compute Moving Averages and Future Projections
  const chartData = useMemo<PredictionDataPoint[]>(() => {
    if (!recentTraffic || recentTraffic.length === 0) return [];

    // Take the last 30 historical points
    const history = recentTraffic.slice(-30);
    const result: PredictionDataPoint[] = [];

    // 1. Calculate historical points with Simple Moving Average
    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      const windowStart = Math.max(0, i - smaWindow + 1);
      const windowSlice = history.slice(windowStart, i + 1);
      const sum = windowSlice.reduce((acc, curr) => acc + curr.ingressPackets, 0);
      const sma = Math.round(sum / windowSlice.length);
      const timelineSec = - (history.length - 1 - i);

      result.push({
        timeLabel: point.timeLabel || `-${Math.abs(timelineSec)}s`,
        timelineSec,
        isForecast: false,
        actualIngress: point.ingressPackets,
        smaValue: sma,
        predictedIngress: null,
        upperSpikeBand: null,
        lowerConfidenceBand: null,
        surgeRisk: point.ingressPackets > 2100 ? 'CRITICAL' : point.ingressPackets > 1800 ? 'HIGH' : 'LOW'
      });
    }

    // 2. Calculate momentum/trend velocity from recent SMA slope
    const lastIdx = result.length - 1;
    const currentActual = result[lastIdx].actualIngress || 1500;
    const currentSma = result[lastIdx].smaValue;

    // Moving average slope over the last 5 points
    const slopeWindow = Math.min(5, result.length);
    const priorSma = result[Math.max(0, lastIdx - slopeWindow + 1)].smaValue;
    const rawSlope = (currentSma - priorSma) / slopeWindow;
    const momentum = spikeInjected ? Math.max(rawSlope, 28) : rawSlope;

    // Connect the forecast starting at the current time (0s)
    result[lastIdx].predictedIngress = currentActual;
    result[lastIdx].upperSpikeBand = Math.round(currentActual * sensitivityMultiplier);
    result[lastIdx].lowerConfidenceBand = Math.round(currentActual * 0.85);

    // 3. Generate future forecast data points (+1 to +forecastHorizon seconds)
    const now = new Date();
    for (let step = 1; step <= forecastHorizon; step++) {
      const futureTime = new Date(now.getTime() + step * 1000);
      const timeLabel = `+${step}s`;

      // Moving average trend extrapolation with dampening and sinusoidal micro-variation
      const dampingFactor = Math.exp(-step / 25);
      const trendComponent = momentum * step * dampingFactor;
      const wave = Math.sin(step / 3) * (spikeInjected ? 90 : 45);
      const spikeBurst = spikeInjected ? Math.exp(-Math.pow(step - 8, 2) / 16) * 750 : 0;

      const projected = Math.max(
        600,
        Math.round(currentSma + trendComponent + wave + spikeBurst)
      );

      // Upper and lower confidence threshold bands
      const volatility = Math.round(projected * (sensitivityMultiplier - 1.0) * (1 + step * 0.02));
      const upper = Math.round(projected + volatility);
      const lower = Math.max(400, Math.round(projected - volatility * 0.7));

      let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (projected > 2300 || upper > 2800) risk = 'CRITICAL';
      else if (projected > 1900 || upper > 2300) risk = 'HIGH';
      else if (projected > 1650) risk = 'MODERATE';

      result.push({
        timeLabel,
        timelineSec: step,
        isForecast: true,
        actualIngress: null,
        smaValue: Math.round(currentSma + trendComponent * 0.7),
        predictedIngress: projected,
        upperSpikeBand: upper,
        lowerConfidenceBand: lower,
        surgeRisk: risk
      });
    }

    return result;
  }, [recentTraffic, smaWindow, forecastHorizon, sensitivityMultiplier, spikeInjected]);

  // Aggregate Prediction Analytics
  const analytics = useMemo(() => {
    const forecastPoints = chartData.filter(d => d.isForecast);
    if (forecastPoints.length === 0) {
      return {
        peakForecast: 1550,
        avgForecast: 1500,
        spikeProbability: 12,
        isSpikePredicted: false,
        spikeEtaSec: null,
        momentumRate: '+0.0 pkts/s²',
        saturationPct: 31
      };
    }

    let peak = 0;
    let peakSec = 0;
    let sum = 0;
    let spikeFound = false;
    let firstSpikeEta: number | null = null;

    forecastPoints.forEach(p => {
      const val = p.predictedIngress || 0;
      sum += val;
      if (val > peak) {
        peak = val;
        peakSec = p.timelineSec;
      }
      if (val >= 1950 && !spikeFound) {
        spikeFound = true;
        firstSpikeEta = p.timelineSec;
      }
    });

    const avg = Math.round(sum / forecastPoints.length);
    const prob = spikeInjected ? 89 : Math.min(98, Math.max(8, Math.round((peak / 2400) * 100)));
    const momentumVal = (forecastPoints[forecastPoints.length - 1]?.predictedIngress || 1500) - (chartData[chartData.length - forecastHorizon - 1]?.actualIngress || 1500);
    const momentumRate = `${momentumVal >= 0 ? '+' : ''}${(momentumVal / forecastHorizon).toFixed(1)} pkts/s²`;
    const saturationPct = Math.min(100, Math.round((peak / 4000) * 100));

    return {
      peakForecast: peak,
      avgForecast: avg,
      spikeProbability: prob,
      isSpikePredicted: spikeFound || peak >= 1950,
      spikeEtaSec: firstSpikeEta,
      momentumRate,
      saturationPct
    };
  }, [chartData, forecastHorizon, spikeInjected]);

  const handleSimulateSpike = () => {
    setSpikeInjected(true);
    setTimeout(() => {
      setSpikeInjected(false);
    }, 15000);
  };

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-4 shadow-sm">
      {/* Panel Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase font-mono flex items-center gap-1">
              <BrainCircuit className="w-3 h-3 text-purple-400" />
              <span>NEURAL PREDICTIVE ENGINE (SMA FORECAST)</span>
            </span>
            {analytics.isSpikePredicted ? (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-400 animate-pulse bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>POTENTIAL SURGE AT +{analytics.spikeEtaSec || 8}S</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>TRAFFIC STABLE ({analytics.spikeProbability}% SURGE RISK)</span>
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>Neural Traffic Prediction & Dynamic Packet Spike Forecast</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Simple Moving Average ({smaWindow}s SMA) extrapolation forecasting potential cyber-node ingress surges and buffer saturation over a +{forecastHorizon}s horizon.
          </p>
        </div>

        {/* Action Controls & Forecasting Horizon */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SMA Window Selector */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded border border-slate-800 text-xs">
            <span className="px-2 text-[10px] font-mono text-slate-400 uppercase">SMA:</span>
            {([5, 10, 20] as const).map((win) => (
              <button
                key={win}
                onClick={() => setSmaWindow(win)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  smaWindow === win
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {win}s
              </button>
            ))}
          </div>

          {/* Horizon Window Selector */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded border border-slate-800 text-xs">
            <span className="px-2 text-[10px] font-mono text-slate-400 uppercase">Horizon:</span>
            {([10, 20, 30] as const).map((h) => (
              <button
                key={h}
                onClick={() => setForecastHorizon(h)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  forecastHorizon === h
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                +{h}s
              </button>
            ))}
          </div>

          {/* Inject Surge Probe Simulation */}
          <button
            onClick={handleSimulateSpike}
            disabled={spikeInjected}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              spikeInjected
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                : 'bg-purple-950/70 hover:bg-purple-900/90 border-purple-500/40 text-purple-300 hover:text-purple-100'
            }`}
            title="Simulate a prompt injection packet flood to test predictive forecast alerting"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>{spikeInjected ? 'Surge Injected (15s)' : 'Simulate Spike'}</span>
          </button>
        </div>
      </div>

      {/* Live Forecast KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Forecast Peak ({forecastHorizon}s)</span>
          <span className={`text-lg font-bold font-mono ${analytics.peakForecast > 2000 ? 'text-rose-400' : 'text-purple-400'}`}>
            {analytics.peakForecast.toLocaleString()} <span className="text-xs font-normal text-slate-400">pkts/s</span>
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            Avg: {analytics.avgForecast.toLocaleString()} pkts/s
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Momentum Acceleration</span>
          <span className={`text-lg font-bold font-mono ${analytics.momentumRate.startsWith('+') ? 'text-amber-400' : 'text-cyan-400'}`}>
            {analytics.momentumRate}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            SMA({smaWindow}) gradient
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Spike Surge Risk</span>
          <span className={`text-lg font-bold font-mono ${
            analytics.spikeProbability >= 70 ? 'text-rose-400' : analytics.spikeProbability >= 40 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {analytics.spikeProbability}% <span className="text-xs font-normal text-slate-400">confidence</span>
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {analytics.spikeProbability >= 70 ? 'High Infiltration Risk' : 'Normal Fluctuations'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Enclave Buffer Capacity</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold font-mono ${analytics.saturationPct > 65 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {analytics.saturationPct}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ 4.0k pkts cap</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              style={{ width: `${analytics.saturationPct}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                analytics.saturationPct > 75 ? 'bg-rose-500' : analytics.saturationPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Recharts Predictive Line Chart */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#64748B" 
              fontSize={10} 
              fontFamily="monospace"
              tickLine={false}
              interval={4}
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={10} 
              fontFamily="monospace"
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as PredictionDataPoint;
                  return (
                    <div className="p-3 bg-[#0F172A] border border-slate-700 rounded-lg shadow-xl text-xs font-mono space-y-1.5 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="text-white font-bold">{label}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          data.isForecast ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {data.isForecast ? 'NEURAL FORECAST' : 'RECORDED TELEMETRY'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-[11px]">
                        {!data.isForecast && data.actualIngress !== null && (
                          <div className="flex justify-between items-center text-cyan-400">
                            <span>Actual Ingress:</span>
                            <span className="font-bold">{data.actualIngress.toLocaleString()} pkts/s</span>
                          </div>
                        )}
                        
                        {data.isForecast && data.predictedIngress !== null && (
                          <div className="flex justify-between items-center text-purple-400">
                            <span>Predicted Ingress:</span>
                            <span className="font-bold">{data.predictedIngress.toLocaleString()} pkts/s</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-emerald-400">
                          <span>SMA({smaWindow}s Trend):</span>
                          <span className="font-bold">{data.smaValue.toLocaleString()} pkts/s</span>
                        </div>

                        {data.isForecast && data.upperSpikeBand !== null && (
                          <div className="flex justify-between items-center text-rose-400 text-[10px]">
                            <span>Upper Spike Boundary:</span>
                            <span>{data.upperSpikeBand.toLocaleString()} pkts/s</span>
                          </div>
                        )}

                        {data.isForecast && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                            <span className="text-slate-400">Surge Risk Assessment:</span>
                            <span className={`font-bold ${
                              data.surgeRisk === 'CRITICAL' ? 'text-rose-400' : data.surgeRisk === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {data.surgeRisk}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Split marker at 0s (Present Time) */}
            <ReferenceLine 
              x="0s" 
              stroke="#A855F7" 
              strokeDasharray="4 4" 
              label={{ value: 'NOW (T=0)', position: 'insideTopLeft', fill: '#C084FC', fontSize: 10, fontFamily: 'monospace' }} 
            />

            {/* Critical Anomaly Saturation Line */}
            <ReferenceLine 
              y={2100} 
              stroke="#F43F5E" 
              strokeDasharray="3 3" 
              opacity={0.6}
              label={{ value: 'SURGE THRESHOLD (2.1k)', position: 'insideBottomRight', fill: '#FDA4AF', fontSize: 9, fontFamily: 'monospace' }} 
            />

            <Legend 
              verticalAlign="bottom"
              height={30}
              content={() => (
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono pt-2">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <span className="w-3 h-0.5 bg-cyan-400"></span>
                    <span>Actual Ingress (Historical)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-3 h-0.5 bg-emerald-400"></span>
                    <span>SMA Trend Baseline</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <span className="w-3 h-0.5 bg-purple-400 border-t border-dashed border-purple-300"></span>
                    <span>Neural Predicted Ingress</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <span className="w-3 h-0.5 bg-rose-400 border-t border-dotted border-rose-300"></span>
                    <span>Upper Spike Boundary</span>
                  </div>
                </div>
              )}
            />

            {/* Historical Recorded Line */}
            <Line 
              type="monotone" 
              dataKey="actualIngress" 
              name="Actual Ingress" 
              stroke="#38BDF8" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Simple Moving Average Baseline */}
            <Line 
              type="monotone" 
              dataKey="smaValue" 
              name="SMA Trend" 
              stroke="#10B981" 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
            />

            {/* Neural Predicted Ingress Line (Future Forecast) */}
            <Line 
              type="monotone" 
              dataKey="predictedIngress" 
              name="Predicted Forecast" 
              stroke="#A855F7" 
              strokeWidth={2.5} 
              strokeDasharray="4 2"
              dot={{ r: 2.5, fill: '#A855F7', stroke: '#FFFFFF', strokeWidth: 1 }}
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Upper Spike Boundary */}
            <Line 
              type="monotone" 
              dataKey="upperSpikeBand" 
              name="Upper Spike Boundary" 
              stroke="#F43F5E" 
              strokeWidth={1.5} 
              strokeDasharray="2 2"
              opacity={0.7}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Logic Explanation Footer */}
      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Extrapolates packet flow velocity: <span className="text-slate-200">ŷ(t+h) = SMA_n(t) + m·h·e^(-h/25) + δ_burst</span></span>
        </div>
        <div className="text-purple-300">
          Enclave auto-mitigation ready for any spike &gt; 2,100 pkts/s
        </div>
      </div>
    </div>
  );
};
