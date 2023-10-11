import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, StatusBar, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { firebase } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Nexus from '../images/NexusLight.png';

const NavBar = () => {
  const navigation = useNavigation();
  const [notificationCount, setNotificationCount] = useState(0); 
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false); 

  const handleNotificationsPress = () => {
    setHasNewNotification(false);
    setNotificationCount(0)
    setPreviousNotificationCount(0);
    navigation.navigate('Notifications');
  };

  useEffect(() => {
    const currentUserUid = firebase.auth().currentUser.uid;
    const userRef = firebase.firestore().collection('users').doc(currentUserUid);
    
    const fetchStoredPreviousNotificationCount = async () => {
      try {
        const storedPreviousNotificationCount = await AsyncStorage.getItem('previousNotificationCount');
        return storedPreviousNotificationCount;
      } catch (error) {
        console.log('Error fetching stored notification count:', error);
        return null;
      }
    };
    
    const updateStoredPreviousNotificationCount = async (count) => {
      try {
        await AsyncStorage.setItem('previousNotificationCount', count.toString());
      } catch (error) {
        console.log('Error updating stored notification count:', error);
      }
    };
  
    const unsubscribe = userRef.onSnapshot(async (snapshot) => {
      const userData = snapshot.data();
      const notificationCount = userData.notifications.length;
  
      const storedPreviousNotificationCount = await fetchStoredPreviousNotificationCount();
  
      setHasNewNotification(storedPreviousNotificationCount !== notificationCount);
  
      setNotificationCount(notificationCount);
  
      if (storedPreviousNotificationCount !== notificationCount) {
        await updateStoredPreviousNotificationCount(notificationCount);
      }

      if(storedPreviousNotificationCount == notificationCount) {
        setHasNewNotification(false);
      }
  
      console.log(notificationCount);
      console.log(storedPreviousNotificationCount);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.NavContainer}>
      <View style={styles.NavBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.IconBehave}
        >
          <View style={styles.IconContainer}>
            <Icon name="ios-home" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles.IconBehave}
        >
          <View style={styles.IconContainer}>
            <Icon name="ios-search" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupChat')}
          style={styles.IconBehave}
        >
          <View style={styles.IconContainer}>
            <Image
              source={Nexus}
              style={styles.userImg}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNotificationsPress}
          style={styles.IconBehave}
        >
          <View style={styles.IconContainer}>
            <Icon name="ios-chatbox-ellipses" size={20} color="white" />
            {hasNewNotification && <View style={styles.notificationBadge} />}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.IconBehave}
        >
          <View style={styles.IconContainer}>
            <Icon name="ios-person" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NavBar;

const styles = StyleSheet.create({
  NavContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    left: 0,
    right: 0,
  },
  NavBar: {
    flexDirection: 'row',
    backgroundColor: '#535d64',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center', 
  },
  IconBehave: {
    flex: 1, 
    flexGrow: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  IconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  userImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 1,
    right: 2,
    width: 5,
    height: 2,
    backgroundColor: 'red',
    borderRadius: 3,
  },
});