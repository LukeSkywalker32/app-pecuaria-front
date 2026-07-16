/**
 * Utilitários de data para o frontend.
 */

/**
 * Retorna a data de hoje no formato YYYY-MM-DD no fuso local do usuário.
 *
 * Este helper ajusta para o fuso local antes de formatar.
 * em UTC-3 à noite (ex.: 21h) retorna a data do dia seguinte.
 * Este helper ajusta para o fuso local antes de formatar.
 */
export function todayLocalISO(): string {
   const d = new Date();
   const offset = d.getTimezoneOffset();
   const local = new Date(d.getTime() - offset * 60_000);
   return local.toISOString().split("T")[0];
}

/**
 * Converte uma data ISO (do backend) para YYYY-MM-DD no fuso local,
 * para uso em campos <input type="date">.
 */
export function isoToLocalDate(iso: string | Date | null | undefined): string {
   if (!iso) return "";
   const d = new Date(iso);
   const offset = d.getTimezoneOffset();
   const local = new Date(d.getTime() - offset * 60_000);
   return local.toISOString().split("T")[0];
}
