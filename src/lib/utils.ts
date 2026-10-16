import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string like "Nov 15, 2026"
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format time to readable string like "10:00 AM"
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Get category color classes
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Technical: "bg-blue-100 text-blue-800",
    Cultural: "bg-purple-100 text-purple-800",
    Sports: "bg-green-100 text-green-800",
    Workshop: "bg-orange-100 text-orange-800",
    Seminar: "bg-teal-100 text-teal-800",
    Competition: "bg-red-100 text-red-800",
    Other: "bg-gray-100 text-gray-800",
  };
  return colors[category] || colors.Other;
}

// Get category icon name (Lucide icon names)
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Technical: "code",
    Cultural: "music",
    Sports: "trophy",
    Workshop: "wrench",
    Seminar: "presentation",
    Competition: "flame",
    Other: "calendar",
  };
  return icons[category] || icons.Other;
}

// Check if event date is in the future
export function isUpcoming(eventDate: string): boolean {
  return new Date(eventDate) > new Date();
}

// Check if registration deadline has passed
export function isDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}
