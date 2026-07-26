/**
 * Logo utility for PDF and Excel exports.
 * Fetches /logo.jpg (in the public folder) and caches as base64.
 */
let _logoDataUrl = null;

export const getLogoBase64 = async () => {
  if (_logoDataUrl) return _logoDataUrl;
  try {
    const res  = await fetch('/logo.jpg');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _logoDataUrl = reader.result; // "data:image/jpeg;base64,..."
        resolve(_logoDataUrl);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Logo load failed:', e);
    return null;
  }
};

/** Raw base64 string without the data: prefix, for jsPDF addImage */
export const getLogoBase64Raw = async () => {
  const full = await getLogoBase64();
  if (!full) return null;
  return full.split(',')[1];
};

/** ArrayBuffer of the logo, for ExcelJS addImage */
export const getLogoArrayBuffer = async () => {
  try {
    const res = await fetch('/logo.jpg');
    return await res.arrayBuffer();
  } catch (e) {
    console.warn('Logo ArrayBuffer failed:', e);
    return null;
  }
};