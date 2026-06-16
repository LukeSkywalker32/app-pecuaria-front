// Componente reutilizável de upload de imagem.
// Usado em: VaccinationFormDialog, MortalityFormDialog (e futuramente FarmsPage).
//
// Props:
//   value        → URL atual da imagem (controlado pelo pai via react-hook-form ou useState)
//   onChange     → callback chamado com a nova URL após upload bem-sucedido
//   folder       → pasta no Cloudinary (ex: "vaccinations", "mortalities")
//   label        → texto do label exibido acima do componente
//   helperText   → texto de ajuda abaixo do componente
//   disabled     → desabilita interação
//   maxSizeMB    → tamanho máximo em MB (default: 5)
//
// Fluxo:
//   1. Usuário arrasta ou clica para selecionar imagem
//   2. Valida tipo e tamanho localmente
//   3. Envia para POST /api/upload/image?folder=<folder>
//   4. Chama onChange(url) com a URL retornada pelo Cloudinary
//   5. Exibe preview da imagem carregada
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import {
   Alert,
   Box,
   CircularProgress,
   IconButton,
   LinearProgress,
   Tooltip,
   Typography,
} from "@mui/material";
import { useCallback, useRef, useState } from "react";
import api from "@/services/api";

// -------Tipos -----
interface ImageUploaderProps {
   value?: string | null; // URL atual (pode vir do banco)
   onChange: (url: string | null) => void; // chamado com a nova URL ou null para limpar
   folder?: string; // pasta no Cloudinary (ex: "vaccinations", "mortalities")
   label?: string; // texto do label exibido acima do componente
   helperText?: string; // texto de ajuda abaixo do componente
   disabled?: boolean; // desabilita interação
   maxSizeMB?: number; // tamanho máximo em MB (default: 5)
}

// -------Constantes -----

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"] as const;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

// -------COMPONENTES -----

export default function ImageUploader({
   value,
   onChange,
   folder = "app-pecuaria",
   label = "Foto",
   helperText,
   disabled = false,
   maxSizeMB = 5,
}: ImageUploaderProps) {
   const inputRef = useRef<HTMLInputElement>(null);
   const [uploading, setUploading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [error, setError] = useState<string | null>("");
   const [isDragOver, setIsDragOver] = useState(false);

   // ---Valida e faz upload do arquivo -----
   const handleFile = useCallback(
      async (file: File) => {
         setError(null);

         // validação de tipo
         if (!ALLOWED_TYPES.includes(file.type as any)) {
            setError(`Tipo inválido: ${file.type}. Use ${ALLOWED_TYPES.join(", ")}`);
            return;
         }

         // validação de tamanho
         if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Arquivo muito grande. Máx. ${maxSizeMB}MB.`);
            return;
         }

         setUploading(true);
         setProgress(10); // feedback visual do upload

         try {
            const formData = new FormData();
            formData.append("file", file);
            // Simula progresso visual (Axios não expõe progresso de upload facilmente
            // com FormData, então usamos um incremento falso até a resposta chegar)
            const progressInterval = setInterval(() => {
               setProgress(prev => Math.min(prev + 15, 85));
            }, 300);

            const { data } = await api.post<{ url: string; publicId: string }>(
               `/upload/image?folder=${encodeURIComponent(folder)}`,
               formData,
               {
                  headers: { "Content-Type": "multipart/form-data" },
               },
            );
            clearInterval(progressInterval);
            setProgress(100);

            //Pequena pausa para mostrar 100% antes de limpar
            setTimeout(() => {
               setProgress(0);
               setUploading(false);
               onChange(data.url);
            }, 400);
         } catch (err: any) {
            setProgress(0);
            setUploading(false);
            const msg = err?.response?.data?.error ?? "Erro ao fazer upload. Tente novamente.";
            setError(msg);
         }
      },
      [folder, maxSizeMB, onChange],
   );
   // ── Handlers de input e drag & drop ───────
   function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      //Reseta o input para permitir selecionar o mesmo arquivo novamente
      if (inputRef.current) inputRef.current.value = "";
   }
   function handleDrop(e: React.DragEvent) {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
   }

   function handleDragOver(e: React.DragEvent) {
      e.preventDefault();
      if (!disabled && !uploading) setIsDragOver(true);
   }

   function handleDragLeave() {
      setIsDragOver(false);
   }
   function handleClear() {
      onChange(null);
      setError(null);
   }
   function handleClick() {
      if (!disabled && !uploading) inputRef.current?.click();
   }

   // ─── Render ──────────────────────────

   const hasImage = !!value;

   return (
      <Box>
         {/* Label */}
         <Typography
            variant="caption"
            sx={{
               fontWeight: 700,
               color: disabled ? "text.disabled" : "text.secondary",
               textTransform: "uppercase",
               letterSpacing: 0.8,
               display: "block",
               mb: 1,
            }}
         >
            {label}
         </Typography>

         {/* Área de upload / preview */}
         <Box
            onClick={hasImage ? undefined : handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            sx={{
               position: "relative",
               width: "100%",
               minHeight: 140,
               borderRadius: 2,
               border: "2px dashed",
               borderColor: isDragOver
                  ? "primary.main"
                  : hasImage
                    ? "success.300"
                    : error
                      ? "error.300"
                      : "divider",
               bgcolor: isDragOver ? "rgba(27,67,50,0.06)" : hasImage ? "#F0FFF4" : "#FAFAFA",
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               justifyContent: "center",
               gap: 1,
               cursor: hasImage || disabled || uploading ? "default" : "pointer",
               transition: "all 0.2s",
               overflow: "hidden",
               "&:hover":
                  !hasImage && !disabled && !uploading
                     ? { borderColor: "primary.main", bgcolor: "rgba(27,67,50,0.04)" }
                     : {},
            }}
         >
            {/* Preview da imagem carregada */}
            {hasImage && (
               <>
                  <Box
                     component="img"
                     src={value}
                     alt="Preview"
                     sx={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        display: "block",
                     }}
                  />
                  {/* Botão de remover sobreposto */}
                  {!disabled && (
                     <Box
                        sx={{
                           position: "absolute",
                           top: 6,
                           right: 6,
                           bgcolor: "rgba(0,0,0,0.55)",
                           borderRadius: 1,
                        }}
                     >
                        <Tooltip title="Remover imagem">
                           <IconButton
                              size="small"
                              onClick={handleClear}
                              sx={{ color: "white", p: 0.5 }}
                           >
                              <DeleteIcon fontSize="small" />
                           </IconButton>
                        </Tooltip>
                     </Box>
                  )}
                  {/* Botão de substituir */}
                  {!disabled && (
                     <Box
                        onClick={handleClick}
                        sx={{
                           position: "absolute",
                           bottom: 0,
                           left: 0,
                           right: 0,
                           bgcolor: "rgba(0,0,0,0.55)",
                           py: 0.75,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           gap: 0.5,
                           cursor: "pointer",
                           "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        }}
                     >
                        <CloudUploadIcon sx={{ fontSize: 14, color: "white" }} />
                        <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
                           Substituir foto
                        </Typography>
                     </Box>
                  )}
               </>
            )}

            {/* Estado: fazendo upload */}
            {uploading && (
               <Box
                  sx={{
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     gap: 1,
                     p: 2,
                  }}
               >
                  <CircularProgress size={32} color="primary" />
                  <Typography variant="caption" color="text.secondary">
                     Enviando imagem...
                  </Typography>
                  <Box sx={{ width: "80%" }}>
                     <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 4, borderRadius: 2 }}
                     />
                  </Box>
               </Box>
            )}

            {/* Estado: sem imagem e sem upload em andamento */}
            {!hasImage && !uploading && (
               <Box
                  sx={{
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     gap: 0.5,
                     p: 2,
                     textAlign: "center",
                  }}
               >
                  <Box
                     sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: "rgba(27,67,50,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 0.5,
                     }}
                  >
                     <ImageIcon sx={{ color: "primary.main", fontSize: 22 }} />
                  </Box>
                  <Typography
                     variant="body2"
                     sx={{ fontWeight: 700, color: disabled ? "text.disabled" : "text.primary" }}
                  >
                     {disabled ? "Sem foto" : "Clique ou arraste uma imagem"}
                  </Typography>
                  {!disabled && (
                     <Typography variant="caption" color="text.secondary">
                        {ALLOWED_EXTENSIONS} · Máx. {maxSizeMB}MB
                     </Typography>
                  )}
               </Box>
            )}
         </Box>

         {/* Barra de progresso fora da área (visível durante upload) */}
         {uploading && (
            <LinearProgress
               variant="determinate"
               value={progress}
               sx={{ mt: 0.5, height: 3, borderRadius: 0, display: "none" }}
            />
         )}

         {/* Erro de validação local ou de rede */}
         {error && (
            <Alert
               severity="error"
               sx={{ mt: 1, py: 0.5, fontSize: 12 }}
               onClose={() => setError(null)}
            >
               {error}
            </Alert>
         )}

         {/* Helper text */}
         {helperText && !error && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
               {helperText}
            </Typography>
         )}

         {/* Input file oculto */}
         <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={handleInputChange}
            disabled={disabled}
         />
      </Box>
   );
}
