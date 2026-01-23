import React from 'react';
import Plot from 'react-plotly.js';

interface ChartProps {
  data: any[];
  layout: any;
  title?: string;
}

export const Chart: React.FC<ChartProps> = ({ data, layout, title }) => {
  return (
    <div className="w-full h-full min-h-[400px] bg-white dark:bg-card-bg-dark rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
      {title && <h3 className="text-lg font-semibold mb-2 ml-2 text-text-light dark:text-text-dark">{title}</h3>}
      <Plot
        data={data}
        layout={{ 
            autosize: true, 
            ...layout,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                color: layout.font?.color || 'inherit' 
            }
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%', minHeight: '350px' }}
        config={{ responsive: true, displayModeBar: false }}
      />
    </div>
  );
};
