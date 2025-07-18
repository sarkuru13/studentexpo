import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { account, databases, functions } from '../lib/appwrite';
import { ID, Models, Permission, Role, Query, AppwriteException } from 'appwrite';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

interface DataContextType {
  studentData: Models.Document | null;
  setStudentData: React.Dispatch<React.SetStateAction<Models.Document | null>>;
  fetchStudentData: () => Promise<void>;

  courseData: Models.Document[] | null;
  setCourseData: React.Dispatch<React.SetStateAction<Models.Document[] | null>>;
  fetchCourseData: () => Promise<void>;

  attendanceData: Models.Document[] | null;
  setAttendanceData: React.Dispatch<React.SetStateAction<Models.Document[] | null>>;
  fetchAttendanceData: () => Promise<void>;

  markPresent: (studentId: string, date: string) => void;
  unmarkPresent: (studentId: string, date: string) => void;
  getMarkedStudents: (date: string) => string[];
  saveAttendance: (date: string, courseId: string, sessionId: string, latitude: number | null, longitude: number | null) => Promise<void>;
  markPresentByQR: (studentId: string, date: string) => void;
  resetManualAttendance: (date: string) => void;

  selectedCourse: string | null;
  setSelectedCourse: React.Dispatch<React.SetStateAction<string | null>>;

  latitude: string;
  longitude: string;
  locationId: string | null;
  hasExistingLocation: boolean;
  isLocationLoading: boolean;
  setLatitude: React.Dispatch<React.SetStateAction<string>>;
  setLongitude: React.Dispatch<React.SetStateAction<string>>;
  fetchLocation: () => Promise<void>;
  saveLocation: () => Promise<void>;
  handleUpdateLocation: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const DB_ID = '6819e71f002774754561';
const STUDENT_COLLECTION_ID = '6819e983001dc900e9f9';
const COURSE_COLLECTION_ID = '6819e836002f8c03c689';
const ATTENDANCE_COLLECTION_ID = '6819e8e100130bc54117';
const LOCATION_COLLECTION_ID = '6839818e00303c1ed20e';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentData, setStudentData] = useState<Models.Document | null>(null);
  const [courseData, setCourseData] = useState<Models.Document[] | null>(null);
  const [attendanceData, setAttendanceData] = useState<Models.Document[] | null>(null);
  const [manualAttendance, setManualAttendance] = useState<{ [date: string]: string[] }>({});
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [hasExistingLocation, setHasExistingLocation] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Add refs to prevent duplicate requests
  const fetchingRef = useRef<{ student: boolean; course: boolean; attendance: boolean }>({
    student: false,
    course: false,
    attendance: false,
  });

  const fetchStudentData = useCallback(async () => {
    if (fetchingRef.current.student) return;
    
    try {
      fetchingRef.current.student = true;
      const currentUser = await account.get();
      const response = await databases.listDocuments(
        DB_ID,
        STUDENT_COLLECTION_ID,
        [Query.equal('userId', currentUser.$id)]
      );

      if (response.total > 0) {
        console.log('✅ Student Data fetched');
        setStudentData(response.documents[0]);
      } else {
        console.warn('⚠️ No student found for:', currentUser.$id);
        setStudentData(null);
      }
    } catch (err) {
      console.error('❌ Failed to fetch student data:', err);
      setStudentData(null);
    } finally {
      fetchingRef.current.student = false;
    }
  }, []);

  const fetchCourseData = useCallback(async () => {
    if (fetchingRef.current.course) return;
    
    try {
      fetchingRef.current.course = true;
      const response = await databases.listDocuments(
        DB_ID,
        COURSE_COLLECTION_ID,
      );
      console.log('✅ Course Data fetched');
      setCourseData(response.documents);
    } catch (err) {
      console.error('❌ Failed to fetch course data:', err);
      setCourseData(null);
    } finally {
      fetchingRef.current.course = false;
    }
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    if (fetchingRef.current.attendance) return;
    
    try {
      fetchingRef.current.attendance = true;
      const response = await databases.listDocuments(
        DB_ID,
        ATTENDANCE_COLLECTION_ID,
      );
      console.log('✅ Attendance Data fetched');
      setAttendanceData(response.documents);
    } catch (err) {
      console.error('❌ Failed to fetch attendance data:', err);
      setAttendanceData(null);
    } finally {
      fetchingRef.current.attendance = false;
    }
  }, []);

  const markPresent = (studentId: string, date: string) => {
    setManualAttendance(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), studentId]
    }));
  };

  const unmarkPresent = (studentId: string, date: string) => {
    setManualAttendance(prev => ({
      ...prev,
      [date]: (prev[date] || []).filter(id => id !== studentId)
    }));
  };

  const getMarkedStudents = (date: string) => {
    return manualAttendance[date] || [];
  };

  const saveAttendance = async (date: string, courseId: string, sessionId: string, latitude: number | null, longitude: number | null) => {
    try {
      const markedStudents = getMarkedStudents(date);
      
      for (const studentId of markedStudents) {
        await databases.createDocument(
          DB_ID,
          ATTENDANCE_COLLECTION_ID,
          ID.unique(),
          {
            StudentID: studentId,
            CourseID: courseId,
            Date: date,
            Status: 'Present',
            SessionID: sessionId,
            Latitude: latitude,
            Longitude: longitude,
            MarkedBy: 'Manual',
            MarkedAt: new Date().toISOString(),
          }
        );
      }
      
      await fetchAttendanceData();
      setManualAttendance(prev => {
        const newState = { ...prev };
        delete newState[date];
        return newState;
      });
      
      console.log('✅ Attendance saved successfully');
    } catch (err) {
      console.error('❌ Failed to save attendance:', err);
      throw err;
    }
  };

  const markPresentByQR = (studentId: string, date: string) => {
    // This would be called when QR code is scanned
    console.log('QR Attendance marked for student:', studentId, 'on date:', date);
  };

  const resetManualAttendance = (date: string) => {
    setManualAttendance(prev => {
      const newState = { ...prev };
      delete newState[date];
      return newState;
    });
  };

  const fetchLocation = async () => {
    try {
      setIsLocationLoading(true);
      const currentUser = await account.get();
      
      const response = await databases.listDocuments(
        DB_ID,
        LOCATION_COLLECTION_ID,
        [Query.equal('UserID', currentUser.$id)]
      );

      if (response.total > 0) {
        const locationDoc = response.documents[0];
        setLatitude(locationDoc.Latitude);
        setLongitude(locationDoc.Longitude);
        setLocationId(locationDoc.$id);
        setHasExistingLocation(true);
        console.log('✅ Location fetched:', locationDoc);
      } else {
        setHasExistingLocation(false);
        console.log('⚠️ No existing location found');
      }
    } catch (err) {
      console.error('❌ Failed to fetch location:', err);
      setHasExistingLocation(false);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const saveLocation = async () => {
    try {
      const currentUser = await account.get();
      
      if (hasExistingLocation && locationId) {
        await databases.updateDocument(
          DB_ID,
          LOCATION_COLLECTION_ID,
          locationId,
          {
            Latitude: latitude,
            Longitude: longitude,
            UpdatedAt: new Date().toISOString(),
          }
        );
        console.log('✅ Location updated');
      } else {
        const newLocationDoc = await databases.createDocument(
          DB_ID,
          LOCATION_COLLECTION_ID,
          ID.unique(),
          {
            UserID: currentUser.$id,
            Latitude: latitude,
            Longitude: longitude,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
          }
        );
        setLocationId(newLocationDoc.$id);
        setHasExistingLocation(true);
        console.log('✅ Location saved');
      }
    } catch (err) {
      console.error('❌ Failed to save location:', err);
      throw err;
    }
  };

  const handleUpdateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to update location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      
      await saveLocation();
      console.log('✅ Location updated successfully');
    } catch (err) {
      console.error('❌ Failed to update location:', err);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    }
  };

  return (
    <DataContext.Provider value={{
      studentData,
      setStudentData,
      fetchStudentData,
      courseData,
      setCourseData,
      fetchCourseData,
      attendanceData,
      setAttendanceData,
      fetchAttendanceData,
      markPresent,
      unmarkPresent,
      getMarkedStudents,
      saveAttendance,
      markPresentByQR,
      resetManualAttendance,
      selectedCourse,
      setSelectedCourse,
      latitude,
      longitude,
      locationId,
      hasExistingLocation,
      isLocationLoading,
      setLatitude,
      setLongitude,
      fetchLocation,
      saveLocation,
      handleUpdateLocation,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 