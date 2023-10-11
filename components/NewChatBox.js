import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, ScrollView, Animated } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import { firebase } from '../config';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { formatDistanceToNow } from 'date-fns';
import { Swipeable } from 'react-native-gesture-handler';
import NavBar from './NavBar';
import Announcements from './Announcements';
import NexusImage from '../images/Nexus.png';
import logo from '../images/logoDark.png';
import * as Location from 'expo-location';

const NewChatBox = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [chatRoomTimestamps, setChatRoomTimestamps] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [isSwiping, setIsSwiping] = useState(false); 
  const [currentUserUid, setCurrentUserUid] = useState('');
  const [queue, setQueue] = useState([]);
  const [waitForMatchInterval, setWaitForMatchInterval] = useState(null);

  const bottomSheetModalRef = React.useRef(null);

  const snapPoints = ['100%'];

  const handlePresentModal = () => {
    bottomSheetModalRef.current?.present();
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; 
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
  
    return distance;
  };
  
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const addToQueue = async () => {
    try {
      setQueue([...queue, currentUserUid]);

      if (queue.length >= 2) {
        setIsLoading(true);
        await matchUsersAndNavigate();
      }
    } catch (error) {
      console.log('Error adding to queue:', error);
      setIsLoading(false);
    }
  };

  const removeFromQueue = (uid) => {
    setQueue(queue.filter((userUid) => userUid !== uid));
    setIsLoading(false);
    if (waitForMatchInterval) {
      clearInterval(waitForMatchInterval);
    }
  };

  const matchUsersAndNavigate = async () => {
    try {
      if (queue.length < 2) {
        console.log('Not enough users in the queue to match.');
        return;
      }
  
      const currentUserIndex = queue.findIndex((uid) => uid === currentUserUid);
      const otherUserIndex = (currentUserIndex + 1) % queue.length;
      const otherUserUid = queue[otherUserIndex];
  
      const currentUserDoc = await firebase
        .firestore()
        .collection('users')
        .doc(currentUserUid)
        .get();
      const otherUserDoc = await firebase
        .firestore()
        .collection('users')
        .doc(otherUserUid)
        .get();
  
      if (!currentUserDoc.exists || !otherUserDoc.exists) {
        console.log('One or both users not found.');
        return;
      }
  
      const currentUserData = currentUserDoc.data();
      const otherUserData = otherUserDoc.data();
  
      const currentUserLocation = {
        latitude: currentUserData.latitude,
        longitude: currentUserData.longitude,
      };
      const otherUserLocation = {
        latitude: otherUserData.latitude,
        longitude: otherUserData.longitude,
      };
  
      const currentUserInterests = currentUserData.interests || [];
      const otherUserInterests = otherUserData.interests || [];
  
      const interestsMatch = currentUserInterests.some((interest) =>
        otherUserInterests.includes(interest)
      );
  
      const distance = calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        otherUserLocation.latitude,
        otherUserLocation.longitude
      );
  
      if (distance <= 50 && interestsMatch) {
        const chatRoomId = await createOrUpdateChatRoom(currentUserUid, otherUserUid);
  
        setQueue([]);
        if (waitForMatchInterval) {
          clearInterval(waitForMatchInterval);
        }
        setIsLoading(false);
        navigation.navigate('Chat', { id: chatRoomId });
      } else {
        console.log('Users are not within a 50-mile radius or do not have matching interests.');
  
        const newInterval = setInterval(async () => {
          const newQueue = [...queue];
          const potentialUserIndex = newQueue.findIndex((uid) => uid !== currentUserUid);
  
          if (potentialUserIndex !== -1) {
            const potentialUserUid = newQueue[potentialUserIndex];
            const potentialUserDoc = await firebase
              .firestore()
              .collection('users')
              .doc(potentialUserUid)
              .get();
  
            if (potentialUserDoc.exists) {
              const potentialUserData = potentialUserDoc.data();
              const potentialUserLocation = {
                latitude: potentialUserData.latitude,
                longitude: potentialUserData.longitude,
              };
  
              const potentialUserInterests = potentialUserData.interests || [];
              const interestsMatch = currentUserInterests.some((interest) =>
                potentialUserInterests.includes(interest)
              );
  
              const newDistance = calculateDistance(
                currentUserLocation.latitude,
                currentUserLocation.longitude,
                potentialUserLocation.latitude,
                potentialUserLocation.longitude
              );
  
              if (newDistance <= 50 && interestsMatch) {
                clearInterval(newInterval);
  
                newQueue.splice(potentialUserIndex, 1);
                setQueue(newQueue);
  
                const chatRoomId = await createOrUpdateChatRoom(currentUserUid, potentialUserUid);
  
                setQueue([]);
                setIsLoading(false);
                navigation.navigate('Chat', { id: chatRoomId });
              }
            }
          }
          console.log("Checking for nearby users with similar interests")
        }, 5000);
  
        setWaitForMatchInterval(newInterval);
      }
    } catch (error) {
      console.log('Error matching users and navigating:', error);
    }
  };  

  const createOrUpdateChatRoom = async (user1Uid, user2Uid) => {
    try {
      const existingChatRooms = await firebase
        .firestore()
        .collection('chats')
        .where('users', '==', [user1Uid, user2Uid])
        .get();
  
      if (!existingChatRooms.empty) {
        const chatRoomId = existingChatRooms.docs[0].id;
        return chatRoomId;
      }
  
      const chatRoomRef = await firebase.firestore().collection('chats').add({
        users: [user1Uid, user2Uid],
        userCount: 2,
      });
  
      const chatRoomId = chatRoomRef.id;
      return chatRoomId;
    } catch (error) {
      console.log('Error creating or updating chat room:', error);
      throw error;
    }
  };
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUserUid = firebase.auth().currentUser.uid;
        const userSnapshot = await firebase
          .firestore()
          .collection('users')
          .doc(currentUserUid)
          .get();
    
        if (userSnapshot.exists) {
          const userData = userSnapshot.data();
          const name = userData.name;
          setUserName(name);
          setCurrentUserUid(currentUserUid)
    
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.log('Permission to access location was denied');
            return;
          }
    
          const location = await Location.getCurrentPositionAsync({});
          const userLatitude = location.coords.latitude;
          const userLongitude = location.coords.longitude;
          console.log('User Latitude:', userLatitude);
          console.log('User Longitude:', userLongitude);
        }
      } catch (error) {
        console.log('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, [currentUserUid]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Nexus',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { color: 'black' },
      headerTintColor: 'black',
      header: () => {
        return (
          <BottomSheetModalProvider>
            <View>
              <View style={styles.topHeaderContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <View style={{ alignItems: 'center' }}>
              </View>
                <View style={styles.iconsContainer}>
                  <TouchableOpacity onPress={handlePresentModal} style={styles.iconContainer}>
                    <Ionicons name="megaphone-outline" style={styles.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bottomHeaderContainer}>
                <TouchableOpacity style={styles.bottomIcon} onPress={() => navigation.navigate('Dashboard')}>
                  <Ionicons name='people-outline' style={styles.icon}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomIcon} onPress={() => navigation.navigate('NewChat')}>
                  <Ionicons name='globe-outline' style={styles.iconSelected}/>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheetModalProvider>
        );
      },      
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection('chats')
      .where('users', 'array-contains', firebase.auth().currentUser.uid)
      .onSnapshot(async (snapshot) => {
        const rooms = [];
        const timestamps = {};
        const messages = {};

        for (const doc of snapshot.docs) {
          const chatData = doc.data();
          const receiverId = chatData.users.find(
            (user) => user !== firebase.auth().currentUser.uid
          );

          const receiverSnapshot = await firebase
            .firestore()
            .collection('users')
            .doc(receiverId)
            .get();

          if (receiverSnapshot.exists) {
            const receiverData = receiverSnapshot.data();
            const room = {
              id: doc.id,
              avatar: receiverData.avatar,
              pseudonym: receiverData.pseudonym,
            };

            rooms.push(room);
            timestamps[doc.id] = chatData.timestamp;

            const messagesSnapshot = await firebase
              .firestore()
              .collection('chats')
              .doc(doc.id)
              .collection('messages')
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get();

            if (!messagesSnapshot.empty) {
              const latestMessage = messagesSnapshot.docs[0].data().message;
              const messageTimestamp = messagesSnapshot.docs[0].data().timestamp;
              messages[doc.id] = latestMessage;
              timestamps[doc.id] = messageTimestamp;
            }
          }
        }

        const sortedChatRooms = rooms.sort(
          (a, b) =>
            chatRoomTimestamps[b.id]?.toDate() - chatRoomTimestamps[a.id]?.toDate()
        );
        setChatRooms(sortedChatRooms);
        setChatRoomTimestamps(timestamps);
        setLatestMessages(messages);
      });

    return () => unsubscribe();
  }, [chatRooms, chatRoomTimestamps]);

  const formatTimestamp = (timestamp) => {
    if (timestamp) {
      const now = new Date();
      const messageDate = timestamp.toDate();
      const distance = formatDistanceToNow(messageDate, { addSuffix: true });

      if (
        messageDate < now &&
        Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000
      ) {
        const formatOptions = {
          yesterday: "'Yesterday'",
          addSuffix: true,
        };
        if (Math.abs(now - messageDate) >= 365 * 24 * 60 * 60 * 1000) {
          formatOptions.year = "'Year(s)'";
        } else if (Math.abs(now - messageDate) >= 30 * 24 * 60 * 60 * 1000) {
          formatOptions.month = "'Month(s)'";
        } else if (Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000) {
          formatOptions.day = "'Day(s)'";
        }
        return formatDistanceToNow(messageDate, formatOptions);
      }

      return distance;
    }
    return '';
  };

  const handleDeletePress = async (roomId) => {
    const currentUserUid = firebase.auth().currentUser.uid;
    
    const chatRoomRef = firebase.firestore().collection('chats').doc(roomId);
    const chatRoomSnapshot = await chatRoomRef.get();
  
    if (chatRoomSnapshot.exists) {
      const chatRoomData = chatRoomSnapshot.data();
  
      if (chatRoomData.users.length > 1) {
        const updatedUsers = chatRoomData.users.filter((user) => user !== currentUserUid);
  
        await chatRoomRef.update({
          users: updatedUsers,
          userCount: updatedUsers.length,
        });
      } else {
        await chatRoomRef.delete();
      }
    }
  };  

  const handleSwipeBegin = () => {
    setIsSwiping(true);
  };

  const [boxOpacity] = useState(new Animated.Value(0));

  const rightSwipe = (progress, roomId) => {
    let scale = 1;
  
    return (
      <View style={{marginLeft: 10}}>
        <TouchableOpacity onPress={() => handleDeletePress(roomId)}>
          <View style={{ transform: [{ scale: scale }] }}>
            <Ionicons name="trash-outline" style={styles.icon} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };  

  const renderChatRooms = () => {
    return chatRooms.map((room) => (
      <Swipeable
        key={room.id}
        renderRightActions={(progress, dragX) =>
          rightSwipe(progress, room.id)
        }
        onSwipeableWillBegin={handleSwipeBegin} 
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            !isSwiping && 
            navigation.navigate('Chat', {
              id: room.id,
              receiverName: room.pseudonym,
              receiverIcon: room.avatar,
            })
          }
        >
          <View style={styles.userInfo}>
            <View style={styles.singleImgWrapper}>
              <Image
                source={NexusImage}
                style={styles.userImg}
              />
            </View>
            <View style={styles.textSection}>
              <View style={styles.userInfoText}>
                <Text style={styles.userName}>{room.pseudonym}</Text>
                <Text style={styles.postTime}>{formatTimestamp(chatRoomTimestamps[room.id])}</Text>
              </View>
              <View>
                <Text numberOfLines={2} style={styles.messageText}>{latestMessages[room.id]}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    ));
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Chase size={80} color="#c581e7" />
        <Text>Waiting for another user...</Text>
        <TouchableOpacity style={styles.button} onPress={() => removeFromQueue(currentUserUid)}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <ScrollView>{renderChatRooms()}</ScrollView>
        <TouchableOpacity onPress={addToQueue} style={styles.button}>
          <View style={styles.buttonContent}>
            <Ionicons name="people" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Find nearby users...</Text>
          </View>
        </TouchableOpacity>
        <NavBar />
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
        >
          <Announcements />
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 5, 
    },
    card: {
      width: '100%',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    userImgWrapper: {
      marginRight: 10,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#c581e7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    singleImgWrapper: {
      marginRight: 10,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#ddb4f1',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userImg: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    letter: {
      fontSize: 24,
      color: '#fff',
      fontWeight: 'bold',
    },
    textSection: {
      flex: 1,
      justifyContent: 'center',
      borderBottomColor: '#cccccc',
      borderBottomWidth: 1,
    },
    userInfoText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    userName: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    messageText: {
      fontSize: 13,
      color: 'black',
    },
    postTime: {
      fontSize: 12,
      color: "#ee5b50",
      fontWeight: 'bold',
    },
    button: {
      position: 'absolute',
      bottom: 70, 
      left: 20,
      right: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#c581e7',
      height: 30,
      borderRadius: 30
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonIcon: {
      marginRight: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: 14,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'white',
    },
    logoContainer: {
      marginLeft: 16,
      marginTop: 10,
      marginBottom: 10
    },
    logoText: {
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'your-fancy-font', 
    },
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',

    },
    iconContainer: {
      marginLeft: 16,
      marginRight: 16,
    },
    bottomIcon: {
      marginLeft: 75,
      marginRight: 75,
    },
    icon: {
      fontSize: 24,
    },
    iconSelected: {
      fontSize: 24,
      color: '#c581e7'
    },
    topHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'white',
    },
    bottomHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'white',
      marginBottom: 10
    },  
    bottomSheetContent: {
      padding: 16,
    },
    messageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: '#ccc',
    },
    messageAvatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      marginTop: 10
    },
    messageAvatarText: {
      fontSize: 24,
      color: '#fff',
      fontWeight: 'bold',
    },
    messageTextContainer: {
      flex: 1,
      marginLeft: 10,
      marginRight: 10,
      borderBottomColor: '#cccccc',
    },
    announcementText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    deleteBox: {
        backgroundColor: 'red',
        width: 100,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },
      deleteText: {
        color: 'white',
        fontWeight: 'bold',
      },      
      headerImg: {
        marginRight: 10,
        width: 35,
        height: 35,
        borderRadius: 25,
        backgroundColor: '#c581e7',
        justifyContent: 'center',
        alignItems: 'center',
      },
      headerLetter: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
      },
      headerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
      },
      logo: {
        width: 100,
        height: 50,
        marginBottom: 5,
      },
  });

  export default NewChatBox