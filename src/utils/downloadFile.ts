// Dispara o download de um blob no navegador, criando e removendo
// um <a> temporario - padrao usado pelos botoes de "Exportar" do sistema.

export function downloadBlob(blob: Blob, filename: string): void {
   const url = window.URL.createObjectURL(blob);
   const link = document.createElement("a");
   link.href = url;
   link.download = filename;
   document.body.appendChild(link);
   link.click();
   link.remove();
   window.URL.revokeObjectURL(url);
}
