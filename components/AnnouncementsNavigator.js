import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Announcements from './Announcements';
import GroupAnnouncements from './GroupAnnouncements';

const AnnouncementsStack = createStackNavigator();

const AnnouncementsNavigator = () => {
  return (
    <AnnouncementsStack.Navigator
      initialRouteName='Announcements'
      options={{ headerShown: false }} 
    >
      <AnnouncementsStack.Screen name='Announcements' component={Announcements} />
      <AnnouncementsStack.Screen name='GroupAnnouncements' component={GroupAnnouncements} />
    </AnnouncementsStack.Navigator>
  );
};

export default AnnouncementsNavigator;