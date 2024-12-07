import React from 'react';
import { Settings } from 'lucide-react';
import { LINE_STYLES } from '../constants/directions';

const LineControls = ({ lineSet, onUpdate, setIndex }) => {
  return (
    <div className=" ">
      <div className="flex items-center gap-2 mb-3">
        <Settings size={16} />
        <h3 className="font-semibold">{lineSet.name}</h3>
      </div>
      
      <div className="space-y-3">
        {/* Color Control */}
        <div className="flex items-center gap-2">
          <label className="text-sm w-20">Color:</label>
          <input
            type="color"
            value={lineSet.stroke}
            onChange={(e) => onUpdate(setIndex, { stroke: e.target.value })}
            className="w-8 h-8 p-0 border rounded cursor-pointer"
          />
        </div>

        {/* Width Control */}
        <div className="flex items-center gap-2">
          <label className="text-sm w-20">Width:</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={lineSet.strokeWidth}
            onChange={(e) => onUpdate(setIndex, { strokeWidth: parseFloat(e.target.value) })}
            className="w-32"
          />
          <span className="text-sm w-8">{lineSet.strokeWidth}</span>
        </div>

        {/* Line Style Control */}
        <div className="flex items-center gap-2">
          <label className="text-sm w-20">Style:</label>
          <select
            // value={lineSet.strokeDasharray}
            onChange={(e) => onUpdate(setIndex, { 
              strokeDasharray: e.target.value === 'solid' ? '' : LINE_STYLES[e.target.value]
            })}
            className="text-sm border rounded p-1"
          >
            {Object.keys(LINE_STYLES).map(style => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LineControls;