export function formatDate(dateString: string): string {
  // Parse the date string
  const date = new Date(dateString);
  
  // Get date components
  const month = date.getMonth(); // 0-11
  const day = date.getDate(); // 1-31
  const year = date.getFullYear();
  
  // Array of month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Format the date in a consistent way that works on both server and client
  return `${monthNames[month]} ${day}, ${year}`;
}
