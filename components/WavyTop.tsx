// components/WavyBottom.tsx
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export default function WavyTop() {
  return (
    <Svg
      height={600} // much taller
      width={SCREEN_WIDTH}
      viewBox={`0 0 ${SCREEN_WIDTH} 450`}
      style={{ position: 'absolute', bottom: 0, left: 0 }}>
      <Path
        fill="#DFF8EB"
        opacity={0.8}
        d={`
          M0,200
          C${SCREEN_WIDTH * 0.25},300 ${SCREEN_WIDTH * 0.75},100 ${SCREEN_WIDTH},200
          L${SCREEN_WIDTH},450
          L0,450
          Z
        `}
      />
    </Svg>
  );
}
