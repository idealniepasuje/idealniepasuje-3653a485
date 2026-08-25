import darkLogo from "@/assets/logo-dark.svg";
import lightLogo from "@/assets/logo-light.svg";

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
      <img src={lightLogo} alt="idealniepasuje" className={`${className} w-auto`} />
    );
  }

  return (
    <>
      <img src={darkLogo} alt="idealniepasuje" className={`${className} w-auto dark:hidden`} />
      <img src={lightLogo} alt="idealniepasuje" className={`${className} w-auto hidden dark:block`} />
    </>
  );
};
