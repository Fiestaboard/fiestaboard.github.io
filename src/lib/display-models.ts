import type { DeviceModel } from "@fiestaboard/ui/lib/devices";

/**
 * FiestaPanel's two looks on a TV, as the FiestaPanel output plugin declares
 * them (fiestaboard-output--fiestapanel, `output/device-models.json`). They are
 * not FiestaUI built-ins - an output plugin owns its device models - so the
 * site declares them the way the plugin does and hands the objects to
 * `DisplayPreview`. The split-flap grid is the 12 × 29 FiestaPanel fits to a
 * 55" TV (docs/features/fiestapanel.md).
 *
 * FiestaUI's `lib/plugin-model-fixtures` carries the same objects, but 8.13.1
 * publishes only its type declarations, not the module, so it cannot be
 * imported at runtime.
 */
export const FIESTAPANEL_SPLIT_FLAP_MODEL = {
  id: "fiestapanel_split_flap",
  label: "FiestaPanel (split-flap)",
  technology: "split_flap",
  family: "fiestapanel",
  geometry: { kind: "panel", rows: 12, cols: 29 },
  color: { kind: "tiles" },
  charset: "vestaboard_v2",
  animation: { delivery: "none", maxFps: 0 },
  appearance: { boardColors: ["black", "white"], options: { board_color: ["black", "white"] } },
} as unknown as DeviceModel;

export const FIESTAPANEL_LED_MATRIX_MODEL = {
  id: "fiestapanel_led_matrix",
  label: "FiestaPanel (LED matrix)",
  technology: "led_matrix",
  family: "fiestapanel",
  geometry: { kind: "pixels", width: 192, height: 96 },
  color: { kind: "rgb", bitDepth: 24 },
  charset: "led_5x7",
  animation: { delivery: "stream", maxFps: 60 },
  font: "5x7",
  appearance: { pixelShape: "square", dotRatio: 0.82, offColor: "#1a1a1a", substrateColor: "#000000" },
} as unknown as DeviceModel;
