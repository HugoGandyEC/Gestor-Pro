import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  X,
  ZoomIn,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Clock,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';

type PhotoSlot = 'entry' | 'exit';

interface ServiceOrderPhotosPanelProps {
  entryPhotos: string[];
  exitPhotos: string[];
  onChangeEntryPhotos: (photos: string[]) => void;
  onChangeExitPhotos: (photos: string[]) => void;
  readOnly?: boolean;
  compact?: boolean;
}

const MAX_PHOTOS_PER_SECTION = 8;

async function compressImageFile(file: File, maxDimension = 1280, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida ou corrompida.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ServiceOrderPhotosPanel: React.FC<ServiceOrderPhotosPanelProps> = ({
  entryPhotos,
  exitPhotos,
  onChangeEntryPhotos,
  onChangeExitPhotos,
  readOnly = false,
  compact = false
}) => {
  const entryCameraInputRef = useRef<HTMLInputElement | null>(null);
  const entryGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const exitCameraInputRef = useRef<HTMLInputElement | null>(null);
  const exitGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // Live Camera Modal state
  const [cameraTarget, setCameraTarget] = useState<PhotoSlot | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Lightbox preview
  const [lightboxPhoto, setLightboxPhoto] = useState<{ src: string; title: string } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!cameraTarget || capturedPreview) {
      stopCameraStream();
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Câmera ao vivo não disponível neste navegador. Use o botão "Câmera do Celular / Arquivo" abaixo.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            'Não foi possível abrir a câmera diretamente (permissão negada ou dispositivo sem webcam). Clique no botão abaixo para fotografar usando a câmera nativa do celular ou enviar uma foto.'
          );
        }
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [cameraTarget, facingMode, capturedPreview]);

  const appendPhotos = (slot: PhotoSlot, newPhotos: string[]) => {
    if (newPhotos.length === 0) return;
    if (slot === 'entry') {
      const merged = [...entryPhotos, ...newPhotos].slice(0, MAX_PHOTOS_PER_SECTION);
      onChangeEntryPhotos(merged);
      setFeedbackMsg(`${newPhotos.length} foto(s) salva(s) em "Início (Antes dos Serviços)".`);
    } else {
      const merged = [...exitPhotos, ...newPhotos].slice(0, MAX_PHOTOS_PER_SECTION);
      onChangeExitPhotos(merged);
      setFeedbackMsg(`${newPhotos.length} foto(s) salva(s) em "Local de Entrega dos Serviços".`);
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleFilesSelected = async (slot: PhotoSlot, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentCount = slot === 'entry' ? entryPhotos.length : exitPhotos.length;
    const remaining = Math.max(0, MAX_PHOTOS_PER_SECTION - currentCount);
    if (remaining === 0) {
      setFeedbackMsg(`Limite de ${MAX_PHOTOS_PER_SECTION} fotos por etapa atingido.`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    const compressed: string[] = [];
    for (const file of list) {
      try {
        const dataUrl = await compressImageFile(file);
        compressed.push(dataUrl);
      } catch {
        // Ignore unreadable file
      }
    }
    appendPhotos(slot, compressed);
  };

  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const maxW = 1280;
    const scale = video.videoWidth > maxW ? maxW / video.videoWidth : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPreview(dataUrl);
    stopCameraStream();
  };

  const handleConfirmSnapshot = () => {
    if (cameraTarget && capturedPreview) {
      appendPhotos(cameraTarget, [capturedPreview]);
    }
    setCapturedPreview(null);
    setCameraTarget(null);
    stopCameraStream();
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setCapturedPreview(null);
    setCameraError(null);
    setCameraTarget(null);
  };

  const handleRemovePhoto = (slot: PhotoSlot, index: number) => {
    if (slot === 'entry') {
      onChangeEntryPhotos(entryPhotos.filter((_, idx) => idx !== index));
    } else {
      onChangeExitPhotos(exitPhotos.filter((_, idx) => idx !== index));
    }
  };

  const renderSection = (
    slot: PhotoSlot,
    title: string,
    subtitle: string,
    photos: string[],
    accent: 'amber' | 'emerald'
  ) => {
    const camInputRef = slot === 'entry' ? entryCameraInputRef : exitCameraInputRef;
    const galInputRef = slot === 'entry' ? entryGalleryInputRef : exitGalleryInputRef;
    const isAmber = accent === 'amber';

    return (
      <div
        className={`rounded-xl border p-3.5 space-y-3 ${
          isAmber
            ? 'bg-amber-50/40 border-amber-200/90'
            : 'bg-emerald-50/40 border-emerald-200/90'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isAmber ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {slot === 'entry' ? <Clock className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                <span>{title}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isAmber ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {photos.length}/{MAX_PHOTOS_PER_SECTION}
                </span>
              </h5>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Inputs ocultos de câmera nativa e galeria */}
        <input
          ref={camInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(slot, e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={galInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(slot, e.target.files);
            e.target.value = '';
          }}
        />

        {/* Botões de Captura */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={photos.length >= MAX_PHOTOS_PER_SECTION}
              onClick={() => {
                setCapturedPreview(null);
                setCameraError(null);
                setCameraTarget(slot);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50 ${
                isAmber
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fotografar Agora</span>
            </button>

            <button
              type="button"
              disabled={photos.length >= MAX_PHOTOS_PER_SECTION}
              onClick={() => galInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Anexar da Galeria</span>
            </button>
          </div>
        )}

        {/* Grade de Miniaturas */}
        {photos.length === 0 ? (
          <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-white/80 text-center">
            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="text-[11px] text-slate-500">
              {slot === 'entry'
                ? 'Nenhuma foto do início (antes dos serviços) registrada.'
                : 'Nenhuma foto do local de entrega dos serviços registrada.'}
            </p>
          </div>
        ) : (
          <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
            {photos.map((src, idx) => (
              <div
                key={`${slot}-${idx}`}
                className="group relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs aspect-4/3"
              >
                <img
                  src={src}
                  alt={`${title} - Foto ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxPhoto({ src, title: `${title} · Foto ${idx + 1}` })}
                />
                <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/65 text-white">
                  #{idx + 1}
                </span>
                <div className="absolute top-1 right-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto({ src, title: `${title} · Foto ${idx + 1}` })}
                    className="p-1 rounded bg-black/65 text-white hover:bg-black/85 cursor-pointer"
                    title="Ampliar foto"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(slot, idx)}
                      className="p-1 rounded bg-rose-600/90 text-white hover:bg-rose-700 cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f6eff1] text-[#53383e] flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              Registro Fotográfico da O.S. (Início &amp; Local de Entrega)
            </h4>
            <p className="text-[11px] text-slate-500">
              Fotografe o estado inicial antes de começar os serviços e o local/resultado na entrega dos serviços.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {entryPhotos.length + exitPhotos.length} foto(s) anexada(s)
        </span>
      </div>

      {feedbackMsg && (
        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {renderSection(
          'entry',
          'Início — Antes de Começar os Serviços',
          'Registre fotos do equipamento ou ambiente antes de iniciar o atendimento técnico.',
          entryPhotos,
          'amber'
        )}

        {renderSection(
          'exit',
          'Local de Entrega dos Serviços (Finalização)',
          'Registre fotos do local de entrega e do serviço concluído para comprovação.',
          exitPhotos,
          'emerald'
        )}
      </div>

      {/* Modal de Câmera ao Vivo */}
      {cameraTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseCamera();
          }}
        >
          <div className="bg-slate-950 text-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-800">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs sm:text-sm">
                  {cameraTarget === 'entry'
                    ? 'Fotografar Início (Antes dos Serviços)'
                    : 'Fotografar Local de Entrega dos Serviços'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-100 text-xs space-y-3 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="leading-relaxed">{cameraError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const target = cameraTarget;
                        handleCloseCamera();
                        if (target === 'entry') entryCameraInputRef.current?.click();
                        else exitCameraInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Abrir Câmera do Dispositivo / Arquivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = cameraTarget;
                        handleCloseCamera();
                        if (target === 'entry') entryGalleryInputRef.current?.click();
                        else exitGalleryInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Escolher da Galeria</span>
                    </button>
                  </div>
                </div>
              ) : capturedPreview ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-4/3 flex items-center justify-center">
                    <img src={capturedPreview} alt="Prévia da foto capturada" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCapturedPreview(null)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tirar Outra</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSnapshot}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Usar Esta Foto na OS</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-4/3 flex items-center justify-center relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                        title="Alternar câmera traseira/frontal"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Inverter Câmera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = cameraTarget;
                          handleCloseCamera();
                          if (target === 'entry') entryCameraInputRef.current?.click();
                          else exitCameraInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Arquivo</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capturar Foto</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox de Ampliação */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-slate-950 rounded-2xl overflow-hidden max-w-4xl w-full border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="font-bold text-xs sm:text-sm">{lightboxPhoto.title}</span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center max-h-[80vh]">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
