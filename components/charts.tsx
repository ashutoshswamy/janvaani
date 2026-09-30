"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Slice = { name: string; value: number };

// Theme hexes (Recharts needs literals): sage ink 700, apricot 500. See app/globals.css.
const INDIGO = "#4d5441";
const MARIGOLD = "#ffc176";
const tooltip = { contentStyle: { borderRadius: 12, border: "1px solid #d7dace", fontSize: 12 } };

export function CategoryBar({ data }: { data: Slice[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -12 }}>
        <CartesianGrid vertical={false} stroke="#eef0e9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltip} cursor={{ fill: "#f7f8f4" }} />
        <Bar dataKey="value" name="Requests" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={d.name} fill={i === 0 ? MARIGOLD : INDIGO} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data }: { data: { day: string; requests: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} stroke="#eef0e9" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={6} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltip} />
        <Line type="monotone" dataKey="requests" stroke={INDIGO} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: MARIGOLD }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const LANG_COLORS = ["#2a2f24", "#ffc176", "#9ba28a", "#ffdc74", "#626a52", "#ffe9b3"];

export function LanguageDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-40 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
              {data.map((d, i) => <Cell key={d.name} fill={LANG_COLORS[i % LANG_COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: LANG_COLORS[i % LANG_COLORS.length] }} />
            {d.name}
            <span className="ml-auto text-slate-500">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
