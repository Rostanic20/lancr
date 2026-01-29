import { View, Text, StyleSheet, useColorScheme } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";
import { colors } from "../utils/colors";

interface Props {
  data: { label: string; amount: number }[];
}

export function EarningsChart({ data }: Props) {
  const dark = useColorScheme() === "dark";
  const text = dark ? "#fff" : "#000";
  const barColor = colors.green;

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: text }]}>No earnings data yet</Text>
      </View>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const chartHeight = 180;
  const barWidth = 40;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight + 40}>
        {data.map((item, i) => {
          const barHeight = (item.amount / maxAmount) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;

          return (
            <G key={item.label}>
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize={11}
                fill={text}
                textAnchor="middle"
                opacity={0.7}
              >
                {item.amount.toFixed(0)}
              </SvgText>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill={barColor}
              />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 16}
                fontSize={10}
                fill={text}
                textAnchor="middle"
                opacity={0.5}
              >
                {item.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 12,
  },
  empty: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    opacity: 0.4,
    fontSize: 14,
  },
});
