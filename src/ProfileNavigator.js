import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EditProfile from './EditProfile';
import Profile from './Profile';
import Settings from './Settings';

const ProfileStack = createStackNavigator();

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator
      initialRouteName='Profile'
      options={{ headerShown: false }} 
    >
      <ProfileStack.Screen name='Profile' component={Profile} />
      <ProfileStack.Screen name='EditProfile' component={EditProfile} />
      <ProfileStack.Screen name='Settings' component={Settings} />
    </ProfileStack.Navigator>
  );
};

export default ProfileNavigator;