/**
 * Portable binary media store contract (object-storage shaped, runtime-neutral).
 */

export type MediaObject = {
  key: string;
  contentType: string;
  etag: string;
  size: number;
  body: Uint8Array;
};

export type MediaPutOptions = {
  contentType?: string;
};

export interface MediaStore {
  put(key: string, body: Uint8Array, options?: MediaPutOptions): Promise<MediaObject>;
  get(key: string): Promise<MediaObject | null>;
  delete(key: string): Promise<void>;
}
