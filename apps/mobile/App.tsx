import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WaitTimeInputModal } from './src/components/WaitTimeInputModal';
import { Colors } from './src/constants/colors';
import { MOCK_REPORTS, MOCK_ZONES } from './src/constants/mockZones';
import { BoardDetailScreen } from './src/screens/BoardDetailScreen';
import { BoardListScreen } from './src/screens/BoardListScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { MapScreen } from './src/screens/MapScreen';
import { fetchZones, subscribeActiveReports } from './src/services/firebase';
import { useAppStore } from './src/stores/useAppStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.surface,
          borderTopWidth: 0.5,
          borderTopColor: Colors.divider,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          minHeight: 48,
        },
        tabBarActiveTintColor: Colors.text.primary,
        tabBarInactiveTintColor: Colors.status.unknown,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarShowLabel: true,
        tabBarIcon: ({ color }) => (
          <Feather
            name={
              route.name === '지도'
                ? 'map'
                : route.name === '제보'
                  ? 'activity'
                  : 'message-square'
            }
            size={24}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="지도" component={MapScreen} />
      <Tab.Screen name="제보" component={FeedScreen} />
      <Tab.Screen name="게시판" component={BoardListScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="BoardDetail" component={BoardDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const setZones = useAppStore((state) => state.setZones);
  const setActiveReports = useAppStore((state) => state.setActiveReports);
  const isWaitModalVisible = useAppStore((state) => state.isWaitModalVisible);
  const waitModalZoneId = useAppStore((state) => state.waitModalZoneId);
  const closeWaitModal = useAppStore((state) => state.closeWaitModal);

  useEffect(() => {
    fetchZones()
      .then((zones) => {
        setZones(zones.length ? zones : MOCK_ZONES);
      })
      .catch(() => setZones(MOCK_ZONES));

    const unsubscribe = subscribeActiveReports((reports) => {
      setActiveReports(reports.length ? reports : MOCK_REPORTS);
    });

    return unsubscribe;
  }, [setActiveReports, setZones]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
        <WaitTimeInputModal
          visible={isWaitModalVisible}
          initialZoneId={waitModalZoneId}
          onClose={closeWaitModal}
        />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
