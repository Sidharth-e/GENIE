/**
 * Convert an SVG element to a PNG data URL
 */
const svgToPngDataUrl = (
  svgElement: SVGSVGElement,
  scale = 2,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a clone to not mess with the DOM
      const clone = svgElement.cloneNode(true) as SVGSVGElement;

      // Get dimensions
      const width =
        parseInt(svgElement.getAttribute("width") || "0") ||
        svgElement.getBoundingClientRect().width;
      const height =
        parseInt(svgElement.getAttribute("height") || "0") ||
        svgElement.getBoundingClientRect().height;

      clone.setAttribute("width", width.toString());
      clone.setAttribute("height", height.toString());

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
          canvas.width = width * scale;
          canvas.height = height * scale;
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          const jpgUrl = canvas.toDataURL("image/png");
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
  scale = 2,
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
  scale = 2,
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
