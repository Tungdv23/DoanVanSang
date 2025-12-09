import { useEffect, useRef, useState } from "react";
import type { Employee } from "./EmployeePage";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { captureFaceDescriptor, descriptorToArray } from "../../lib/faceRecognition";
import { attendanceService } from "../../services/attendanceService";

type FaceRegistrationModalProps = {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSaved?: () => void;
};

export function FaceRegistrationModal({
  open,
  onClose,
  employee,
  onSaved,
}: FaceRegistrationModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraReady(true);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Không thể truy cập camera trên thiết bị này.";
        setError(message);
        setIsCameraReady(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCapturedImage(null);
      setError(null);
      setIsCameraReady(false);
      setDescriptor(null);
      setIsProcessing(false);
      setIsSaving(false);
    };
  }, [open]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    try {
      const result = await captureFaceDescriptor(videoRef.current);
      if (!result.descriptor) {
        setCapturedImage(null);
        setDescriptor(null);
        setError("Không tìm thấy khuôn mặt. Vui lòng thử lại với ánh sáng tốt hơn.");
        return;
      }
      setCapturedImage(result.dataUrl);
      setDescriptor(result.descriptor);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể nhận diện khuôn mặt. Vui lòng thử lại.";
      setError(message);
      setCapturedImage(null);
      setDescriptor(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setDescriptor(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!descriptor || !employee) {
      setError("Vui lòng chụp khuôn mặt trước khi lưu.");
      return;
    }
    setIsSaving(true);
    try {
      await attendanceService.enrollFace({
        employeeId: employee.id,
        embedding: descriptorToArray(descriptor),
        snapshot: capturedImage ?? undefined,
      });
      onSaved?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể lưu khuôn mặt. Vui lòng thử lại.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal open={open} onClose={onClose} title="Đăng ký khuôn mặt">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Vui lòng nhìn thẳng vào camera, giữ ổn định khuôn mặt trong khung và
          nhấn &ldquo;Chụp&rdquo;.
        </p>
        <div className="relative rounded-2xl bg-black/80 overflow-hidden aspect-video">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!isCameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 text-sm">
                  {error ?? "Đang khởi động camera..."}
                </div>
              )}
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Ảnh khuôn mặt"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          {!capturedImage ? (
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!isCameraReady || !!error || isProcessing}
            >
              {isProcessing ? "Đang xử lý..." : "Chụp"}
            </Button>
          ) : (
            <>
              <Button variant="ghost" type="button" onClick={handleRetake}>
                Chụp lại
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu khuôn mặt"}
              </Button>
            </>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">
            {error} Vui lòng kiểm tra quyền camera và thử lại.
          </p>
        )}
      </div>
    </Modal>
  );
}
