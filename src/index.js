import React from 'react';
import { useState } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { render } from 'react-dom';

import './index.css';

// main app component
const App = () => {
  // app state
  let [tips, setTips] = useState(5);
  const [outerRadius, setOuterRadius] = useState(100);
  const [innerRadius, setInnerRadius] = useState(50);
  const [matchRadii, setMatchRadii] = useState(true);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [startAngle, setAngle] = useState(90);
  const [winding, setWinding] = useState('clockwise');
  const [commandSeparator, setCommandSeparator] = useState('\\t');
  const [xySeparator, setXySeparator] = useState('\\t');
  const [pointSeparator, setPointSeparator] = useState('\\n');
  const [svgPath, setSvgPath] = useState(true);
  const [precision, setPrecision] = useState(3);

  // calculate svg view box (viewport) left/right/width/height
  const viewBox = useMemo(() => {
    const bound = Math.max(outerRadius, innerRadius) + strokeWidth / 2 + 10;
    return [centerX - bound, centerY - bound, bound * 2, bound * 2];
  }, [outerRadius, innerRadius, centerX, centerY, strokeWidth]);

  // calculate "perfect" ratio of outer to inner radius based on # of tips
  const radiiRatio = useMemo(() => {
    const n = tips;
    const m = 2;
    if (n < 5) return 1 / 2;
    else return cos((180 * m) / n) / cos((180 * (m - 1)) / n);
  }, [tips]);

  // calculate points of star
  const points = useMemo(() => {
    const increment = winding === 'clockwise' ? -1 : 1;
    const points = [];
    let inner = false;
    for (let point = 0; Math.abs(point) < tips * 2; point += increment) {
      const angle = startAngle + (point / 2 / tips) * 360;
      const r = inner ? innerRadius : outerRadius;
      const x = centerX + cos(angle) * r;
      const y = centerY - sin(angle) * r;
      points.push({ x, y });
      inner = !inner;
    }
    return points;
  }, [tips, outerRadius, innerRadius, centerX, centerY, startAngle, winding]);

  // calculate other relevant length and distance info
  const sideLength = useMemo(() => dist(points[0], points[1]), [points]);
  const totalLength = useMemo(() => sideLength * tips * 2, [tips, sideLength]);
  const tipToTip = useMemo(() => dist(points[0], points[2]), [points]);
  const troughToTrough = useMemo(() => dist(points[1], points[3]), [points]);

  // function to convert points to string list for output and svg path
  const formatPoints = useCallback(
    (commandSeparator, xySeparator, pointSeparator, svgPath) => {
      let string = '';
      for (const [index, point] of Object.entries(points)) {
        if (svgPath) {
          string += index === '0' ? 'M' : 'L';
          string += commandSeparator;
        }
        string +=
          point.x.toFixed(precision) +
          xySeparator +
          point.y.toFixed(precision) +
          pointSeparator;
      }
      if (svgPath) string += 'z';

      // replace user-entered escape characters with actual characters
      string = string.split(/\\s/).join(' ');
      string = string.split(/\\t/).join('\t');
      string = string.split(/\\n/).join('\n');
      return string;
    },
    [points, precision]
  );

  // make d string for svg path
  const d = useMemo(() => formatPoints(' ', ' ', '\n', true), [formatPoints]);

  // make string output for user to copy
  const output = useMemo(
    () => formatPoints(commandSeparator, xySeparator, pointSeparator, svgPath),
    [commandSeparator, xySeparator, pointSeparator, svgPath, formatPoints]
  );

  // render component
  return (
    <>
      <section>
        <h1>Star Generator</h1>
      </section>
      <section>
        <Control
          text='tips'
          Component={Float}
          min='2'
          max='1000'
          value={tips}
          set={setTips}
        />
        <Control
          text='outer radius'
          Component={Float}
          min='0'
          max='10000'
          value={outerRadius}
          set={(value) => {
            setOuterRadius(value);
            if (matchRadii) setInnerRadius((value * radiiRatio).toFixed(5));
          }}
        />
        <Control
          text='inner radius'
          Component={Float}
          min='0'
          max='10000'
          value={innerRadius}
          set={(value) => {
            setInnerRadius(value);
            if (matchRadii) setOuterRadius((value / radiiRatio).toFixed(5));
          }}
        />
        <Control
          text='match radii'
          Component={Bool}
          value={matchRadii}
          set={setMatchRadii}
        />
        <Control
          text='center X'
          Component={Float}
          min='-1000'
          max='1000'
          value={centerX}
          set={setCenterX}
        />
        <Control
          text='center Y'
          Component={Float}
          min='-1000'
          max='1000'
          value={centerY}
          set={setCenterY}
        />
        <Control
          text='stroke width'
          Component={Float}
          min='0'
          max='1000'
          value={strokeWidth}
          set={setStrokeWidth}
        />
        <Control
          text='start angle'
          Component={Float}
          min='-360'
          max='360'
          value={startAngle}
          set={setAngle}
        />
        <Control
          text='winding'
          Component={Select}
          options={['clockwise', 'counter-clockwise']}
          value={winding}
          set={setWinding}
        />
      </section>

      <section>
        <svg id='preview' viewBox={viewBox}>
          <style>
            {`
              svg:hover #star {
                animation: star 2s ease forwards infinite;
                stroke-dasharray: ${totalLength};
              }
              @keyframes star {
                from {
                  stroke-dashoffset: ${totalLength};
                }
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}
          </style>
          <line
            id='x_axis'
            x1='-999999'
            x2='999999'
            y1='0'
            y2='0'
            stroke='black'
            strokeWidth='1'
            opacity='0.1'
          />
          <line
            id='y_axis'
            x1='0'
            x2='0'
            y1='-999999'
            y2='999999'
            stroke='black'
            strokeWidth='1'
            opacity='0.1'
          />
          <circle
            id='outer_radius'
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill='none'
            stroke='black'
            strokeWidth='1'
            opacity={0.1}
          />
          <line
            id='angle_marker'
            x1={centerX}
            y1={centerY}
            x2={centerX + cos(startAngle) * outerRadius}
            y2={centerY - sin(startAngle) * outerRadius}
            stroke='black'
            strokeWidth='1'
            opacity={0.1}
          />
          <circle
            id='inner_radius'
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill='none'
            stroke='black'
            strokeWidth='1'
            opacity={0.1}
          />
          <path
            id='star'
            d={d}
            fill='none'
            stroke='currentColor'
            strokeWidth={strokeWidth}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </section>

      <section>
        <Control
          text='command separator'
          Component={Text}
          value={commandSeparator}
          set={setCommandSeparator}
        />
        <Control
          text='x-y separator'
          Component={Text}
          value={xySeparator}
          set={setXySeparator}
        />
        <Control
          text='point separator'
          Component={Text}
          value={pointSeparator}
          set={setPointSeparator}
        />
        <Control
          text='SVG path'
          Component={Bool}
          value={svgPath}
          set={setSvgPath}
        />
        <Control
          text='precision'
          Component={Float}
          min='1'
          max='50'
          value={precision}
          set={setPrecision}
        />
      </section>

      <section>
        <textarea id='output' value={output} readOnly />
      </section>

      <section>
        <Readout text='side length' value={sideLength} />
        <Readout text='total length' value={totalLength} />
        <Readout text='tip to tip' value={tipToTip} />
        <Readout text='trough to trough' value={troughToTrough} />
      </section>
    </>
  );
};

// math util functions
const sin = (degrees) => Math.sin((2 * Math.PI * degrees) / 360);
const cos = (degrees) => Math.cos((2 * Math.PI * degrees) / 360);
const dist = (a = { x: 0, y: 0 }, b = { x: 0, y: 0 }) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

// generic control component with label
const Control = ({ text, Component, ...props }) => (
  <div className='control'>
    <Component className='control_input' name={text} {...props} />
    <label className='control_label' htmlFor={text}>
      {text}
    </label>
  </div>
);

// number input box component
const Float = ({ set, ...props }) => (
  <input
    type='number'
    step={1}
    onChange={(event) => set(Number(event.target.value))}
    {...props}
  />
);

// dropdown select component
const Select = ({ options, value, set, ...props }) => (
  <select onChange={(event) => set(event.target.value)} {...props}>
    {options.map((option, index) => (
      <option key={index} value={option}>
        {option}
      </option>
    ))}
  </select>
);

// text input component
const Text = ({ set, ...props }) => (
  <input type='text' onChange={(event) => set(event.target.value)} {...props} />
);

// checkbox component
const Bool = ({ value, set, ...props }) => (
  <input
    type='checkbox'
    checked={value ? 'checked' : ''}
    onChange={(event) => set(event.target.checked ? true : false)}
    {...props}
  />
);

// value readout component
const Readout = ({ text, value }) => (
  <div className='control'>
    <span className='control_input' name={text}>
      {value.toFixed(2)}
    </span>
    <label className='control_label' htmlFor={text}>
      {text}
    </label>
  </div>
);

// run app component
render(<App />, document.getElementById('root'));
