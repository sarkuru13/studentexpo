import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Calendar, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

const { width, height } = Dimensions.get('window');

export default function Home() {
  const { user } = useAuth();
  const { studentData, fetchStudentData, courseData, fetchCourseData, attendanceData, fetchAttendanceData } = useData();
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch data only once when user is available
  useEffect(() => {
    if (user && !dataFetched) {
      console.log('🔄 Fetching data for user:', user.email);
      fetchStudentData();
      fetchCourseData();
      fetchAttendanceData();
      setDataFetched(true);
    }
  }, [user, dataFetched, fetchStudentData, fetchCourseData, fetchAttendanceData]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Low';
  };

  // Aggregate attendance for the current user
  const userAttendanceRecords = useMemo(() => {
    if (!attendanceData || !studentData) return [];
    return attendanceData.filter(
      (rec) => rec.StudentID === studentData.$id || rec.Student_Id === studentData.$id
    );
  }, [attendanceData, studentData]);

  const totalClasses = userAttendanceRecords.length;
  const attendedClasses = userAttendanceRecords.filter(
    (rec) => rec.Status === 'Present' || rec.status === 'present'
  ).length;
  const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

  // Calendar logic
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const today = new Date();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const getDateStatus = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    const record = userAttendanceRecords.find(
      (r) => (r.Date || r.Marked_at)?.slice(0, 10) === dateString
    );
    if (record) {
      if (record.Status === 'Present' || record.status === 'present') return 'present';
      if (record.Status === 'Absent' || record.status === 'absent') return 'absent';
    }
    return 'none';
  };

  const getDayStyle = (status) => {
    switch (status) {
      case 'present': return [styles.calendarDay, styles.presentDay];
      case 'absent': return [styles.calendarDay, styles.absentDay];
      case 'weekend': return [styles.calendarDay, styles.weekendDay];
      default: return [styles.calendarDay];
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const canNavigateToPrevious = () => {
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    return prevMonth >= new Date(currentYear - 1, 0, 1);
  };
  const canNavigateToNext = () => {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    return nextMonth <= new Date(currentYear + 1, 11, 31);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{studentData?.Name || user?.name || 'Student'}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <User color="#ffffff" size={Math.max(20, width * 0.05)} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContent}>
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Calendar color="#3b82f6" size={Math.max(18, width * 0.045)} />
                <Text style={styles.statLabel}>Total Classes</Text>
                <Text style={styles.statValue}>{totalClasses}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <TrendingUp color="#10b981" size={Math.max(18, width * 0.045)} />
                <Text style={styles.statLabel}>Attended</Text>
                <Text style={styles.statValue}>{attendedClasses}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <TrendingUp color={getAttendanceColor(attendancePercentage)} size={Math.max(18, width * 0.045)} />
                <Text style={styles.statLabel}>Percentage</Text>
                <Text style={[styles.statValue, { color: getAttendanceColor(attendancePercentage) }]}>{attendancePercentage.toFixed(1)}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={[styles.navButton, !canNavigateToPrevious() && styles.navButtonDisabled]} onPress={navigateToPreviousMonth} disabled={!canNavigateToPrevious()}>
                <Text style={{fontSize: 20}}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>{monthNames[currentMonth]} {currentYear}</Text>
              <TouchableOpacity style={[styles.navButton, !canNavigateToNext() && styles.navButtonDisabled]} onPress={navigateToNextMonth} disabled={!canNavigateToNext()}>
                <Text style={{fontSize: 20}}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) return <View key={index} style={styles.emptyDay} />;
                const status = getDateStatus(day);
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                return (
                  <View key={index} style={[...getDayStyle(status), isToday && styles.todayDay]}>
                    <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                  </View>
                );
              })}
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
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: Math.max(15, height * 0.018),
  },
  safeArea: {
    paddingTop: Math.max(8, height * 0.01),
    paddingHorizontal: Math.max(16, width * 0.04),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.max(8, height * 0.01),
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: Math.max(12, width * 0.03),
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
  },
  userName: {
    fontSize: Math.max(18, width * 0.045),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginTop: 2,
  },
  profileIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: Math.max(8, width * 0.02),
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.max(16, width * 0.04),
    paddingTop: Math.max(10, height * 0.012),
  },
  innerContent: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  statsContainer: {
    marginTop: Math.max(10, height * 0.012),
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Math.max(16, width * 0.04),
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
    marginHorizontal: Math.max(12, width * 0.03),
  },
  statLabel: {
    fontSize: Math.max(10, width * 0.025),
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: Math.max(18, width * 0.045),
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Math.max(18, width * 0.045),
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: Math.max(12, width * 0.03),
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  subjectsContainer: {
    paddingBottom: 20,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Math.max(16, width * 0.04),
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    fontSize: Math.max(16, width * 0.04),
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: Math.max(12, width * 0.03),
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  attendancePercentage: {
    fontSize: Math.max(12, width * 0.03),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  subjectDetails: {
    marginBottom: 12,
  },
  attendanceStatus: {
    fontSize: Math.max(12, width * 0.03),
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 4,
  },
  classCount: {
    fontSize: Math.max(11, width * 0.028),
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: Math.max(14, width * 0.035),
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  // New styles for calendar
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Math.max(16, width * 0.04),
    marginTop: Math.max(10, height * 0.012),
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: Math.max(18, width * 0.045),
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  navButton: {
    padding: Math.max(8, width * 0.02),
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDay: {
    fontSize: Math.max(10, width * 0.025),
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // changed from 'space-around' to 'flex-start'
    marginBottom: 16,
  },
  calendarDay: {
    width: Math.max(40, width * 0.08),
    height: Math.max(40, width * 0.08),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  presentDay: {
    backgroundColor: '#10b981',
  },
  absentDay: {
    backgroundColor: '#ef4444',
  },
  weekendDay: {
    backgroundColor: '#f59e0b',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  dayText: {
    fontSize: Math.max(12, width * 0.03),
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  todayText: {
    color: '#667eea',
  },
  legendContainer: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: Math.max(14, width * 0.035),
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: Math.max(10, width * 0.025),
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  emptyDay: {
    width: Math.max(40, width * 0.08),
    height: Math.max(40, width * 0.08),
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
});