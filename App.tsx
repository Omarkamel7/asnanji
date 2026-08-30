import ErrorBoundary from './src/components/ErrorBoundary';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Home,
  Stethoscope,
  Calendar,
  FileText,
  User,
  Activity,
  Sparkles,
  MessageCircle,
} from 'lucide-react-native';

import { AppProvider, useApp } from './src/context/AppContext';
import { Colors } from './src/constants/theme';

import { HomeScreen } from './src/screens/HomeScreen';
import { ComplaintIntakeScreen } from './src/screens/ComplaintIntakeScreen';
import { MedicalRecordsScreen } from './src/screens/MedicalRecordsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DoctorDashboardScreen } from './src/screens/DoctorDashboardScreen';
import { DoctorConsultationDetailScreen } from './src/screens/DoctorConsultationDetailScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { NewConsultationScreen } from './src/screens/NewConsultationScreen';
import { DoctorProfileScreen } from './src/screens/DoctorProfileScreen';

import { DoctorSettingsScreen } from './src/screens/doctor/DoctorSettingsScreen';
import { ManageServicesScreen } from './src/screens/doctor/ManageServicesScreen';
import { ManagePortfolioScreen } from './src/screens/doctor/ManagePortfolioScreen';
import { UpdateNotifierModal } from './src/components/UpdateNotifierModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PatientTabs = () => {
  const { t } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 16,
          color: Colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t.navHome,
          headerTitle: t.appTitle,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="NewConsultationTab"
        component={ComplaintIntakeScreen}
        options={{
          title: t.navConsultation,
          headerTitle: t.complaintTitle,
          tabBarIcon: ({ color, size }) => (
            <Stethoscope size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MedicalRecords"
        component={MedicalRecordsScreen}
        options={{
          title: t.navRecords,
          headerTitle: t.medicalRecordsTitle,
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PatientChat"
        component={ChatScreen}
        options={{
          title: t.navChat,
          headerTitle: t.chatTitle,
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t.navProfile,
          headerTitle: t.navProfile,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const DoctorTabs = () => {
  const { t } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.primaryDark,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 16,
          color: Colors.white,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{
          title: t.navDoctorDashboard,
          headerTitle: t.doctorDashboardTitle,
          tabBarIcon: ({ color, size }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorChat"
        component={ChatScreen}
        options={{
          title: t.navChat,
          headerTitle: t.chatTitle,
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorProfile"
        component={ProfileScreen}
        options={{
          title: t.navProfile,
          headerTitle: t.navProfile,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigation = () => {
  const { role, language } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.primaryDark,
          headerTitleStyle: {
            fontWeight: '800',
          },
        }}
      >
        {role === 'patient' ? (
          <Stack.Screen
            name="PatientRoot"
            component={PatientTabs}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="DoctorRoot"
            component={DoctorTabs}
            options={{ headerShown: false }}
          />
        )}

        <Stack.Screen
          name="DoctorConsultationDetail"
          component={DoctorConsultationDetailScreen}
          options={{
            title: language === 'ar' ? 'فحص الحالة والتشخيص' : 'Case Triage',
          }}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title:
              language === 'ar'
                ? 'المحادثة الطبية المباشرة'
                : 'Medical Consultation Chat',
          }}
        />

        <Stack.Screen
          name="NewConsultation"
          component={NewConsultationScreen}
          options={{
            title: language === 'ar' ? 'طلب استشارة وفحص طبي' : 'Medical Consultation',
          }}
        />

        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            headerShown: false,
          }}
        />

        

        
        <Stack.Screen
          name="DoctorSettings"
          component={DoctorSettingsScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ManagePortfolio"
          component={ManagePortfolioScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ManageServices"
          component={ManageServicesScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="DoctorPublicProfile"
          component={DoctorProfileScreen}
          options={{ headerShown: false }}
        />



        </Stack.Navigator>
    </NavigationContainer>
  );
};



export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ErrorBoundary>
        <AppProvider>
          <MainNavigation />
          <UpdateNotifierModal />
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}




