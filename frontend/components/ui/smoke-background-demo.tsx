import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

/**
 * Default smoke background with gray color
 */
export const DefaultSmokeBackground = () => {
  return <SmokeBackground />;
};

/**
 * Customized smoke background with custom color
 * Example with red smoke
 */
export const CustomizedSmokeBackground = () => {
  return <SmokeBackground smokeColor="#FF0000" />;
};

/**
 * Purple smoke background (matches app theme)
 */
export const PurpleSmokeBackground = () => {
  return <SmokeBackground smokeColor="#8A2BE2" />;
};

/**
 * Orange-red smoke background (matches accent color)
 */
export const AccentSmokeBackground = () => {
  return <SmokeBackground smokeColor="#ff6b35" />;
};

