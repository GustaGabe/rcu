import Svg, { Circle, ClipPath, Defs, G, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * A marca do app: anel de progresso (o mesmo motivo da tela Hoje) em volta de uma cápsula.
 * É o desenho do ícone em `assets/icon.png`, em vetor.
 */
export function AppMark({ size = 64 }: { size?: number }) {
  const c = 512;
  const r = 292;
  const circumference = 2 * Math.PI * r;
  const capW = 300;
  const capH = 116;

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="App RCU">
      <Defs>
        <ClipPath id="left">
          <Rect x={0} y={0} width={c} height={1024} />
        </ClipPath>
        <ClipPath id="right">
          <Rect x={c} y={0} width={c} height={1024} />
        </ClipPath>
      </Defs>
      <Rect width={1024} height={1024} rx={230} fill={colors.plum} />
      <Circle cx={c} cy={c} r={r} fill="none" stroke={colors.plumRaised} strokeWidth={104} />
      <Circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={colors.lavender}
        strokeWidth={104}
        strokeLinecap="round"
        strokeDasharray={`${circumference * 0.72} ${circumference}`}
        transform={`rotate(-90 ${c} ${c})`}
      />
      <G transform={`rotate(-45 ${c} ${c})`}>
        <Rect
          x={c - capW / 2}
          y={c - capH / 2}
          width={capW}
          height={capH}
          rx={capH / 2}
          fill={colors.onPlum}
          clipPath="url(#right)"
        />
        <Rect
          x={c - capW / 2}
          y={c - capH / 2}
          width={capW}
          height={capH}
          rx={capH / 2}
          fill={colors.lavender}
          clipPath="url(#left)"
        />
      </G>
    </Svg>
  );
}
