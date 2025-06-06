import React, { useCallback, useEffect, useRef } from "react";
import classnames from "classnames";
import PropTypes from "prop-types";
import "./MultiRangeSlider.css";

const MultiRangeSlider = ({ min, max, value, onChange }) => {
  const minValRef = useRef(null);
  const maxValRef = useRef(null);
  const rangeRef = useRef(null);

  const getPercent = useCallback(
    (val) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    if (rangeRef.current) {
      const minPercent = getPercent(value.min);
      const maxPercent = getPercent(value.max);
      rangeRef.current.style.left = `${minPercent}%`;
      rangeRef.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [value, getPercent]);

  return (
    <>
      <p className="text-sm text-gray-700 font-medium">{value.min} - {value.max}</p>
      <div className="container">
        <input
          type="range"
          min={min}
          max={max}
          value={value.min}
          ref={minValRef}
          onChange={(event) => {
            const newMin = Math.min(+event.target.value, value.max - 1);
            onChange({ min: newMin, max: value.max });
          }}
          className={classnames("thumb thumb--zindex-3", {
            "thumb--zindex-5": value.min > max - 100,
          })}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value.max}
          ref={maxValRef}
          onChange={(event) => {
            const newMax = Math.max(+event.target.value, value.min + 1);
            onChange({ min: value.min, max: newMax });
          }}
          className="thumb thumb--zindex-4"
        />

        <div className="slider">
          <div className="slider__track" />

          <div ref={rangeRef} className="slider__range" />
          {/* <div className="slider__left-value">{value.min}</div>
          <div className="slider__right-value">{value.max}</div> */}
        </div>
      </div>
    </>
  );
};

MultiRangeSlider.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  value: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default MultiRangeSlider;
