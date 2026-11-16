import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';
import { formatINR } from '../utils/formatters';
import { apiFetch } from '../utils/api';

export default function StockChart({ symbol, currentPrice }) {
  const { isDark } = useTheme();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [activeRange, setActiveRange] = useState('1D');
  const [chartType, setChartType] = useState('line'); // 'line' | 'candle'
  const [loading, setLoading] = useState(true);
  const [hoverData, setHoverData] = useState(null);
  const rawCandlesRef = useRef([]);

  // Fetch candles on symbol or range change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadCandles() {
      try {
        const queryRange = activeRange === '1W' ? '1M' : activeRange === 'All' ? '1Y' : activeRange;
        const res = await apiFetch(`/api/quotes/history/${symbol}?range=${queryRange}`);
        if (!res.ok) throw new Error('Failed to load chart');
        const data = await res.json();

        if (isMounted && data.candles && data.candles.length > 0) {
          const sorted = [...data.candles].sort((a, b) => a.time - b.time);
          rawCandlesRef.current = sorted;
          renderSeriesData(sorted, chartType);
        }
      } catch (e) {
        console.error('Error loading candles:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCandles();
    return () => {
      isMounted = false;
    };
  }, [symbol, activeRange]);

  // Render series data according to chart type (line vs candle)
  const renderSeriesData = (data, type) => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Remove existing series
    if (seriesRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current);
      } catch {}
      seriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      try {
        chartRef.current.removeSeries(volumeSeriesRef.current);
      } catch {}
      volumeSeriesRef.current = null;
    }

    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const isUp = lastPrice >= firstPrice;

    const gainColor = isDark ? '#0ECB81' : '#00B386';
    const lossColor = isDark ? '#F6465D' : '#EB5B3C';
    const trendColor = isUp ? gainColor : lossColor;

    if (type === 'line') {
      const areaSeries = chartRef.current.addAreaSeries({
        topColor: isUp ? 'rgba(0, 179, 134, 0.15)' : 'rgba(235, 91, 60, 0.15)',
        bottomColor: 'rgba(0, 0, 0, 0.0)',
        lineColor: trendColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });

      const lineData = data.map(c => ({
        time: c.time,
        value: c.close,
      }));
      areaSeries.setData(lineData);
      seriesRef.current = areaSeries;

    } else {
      const candleSeries = chartRef.current.addCandlestickSeries({
        upColor: gainColor,
        downColor: lossColor,
        borderUpColor: gainColor,
        borderDownColor: lossColor,
        wickUpColor: gainColor,
        wickDownColor: lossColor,
      });

      candleSeries.setData(data);
      seriesRef.current = candleSeries;
    }

    // Add minimal volume overlay
    const volumeSeries = chartRef.current.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    const volumeData = data.map(c => ({
      time: c.time,
      value: c.volume || 1000,
      color: c.close >= c.open
        ? (isDark ? 'rgba(14, 203, 129, 0.2)' : 'rgba(0, 179, 134, 0.2)')
        : (isDark ? 'rgba(246, 70, 93, 0.2)' : 'rgba(235, 91, 60, 0.2)'),
    }));

    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    chartRef.current.timeScale().fitContent();
  };

  // Switch between line and candle
  useEffect(() => {
    if (rawCandlesRef.current.length > 0) {
      renderSeriesData(rawCandlesRef.current, chartType);
    }
  }, [chartType, isDark]);

  // Initialize TradingView Chart & adapt to theme
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const bgColor = isDark ? '#181A20' : '#FFFFFF';
    const textColor = isDark ? '#848E9C' : '#7C7E8C';
    const gridColor = isDark ? 'rgba(43, 49, 57, 0.5)' : '#F5F6F8';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        vertLine: {
          color: isDark ? '#FCD535' : '#00B386',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDark ? '#FCD535' : '#00B386',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2B3139' : '#E8EAED',
        scaleMargins: { top: 0.08, bottom: 0.2 },
      },
      timeScale: {
        borderColor: isDark ? '#2B3139' : '#E8EAED',
        timeVisible: true,
      },
    });

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !seriesRef.current) {
        setHoverData(null);
      } else {
        const data = param.seriesData.get(seriesRef.current);
        if (data) {
          const price = data.value !== undefined ? data.value : data.close;
          setHoverData({ price, time: param.time });
        }
      }
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [isDark]);

  return (
    <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-border">
        {/* Range Tabs */}
        <div className="flex items-center gap-1">
          {['1D', '1W', '1M', '6M', '1Y', 'All'].map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                activeRange === range
                  ? 'bg-primary text-primary-text font-semibold'
                  : 'text-muted hover:text-heading hover:bg-bg-subtle'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Line vs Candle Switcher & Hover Price */}
        <div className="flex items-center gap-4">
          {hoverData && (
            <div className="text-xs font-semibold text-heading tabular-nums">
              ₹{hoverData.price.toFixed(2)}
            </div>
          )}

          <div className="flex items-center bg-bg-subtle p-0.5 rounded-btn border border-border">
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-0.5 text-2xs font-medium rounded transition-colors ${
                chartType === 'line'
                  ? 'bg-bg-card text-heading shadow-sm font-semibold'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-0.5 text-2xs font-medium rounded transition-colors ${
                chartType === 'candle'
                  ? 'bg-bg-card text-heading shadow-sm font-semibold'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Candles
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-[380px]">
        {loading && (
          <div className="absolute inset-0 bg-bg-card/75 backdrop-blur-[1px] flex items-center justify-center z-10 text-xs text-muted">
            Loading chart data...
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
