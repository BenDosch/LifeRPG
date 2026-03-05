import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface ArcSliderProps {
  value: number;
  onValueChange: (v: number) => void;
  color: string;
  label: string;
  getLabel: (v: number) => string;
}

const R = 52;
const STROKE_WIDTH = 10;
const THUMB_R = 7;
const W = 140;
const CX = W / 2;
const CY = R + 14;
const H = CY + 46;

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function angleToValue(angle: number): number {
  let relative = angle - 180;
  if (relative < 0) relative += 360;
  if (relative > 180) {
    relative = relative > 270 ? 0 : 180;
  }
  return Math.round(1 + (relative / 180) * 99);
}

export function ArcSlider({ value, onValueChange, color, label, getLabel }: ArcSliderProps) {
  const theme = useTheme();

  const progress = (value - 1) / 99;
  const valueAngle = 180 + progress * 180;

  const startPt = polarToCartesian(CX, CY, R, 180);
  const endPt = polarToCartesian(CX, CY, R, 360);
  const thumbPt = polarToCartesian(CX, CY, R, valueAngle);

  // Background arc: full 180° CW in screen coords (top semicircle), largeArcFlag=1, sweepFlag=1
  const bgArc = `M ${startPt.x.toFixed(2)},${startPt.y.toFixed(2)} A ${R},${R} 0 1,1 ${endPt.x.toFixed(2)},${endPt.y.toFixed(2)}`;
  // Fill arc: from start to thumb, same CW direction, largeArcFlag=0 (sweep always ≤ 180°)
  const fillLargeArc = progress >= 1 ? 1 : 0;
  const fillArc = `M ${startPt.x.toFixed(2)},${startPt.y.toFixed(2)} A ${R},${R} 0 ${fillLargeArc},1 ${thumbPt.x.toFixed(2)},${thumbPt.y.toFixed(2)}`;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const dx = e.nativeEvent.locationX - CX;
        const dy = e.nativeEvent.locationY - CY;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        onValueChange(angleToValue(angle));
      },
      onPanResponderMove: (e) => {
        const dx = e.nativeEvent.locationX - CX;
        const dy = e.nativeEvent.locationY - CY;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        onValueChange(angleToValue(angle));
      },
    })
  ).current;

  return (
    <View style={{ width: W, height: H }} {...pan.panHandlers}>
      <Svg width={W} height={H}>
        <Path
          d={bgArc}
          fill="none"
          stroke={theme.borderDefault}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        {progress > 0 && (
          <Path
            d={fillArc}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        )}
        <Circle cx={thumbPt.x} cy={thumbPt.y} r={THUMB_R} fill={color} />
        <SvgText
          x={CX}
          y={CY + 16}
          textAnchor="middle"
          fill={color}
          fontSize={16}
          fontWeight="700"
        >
          {value}%
        </SvgText>
        <SvgText
          x={CX}
          y={CY + 30}
          textAnchor="middle"
          fill={color}
          fontSize={10}
          fontWeight="600"
        >
          {getLabel(value).toUpperCase()}
        </SvgText>
        <SvgText
          x={CX}
          y={H - 4}
          textAnchor="middle"
          fill={theme.textDisabled}
          fontSize={9}
          fontWeight="600"
          letterSpacing={0.5}
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}
