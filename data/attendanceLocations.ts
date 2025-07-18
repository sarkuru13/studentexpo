import { AttendanceLocation } from '../utils/locationUtils';

// Sample attendance locations for different classes
// In a real app, these would come from your backend/database
export const attendanceLocations: AttendanceLocation[] = [
  {
    name: 'Computer Science Lab - Room 101',
    latitude: 40.7128, // Example coordinates (New York City)
    longitude: -74.0060,
    radius: 50, // 50 meters radius
  },
  {
    name: 'Mathematics Building - Room 205',
    latitude: 40.7135,
    longitude: -74.0065,
    radius: 30, // 30 meters radius
  },
  {
    name: 'Engineering Center - Room 301',
    latitude: 40.7140,
    longitude: -74.0070,
    radius: 40, // 40 meters radius
  },
  {
    name: 'Library - Study Hall',
    latitude: 40.7145,
    longitude: -74.0075,
    radius: 60, // 60 meters radius
  },
];

// Function to find attendance location by name
export const findAttendanceLocation = (name: string): AttendanceLocation | undefined => {
  return attendanceLocations.find(location => location.name === name);
};

// Function to get all attendance locations
export const getAllAttendanceLocations = (): AttendanceLocation[] => {
  return attendanceLocations;
};

// Function to add a new attendance location
export const addAttendanceLocation = (location: AttendanceLocation): void => {
  attendanceLocations.push(location);
};

// Function to remove an attendance location
export const removeAttendanceLocation = (name: string): boolean => {
  const index = attendanceLocations.findIndex(location => location.name === name);
  if (index !== -1) {
    attendanceLocations.splice(index, 1);
    return true;
  }
  return false;
}; 