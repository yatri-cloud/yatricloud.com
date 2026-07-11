import { motion, useReducedMotion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Same filled world map as the Achievements page (react-simple-maps +
// world-atlas via CDN), with brand-blue pulsing markers. Loaded lazily by
// YatrisWorldwideSection so none of this weighs on the homepage entry.

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface WorldMarker {
  code: string;
  label: string;
  coordinates: [number, number]; // [lon, lat]
}

const YatrisWorldMap = ({ markers }: { markers: WorldMarker[] }) => {
  const reduce = useReducedMotion();

  return (
    <div className="w-full" style={{ height: "440px", position: "relative" }}>
      <ComposableMap
        projection="geoEquirectangular"
        projectionConfig={{ scale: 147 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: "hsl(var(--muted))",
                    stroke: "hsl(var(--border))",
                    strokeWidth: 0.6,
                    outline: "none",
                  },
                  hover: {
                    fill: "hsl(var(--brand-100, 210 100% 93%))",
                    stroke: "hsl(var(--border))",
                    strokeWidth: 0.6,
                    outline: "none",
                  },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {markers.map((m, i) => (
          <Marker key={m.code} coordinates={m.coordinates}>
            <motion.circle
              r={4}
              fill="hsl(var(--primary))"
              stroke="#fff"
              strokeWidth={1.5}
              initial={reduce ? undefined : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 300, damping: 18 }}
            />
            {!reduce && (
              <motion.circle
                r={4}
                fill="none"
                stroke="hsl(var(--primary) / 0.5)"
                strokeWidth={1}
                initial={{ opacity: 0 }}
                animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                transition={{
                  delay: 0.8 + i * 0.4,
                  duration: 2.4,
                  ease: "easeOut",
                  repeat: Infinity,
                }}
              />
            )}
            <title>{m.label}</title>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
};

export default YatrisWorldMap;
