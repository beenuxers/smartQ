export function isWithinSession(params: {
  activeSession: string;
  lunchStart: string;
  lunchEnd: string;
  dinnerStart: string;
  dinnerEnd: string;
  now?: Date;
}) {
  if (params.activeSession === "all") return true;

  const now = params.now ?? new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  if (params.activeSession === "lunch") {
    return minutes >= toMinutes(params.lunchStart) && minutes <= toMinutes(params.lunchEnd);
  }
  if (params.activeSession === "dinner") {
    return (
      minutes >= toMinutes(params.dinnerStart) && minutes <= toMinutes(params.dinnerEnd)
    );
  }
  return true;
}
