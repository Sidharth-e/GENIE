/**
 * Convert an SVG element to a PNG data URL
 */
const svgToPngDataUrl = (
  svgElement: SVGSVGElement,
  scale = 8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a clone to not mess with the DOM
      const clone = svgElement.cloneNode(true) as SVGSVGElement;

      // Get accurate dimensions
      const bbox = svgElement.getBoundingClientRect();
      const width = bbox.width;
      const height = bbox.height;

      if (width === 0 || height === 0) {
        reject(new Error("SVG has invalid dimensions"));
        return;
      }

      // Ensure viewBox exists so the SVG scales correctly
      if (!clone.getAttribute("viewBox")) {
        clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }

      // Explicitly set dimensions on the clone to the scaled size
      // This forces the browser to rasterize the SVG at high resolution
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      clone.setAttribute("width", scaledWidth.toString());
      clone.setAttribute("height", scaledHeight.toString());

      // Also set style to ensure it takes precedence over CSS classes
      clone.style.width = `${scaledWidth}px`;
      clone.style.height = `${scaledHeight}px`;

      const svgData = new XMLSerializer().serializeToString(clone);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const img = new Image();

      // Handle loading external images/fonts if needed (basic SVG support for now)
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          // Canvas size matches the scaleld image size directly
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;

          // Fill background with white (prevents black background in some viewers)
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // No need to scale context, the image is already large!
          ctx.drawImage(img, 0, 0);

          const jpgUrl = canvas.toDataURL("image/png", 1.0); // Use max quality
          URL.revokeObjectURL(url);
          resolve(jpgUrl);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Download an SVG element as a PNG file
 */
export const downloadSvgAsPng = async (
  svgElement: SVGSVGElement,
  fileName: string,
  scale = 8,
) => {
  try {
    const dataUrl = await svgToPngDataUrl(svgElement, scale);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to download SVG:", err);
    throw err;
  }
};

/**
 * Copy an SVG element as a PNG to the clipboard
 */
export const copySvgAsPngToClipboard = async (
  svgElement: SVGSVGElement,
  scale = 8,
) => {
  try {
    const dataUrl = await svgToPngDataUrl(svgElement, scale);
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
  } catch (err) {
    console.error("Failed to copy SVG to clipboard:", err);
    throw err;
  }
};

/**
 * Copy text to clipboard using the modern API
 */
export const copyTextToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text:", err);
    throw err;
  }
};
