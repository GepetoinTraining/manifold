"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SLIDERS — Temperature/Luminosity controls for Phase 3 (Vibes)
// ═══════════════════════════════════════════════════════════════════════════

interface SlidersProps {
    temperature: number;
    luminosity: number;
    friction?: number;
    onTemperatureChange: (value: number) => void;
    onLuminosityChange: (value: number) => void;
    onFrictionChange?: (value: number) => void;
}

export function Sliders({
    temperature,
    luminosity,
    friction = 0.3,
    onTemperatureChange,
    onLuminosityChange,
    onFrictionChange,
}: SlidersProps) {
    return (
        <div
            style={{
                padding: "16px",
                background: "rgba(200,190,170,0.04)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
        >
            <div
                style={{
                    fontSize: "11px",
                    fontFamily: "'DM Mono', monospace",
                    color: "#c9a227",
                    marginBottom: "4px",
                }}
            >
                VIBES
            </div>

            {/* Temperature */}
            <SliderRow
                label="Temperature"
                leftLabel="Cool"
                rightLabel="Warm"
                value={temperature}
                onChange={onTemperatureChange}
                color={`hsl(${200 - temperature * 155}, ${40 + temperature * 30}%, 50%)`}
            />

            {/* Luminosity */}
            <SliderRow
                label="Luminosity"
                leftLabel="Dark"
                rightLabel="Light"
                value={luminosity}
                onChange={onLuminosityChange}
                color={`hsl(45, 60%, ${20 + luminosity * 50}%)`}
            />

            {/* Friction */}
            {onFrictionChange && (
                <SliderRow
                    label="Friction"
                    leftLabel="Soft"
                    rightLabel="Sharp"
                    value={friction}
                    onChange={onFrictionChange}
                    color="#8a8070"
                />
            )}
        </div>
    );
}

// ─── SLIDER ROW ──────────────────────────────────────────────────────────────

function SliderRow({
    label,
    leftLabel,
    rightLabel,
    value,
    onChange,
    color,
}: {
    label: string;
    leftLabel: string;
    rightLabel: string;
    value: number;
    onChange: (value: number) => void;
    color: string;
}) {
    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                }}
            >
                <span style={{ fontSize: "12px", color: "#e8e0d0" }}>{label}</span>
                <span
                    style={{
                        fontSize: "11px",
                        fontFamily: "'DM Mono', monospace",
                        color: "#8a8070",
                    }}
                >
                    {(value * 100).toFixed(0)}%
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "10px", color: "#8a8070", width: "40px" }}>
                    {leftLabel}
                </span>
                <div style={{ flex: 1, position: "relative" }}>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={value}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                        style={{
                            width: "100%",
                            height: "6px",
                            appearance: "none",
                            background: `linear-gradient(to right, ${color} ${value * 100}%, rgba(200,190,170,0.1) ${value * 100}%)`,
                            borderRadius: "3px",
                            cursor: "pointer",
                            outline: "none",
                        }}
                    />
                </div>
                <span
                    style={{ fontSize: "10px", color: "#8a8070", width: "40px", textAlign: "right" }}
                >
                    {rightLabel}
                </span>
            </div>
        </div>
    );
}
