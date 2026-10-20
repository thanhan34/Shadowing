export const describeImageTypes = [
  { key: "line_chart", label: "Line chart", noun: "line chart" },
  { key: "bar_chart", label: "Bar chart", noun: "bar chart" },
  { key: "pie_chart", label: "Pie chart", noun: "pie chart" },
  { key: "map", label: "Map", noun: "map" },
  { key: "process", label: "Process", noun: "process" },
  { key: "picture", label: "Picture", noun: "picture" },
  { key: "table", label: "Table", noun: "table" },
] as const;

export type DescribeImageType = typeof describeImageTypes[number]["key"];
