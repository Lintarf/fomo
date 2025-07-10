import { TradeAnalysis, TradingMode } from '../types';

const convertToCSV = (data: TradeAnalysis[]): string => {
  if (data.length === 0) {
    return '';
  }

  const headers = [
    'id', 'mode', 'timestamp', 'status', 'outcomeAmount', 'tradeType', 'entryPrice', 'stopLoss', 'takeProfit',
    'marketTrend', 'keyPattern', 'indicatorAnalysis', 'tradeBias',
    'rationale', 'confidenceScore'
  ];
  
  const rows = data.map(row => {
    const values = [
      row.id,
      row.mode,
      row.timestamp,
      row.status,
      row.outcomeAmount ?? '',
      row.tradeSetup.tradeType,
      row.tradeSetup.entryPrice,
      row.tradeSetup.stopLoss,
      row.tradeSetup.takeProfit,
      `"${String(row.marketTrend || '').replace(/"/g, '""')}"`,
      `"${String(row.keyPattern || '').replace(/"/g, '""')}"`,
      `"${String(row.indicatorAnalysis || '').replace(/"/g, '""')}"`,
      row.tradeBias,
      `"${String(row.rationale || '').replace(/"/g, '""')}"`,
      row.confidenceScore,
    ];
    return values.map(val => {
        const strVal = String(val);
        return strVal.includes(',') ? `"${strVal}"` : strVal;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const exportFullHistoryToCsv = (history: TradeAnalysis[]): void => {
  const csvString = convertToCSV(history);
  if (!csvString) {
    console.log("No history to export.");
    return;
  }
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `full_trade_history_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};