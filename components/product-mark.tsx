import { cn } from "@/lib/utils";

const BOX_FACES = [
  {
    center: { x: 7, y: 16 },
    d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z",
  },
  {
    center: { x: 17, y: 15 },
    d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z",
  },
  {
    center: { x: 12, y: 9 },
    d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z",
  },
] as const;

const GAP_SCALE = 0.86;

export function ProductMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {BOX_FACES.map(({ center, d }) => (
        <path
          key={d}
          d={d}
          transform={`translate(${center.x} ${center.y}) scale(${GAP_SCALE}) translate(${-center.x} ${-center.y})`}
        />
      ))}
    </svg>
  );
}
