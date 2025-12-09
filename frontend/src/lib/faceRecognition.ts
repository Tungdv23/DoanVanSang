import * as faceapi from 'face-api.js';

const DEFAULT_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const MODEL_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env.VITE_FACE_MODEL_URL as string | undefined)) ||
  DEFAULT_MODEL_URL;

let modelLoadingPromise: Promise<void> | null = null;

const loadFaceApiModels = async () => {
  if (!modelLoadingPromise) {
    modelLoadingPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }
  return modelLoadingPromise;
};

type CaptureResult = {
  dataUrl: string;
  descriptor: Float32Array | null;
};

const createCanvasFromVideo = (video: HTMLVideoElement) => {
  const width = video.videoWidth || video.clientWidth;
  const height = video.videoHeight || video.clientHeight;

  if (!width || !height) {
    throw new Error('Camera chưa sẵn sàng hoặc không có dữ liệu hình ảnh.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể tạo canvas để chụp hình.');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
};

export const captureFaceDescriptor = async (
  video: HTMLVideoElement
): Promise<CaptureResult> => {
  await loadFaceApiModels();

  const canvas = createCanvasFromVideo(video);
  const dataUrl = canvas.toDataURL('image/png');

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });

  const result = await faceapi
    .detectSingleFace(canvas, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return {
    dataUrl,
    descriptor: result?.descriptor ?? null,
  };
};

export const descriptorToArray = (descriptor: Float32Array) =>
  Array.from(descriptor);
