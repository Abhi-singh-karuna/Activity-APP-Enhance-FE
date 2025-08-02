import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import screens from organized structure
import {
  SplashScreen,
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  OTPVerificationScreen as OtpVerificationScreen,
  ResetPasswordScreen,
  ActivityScreen,
  ActivityDetailScreen,
  TaskScreen,
  TaskDetailScreen,
  StatsScreen,
  SettingsScreen,
} from "../screens";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignupScreen: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  ResetPassword: { email: string; otpToken: string };
  Activity: undefined;
  ActivityDetail: { title: string; category: string; isPersonal: boolean };
  Stats: { title?: string; activeTab?: "activities" | "tasks" | "combined" };
  Settings: undefined;
  Task: undefined;
  TaskDetail: { id: string; title: string; category: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#121212" },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
        />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Task" component={TaskScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
