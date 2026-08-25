import darkAsset from "@/assets/logo-dark.png.asset.json";
import lightAsset from "@/assets/logo-light.png.asset.json";

interface LogoProps {
  /** true when placed on a dark surface (navy header/sidebar) — uses the light logo */
  onDark?: boolean;
  className?: string;
}

/**
 * Brand logo. On light surfaces it swaps automatically with the dark theme.
 */
export const Logo = ({ onDark = false, className = "h-7" }: LogoProps) => {
  if (onDark) {
    return (
      <img src={lightAsset.url} alt="idealniepasuje" className={`${className} w-auto`} />
    );
  }

  return (
    <>
      <img src={darkAsset.url} alt="idealniepasuje" className={`${className} w-auto dark:hidden`} />
      <img src={lightAsset.url} alt="idealniepasuje" className={`${className} w-auto hidden dark:block`} />
    </>
  );
};
