// Utilitaires pour formater les dates et durées

export function formatDateTime(dateTimeStr: string): string {
  try {
    // Format: yyyyMMddTHHmmss -> dd/MM HH:mm
    const year = dateTimeStr.substring(0, 4);
    const month = dateTimeStr.substring(4, 6);
    const day = dateTimeStr.substring(6, 8);
    const hour = dateTimeStr.substring(9, 11);
    const minute = dateTimeStr.substring(11, 13);
    return `${day}/${month} ${hour}:${minute}`;
  } catch (e) {
    return dateTimeStr;
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
}

export function formatTime(dateTimeStr: string): string {
  try {
    // Format: yyyyMMddTHHmmss -> HH:mm
    const hour = dateTimeStr.substring(9, 11);
    const minute = dateTimeStr.substring(11, 13);
    return `${hour}:${minute}`;
  } catch (e) {
    return dateTimeStr;
  }
}


