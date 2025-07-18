import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '@/contexts/DataContext';

export default function SubjectDetail() {
  const { id } = useLocalSearchParams();
  const { courseData, attendanceData, fetchCourseData, fetchAttendanceData } = useData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Fetch data on component mount
  useEffect(() => {
    fetchCourseData();
    fetchAttendanceData();
  }, [fetchCourseData, fetchAttendanceData]);

  const subject = courseData?.find(s => s.$id === id);
  const attendance = attendanceData?.find(a => a.courseId === id);

  if (!subject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Subject not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const percentage = attendance ? (attendance.attendedClasses / attendance.totalClasses) * 100 : 0;
  const today = new Date();

  // Generate calendar for current displayed month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getDateStatus = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    // Weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'weekend';
    }
    
    // Check if there's attendance data for this date
    if (attendance?.attendanceRecords) {
      const record = attendance.attendanceRecords.find(r => r.date === dateString);
      if (record) {
        return record.status;
      }
    }
    
    return 'none';
  };

  const getDayStyle = (status: string) => {
    switch (status) {
      case 'present':
        return [styles.calendarDay, styles.presentDay];
      case 'absent':
        return [styles.calendarDay, styles.absentDay];
      case 'weekend':
        return [styles.calendarDay, styles.weekendDay];
      case 'outside':
        return [styles.calendarDay, styles.outsideDay];
      default:
        return [styles.calendarDay];
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const canNavigateToPrevious = () => {
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    return prevMonth >= new Date(currentYear - 1, 0, 1); // Allow navigation to previous year
  };

  const canNavigateToNext = () => {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    return nextMonth <= new Date(currentYear + 1, 11, 31); // Allow navigation to next year
  };

  const navigateToPreviousMonth = () => {
    if (canNavigateToPrevious()) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const navigateToNextMonth = () => {
    if (canNavigateToNext()) {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.subjectName}>{subject.courseName}</Text>
            <Text style={styles.subjectCode}>{subject.courseCode}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Users color="#3b82f6" size={20} />
              <Text style={styles.statLabel}>Total Classes</Text>
              <Text style={styles.statValue}>{attendance?.totalClasses || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Calendar color="#10b981" size={20} />
              <Text style={styles.statLabel}>Attended</Text>
              <Text style={styles.statValue}>{attendance?.attendedClasses || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TrendingUp color={getAttendanceColor(percentage)} size={20} />
              <Text style={styles.statLabel}>Percentage</Text>
              <Text style={[styles.statValue, { color: getAttendanceColor(percentage) }]}>
                {percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={[styles.navButton, !canNavigateToPrevious() && styles.navButtonDisabled]}
              onPress={navigateToPreviousMonth}
              disabled={!canNavigateToPrevious()}
            >
              <ChevronLeft 
                color={canNavigateToPrevious() ? "#3b82f6" : "#94a3b8"} 
                size={24} 
              />
            </TouchableOpacity>
            
            <Text style={styles.calendarTitle}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            
            <TouchableOpacity
              style={[styles.navButton, !canNavigateToNext() && styles.navButtonDisabled]}
              onPress={navigateToNextMonth}
              disabled={!canNavigateToNext()}
            >
              <ChevronRight 
                color={canNavigateToNext() ? "#3b82f6" : "#94a3b8"} 
                size={24} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <View key={index} style={styles.emptyDay} />;
                }
                
                const status = getDateStatus(day);
                const isToday = day === today.getDate() && 
                               currentMonth === today.getMonth() && 
                               currentYear === today.getFullYear();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      ...getDayStyle(status),
                      isToday && styles.todayDay
                    ]}
                    onPress={() => setSelectedDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  >
                    <Text style={[
                      styles.dayText,
                      isToday && styles.todayText
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.presentDay]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.absentDay]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.weekendDay]} />
              <Text style={styles.legendText}>Weekend</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  subjectName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  subjectCode: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#e2e8f0',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: -20,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  navButtonDisabled: {
    backgroundColor: '#f8fafc',
  },
  calendarTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    textAlign: 'center',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDay: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  todayDay: {
    backgroundColor: '#10b981',
  },
  todayText: {
    color: '#ffffff',
  },
  legendContainer: {
    marginTop: 20,
  },
  legendTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
  },
});