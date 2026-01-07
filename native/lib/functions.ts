// Helper to format time (e.g. "10:30" or "Yesterday")
export const formatMessageTime = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();

  const isWithin24Hours = date.getTime() > now.getTime() - 24 * 60 * 60 * 1000;
  const t = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

  if (isWithin24Hours) {
    return t;
  } else {
    // Check if it's this year
    const isThisYear = date.getFullYear() === now.getFullYear();
    const d = isThisYear
      ? date.toLocaleDateString([], { month: 'numeric', day: 'numeric' })
      : date.toLocaleDateString([], { year: '2-digit', month: 'numeric', day: 'numeric' });
    return d + ' ' + t;
  }
};