import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, G } from 'react-native-svg';
import {
  gridToScreen,
  TILE_WIDTH,
  TILE_HEIGHT,
  DEFAULT_GRID_SIZE,
} from './dreamHouseLogic';

interface IsometricGridProps {
  gridWidth?: number;
  gridHeight?: number;
  originX: number;
  originY: number;
  canvasWidth: number;
  canvasHeight: number;
  highlightedCell?: { qX: number; qY: number } | null;
}

export const IsometricGrid: React.FC<IsometricGridProps> = ({
  gridWidth = DEFAULT_GRID_SIZE,
  gridHeight = DEFAULT_GRID_SIZE,
  originX,
  originY,
  canvasWidth,
  canvasHeight,
  highlightedCell,
}) => {
  // Memoize tiles geometry
  const { tiles, backWalls } = useMemo(() => {
    const tileList: Array<{
      key: string;
      points: string;
      isLight: boolean;
      qX: number;
      qY: number;
    }> = [];

    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    for (let qX = 0; qX < gridWidth; qX++) {
      for (let qY = 0; qY < gridHeight; qY++) {
        const top = gridToScreen(qX, qY, originX, originY, TILE_WIDTH, TILE_HEIGHT);
        const pTop = `${top.x},${top.y}`;
        const pRight = `${top.x + halfW},${top.y + halfH}`;
        const pBottom = `${top.x},${top.y + TILE_HEIGHT}`;
        const pLeft = `${top.x - halfW},${top.y + halfH}`;

        const isLight = (qX + qY) % 2 === 0;

        tileList.push({
          key: `tile_${qX}_${qY}`,
          points: `${pTop} ${pRight} ${pBottom} ${pLeft}`,
          isLight,
          qX,
          qY,
        });
      }
    }

    // Isometric back wall heights
    const wallHeight = 70;
    const originTop = gridToScreen(0, 0, originX, originY, TILE_WIDTH, TILE_HEIGHT);
    const rightCorner = gridToScreen(gridWidth, 0, originX, originY, TILE_WIDTH, TILE_HEIGHT);
    const leftCorner = gridToScreen(0, gridHeight, originX, originY, TILE_WIDTH, TILE_HEIGHT);

    // Left wall: from (0, gridHeight) to (0, 0)
    const leftWallPoints = `${leftCorner.x},${leftCorner.y} ${originTop.x},${originTop.y} ${originTop.x},${originTop.y - wallHeight} ${leftCorner.x},${leftCorner.y - wallHeight}`;

    // Right wall: from (0, 0) to (gridWidth, 0)
    const rightWallPoints = `${originTop.x},${originTop.y} ${rightCorner.x},${rightCorner.y} ${rightCorner.x},${rightCorner.y - wallHeight} ${originTop.x},${originTop.y - wallHeight}`;

    return {
      tiles: tileList,
      backWalls: {
        leftWallPoints,
        rightWallPoints,
      },
    };
  }, [gridWidth, gridHeight, originX, originY]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={canvasWidth} height={canvasHeight}>
        {/* Back walls */}
        <Polygon
          points={backWalls.leftWallPoints}
          fill="#eddcd2"
          stroke="#ddbea9"
          strokeWidth={1}
        />
        <Polygon
          points={backWalls.rightWallPoints}
          fill="#f0efeb"
          stroke="#ddbea9"
          strokeWidth={1}
        />

        {/* Floor Tiles */}
        <G>
          {tiles.map((tile) => {
            const isHighlighted =
              highlightedCell &&
              highlightedCell.qX === tile.qX &&
              highlightedCell.qY === tile.qY;

            let fillColor = tile.isLight ? '#f5ebe0' : '#ebd9cb';
            if (isHighlighted) {
              fillColor = '#f3c4c7'; // soft romantic rose glow on hover
            }

            return (
              <Polygon
                key={tile.key}
                points={tile.points}
                fill={fillColor}
                stroke="rgba(213, 189, 175, 0.45)"
                strokeWidth={0.8}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};
