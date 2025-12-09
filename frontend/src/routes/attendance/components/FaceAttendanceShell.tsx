import {
  forwardRef,
  type ForwardedRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export type FaceAttendanceShellHandle = {
  getVideoElement: () => HTMLVideoElement | null;
};

type FaceAttendanceShellProps = {
  onCameraReady?: () => void;
  onCameraError?: (message: string) => void;
};

const FaceAttendanceShell = (
  { onCameraReady, onCameraError }: FaceAttendanceShellProps,
  ref: ForwardedRef<FaceAttendanceShellHandle>
) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [trangThaiCamera, setTrangThaiCamera] = useState<'dang-tai' | 'san-sang' | 'loi'>('dang-tai');
  const [thongDiepLoi, setThongDiepLoi] = useState('');

  useImperativeHandle(
    ref,
    () => ({
      getVideoElement: () => videoRef.current,
    }),
    []
  );

  useEffect(() => {
    let stream: MediaStream | null = null;

    const khoiDongCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ camera.');
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setTrangThaiCamera('san-sang');
        onCameraReady?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể truy cập camera.';
        setTrangThaiCamera('loi');
        setThongDiepLoi(message);
        onCameraError?.(message);
      }
    };

    khoiDongCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCameraReady, onCameraError]);

  return (
    <div className="flex h-full flex-col text-slate-500">
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-black/90 shadow-inner">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
        {trangThaiCamera !== 'san-sang' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
            <p className="mt-4 text-sm font-semibold">
              {trangThaiCamera === 'dang-tai' ? 'Đang khởi động camera...' : thongDiepLoi}
            </p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Camera dùng để nhận diện khuôn mặt. Hãy đứng trong vùng sáng và nhìn thẳng vào camera.
      </p>
    </div>
  );
};

export default forwardRef(FaceAttendanceShell);
