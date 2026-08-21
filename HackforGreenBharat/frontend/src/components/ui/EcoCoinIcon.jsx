import React from "react";
import ecoCoinImg from "@/assets/ecocoin.png";

/**
 * EcoCoinIcon - Renders the official EcoSense 3D emerald & white coin asset
 * @param {number|string} size - Pixel size or CSS dimension (default 24)
 * @param {string} className - Optional Tailwind or CSS class names
 * @param {boolean} animated - Optional subtle hover animation / spin
 * @param {string} alt - Accessibility label
 */
const EcoCoinIcon = ({
  size = 24,
  className = "",
  animated = false,
  alt = "EcoCoin"
}) => {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  return (
    <img
      src={ecoCoinImg}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
        objectFit: "contain",
      }}
      className={`inline-block select-none rounded-full shrink-0 align-middle filter drop-shadow-sm ${
        animated ? "hover:scale-110 hover:rotate-6 transition-all duration-300" : ""
      } ${className}`}
      loading="eager"
      onError={(e) => {
        // Fallback to public path if bundler asset path differs
        e.currentTarget.src = "/ecocoin.png";
      }}
    />
  );
};

export default EcoCoinIcon;
