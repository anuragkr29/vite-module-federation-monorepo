// Shared utilities and types
export const APP_NAME = "MFE POC";
export const APP_VERSION = "1.0.0";

export interface User {
  id: string;
  name: string;
  email: string;
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};
