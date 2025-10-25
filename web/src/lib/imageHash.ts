import sharp from "sharp";

export type ImageHashResult = {
  aHash: string; // 64-bit hash as hex string length 16
};

function computeAverage(values: number[]): number {
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / Math.max(values.length, 1);
}

function bitsToHex64(bits: string): string {
  // bits length expected 64
  let hex = "";
  for (let i = 0; i < 16; i++) {
    const nibbleBits = bits.slice(i * 4, i * 4 + 4);
    const value = parseInt(nibbleBits, 2);
    hex += value.toString(16);
  }
  return hex.padStart(16, "0");
}

export async function computeAverageHashFromBuffer(buffer: Buffer): Promise<ImageHashResult> {
  // 8x8 grayscale, average hash
  const size = 8;
  const img = await sharp(buffer).grayscale().resize(size, size, { fit: "fill" }).raw().toBuffer();
  const pixels = Array.from(img);
  const avg = computeAverage(pixels);
  let bits = "";
  for (const p of pixels) bits += p >= avg ? "1" : "0";
  const hex = bitsToHex64(bits);
  return { aHash: hex };
}

const NIBBLE_POPCOUNT = [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4];

export function hammingDistanceHex64(a: string, b: string): number {
  let dist = 0;
  const len = Math.min(a.length, b.length, 16);
  for (let i = 0; i < len; i++) {
    const na = parseInt(a[i], 16) || 0;
    const nb = parseInt(b[i], 16) || 0;
    dist += NIBBLE_POPCOUNT[na ^ nb];
  }
  // If lengths differ, count leftover nibbles as full distance
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

export function similarityFromHamming64(distance: number): number {
  // normalize to 0..1 (64 bits)
  return 1 - distance / 64;
}


