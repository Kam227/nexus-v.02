import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, ScrollView, useLayoutEffect } from 'react-native';
import { firebase } from '../config';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import NavBar from '../components/NavBar';
import Announcements from '../components/Announcements';
import AnnouncementsNavigator from '../components/AnnouncementsNavigator';
import { formatDistanceToNow } from 'date-fns';
import logo from '../images/logoDark.png';
import { AppState } from 'react-native';

const Dashboard = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [mutuals, setMutuals] = useState([]);
  const [mutualUsers, setMutualUsers] = useState([]);
  const [privateChatRooms, setPrivateChatRooms] = useState([]);
  const [privateChatRoomTimestamps, setPrivateChatRoomTimestamps] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestMessageSenders, setLatestMessageSenders] = useState({});
  const [currentUserUid, setCurrentUserUid] = useState('');
  const [receiverId, setReceiverId] = useState('');

  const bottomSheetModalRef = React.useRef(null);

  const snapPoints = ['100%'];

  const handlePresentModal = () => {
    bottomSheetModalRef.current?.present();
  };
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          setCurrentUserUid(currentUser.uid);
          const userSnapshot = await firebase
            .firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();
    
          if (userSnapshot.exists) {
            const userData = userSnapshot.data();
            const name = userData.name;
            setUserName(name);
          }
        }
      } catch (error) {
        console.log('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, []);

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
                  <Ionicons name='people-outline' style={styles.iconSelected}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomIcon} onPress={() => navigation.navigate('NewChat')}>
                  <Ionicons name='globe-outline' style={styles.icon}/>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheetModalProvider>
        );
      },      
    });
  }, [navigation]);
  
  useEffect(() => {
    const currentUserUid = firebase.auth().currentUser.uid;
  
    const unsubscribe = firebase
      .firestore()
      .collection('users')
      .doc(currentUserUid)
      .onSnapshot(async (snapshot) => {
        const userData = snapshot.data();
        const mutuals = userData.mutuals || [];
  
        const rooms = [];
        const timestamps = {};
        const messages = {}; 
  
        for (const userId of mutuals) {
          const chatRoomsCollection = firebase.firestore().collection('privateChatRooms');
  
          const sortedUserIds = [currentUserUid, userId].sort();
  
          const querySnapshot = await chatRoomsCollection
            .where('users', '==', sortedUserIds)
            .get();
  
          let roomId;
          if (querySnapshot.empty) {
            const chatRoomRef = await chatRoomsCollection.add({
              users: sortedUserIds,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
            });
            roomId = chatRoomRef.id;
          } else {
            roomId = querySnapshot.docs[0].id;
            const chatRoomData = querySnapshot.docs[0].data();
            timestamps[roomId] = chatRoomData.timestamp; 
            const messagesSnapshot = await firebase
              .firestore()
              .collection('privateChatRooms')
              .doc(roomId)
              .collection('messages')
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get();
  
              if (!messagesSnapshot.empty) {
                const latestMessage = messagesSnapshot.docs[0].data().message;
                const latestMessageSender = messagesSnapshot.docs[0].data().userId;
                messages[roomId] = latestMessage;
              
                setLatestMessageSenders((prevSenders) => ({
                  ...prevSenders,
                  [roomId]: latestMessageSender,
                }));

                setCurrentUserUid(currentUserUid);
              }
          }
  
          const userSnapshot = await firebase
            .firestore()
            .collection('users')
            .doc(userId)
            .get();
  
          if (userSnapshot.exists) {
            const userData = userSnapshot.data();
            const room = {
              id: roomId,
              name: userData.name,
            };
            rooms.push(room);
          }

          const receiverSnapshot = await firebase
          .firestore()
          .collection('users')
          .doc(userId)
          .get();
      
          if (receiverSnapshot.exists) {
            setReceiverId(userId);
          }
        }
  
        const sortedPrivateChatRooms = rooms.sort(
          (a, b) => privateChatRoomTimestamps[b.id]?.toDate() - privateChatRoomTimestamps[a.id]?.toDate()
        );
        setPrivateChatRooms(sortedPrivateChatRooms);
        setPrivateChatRoomTimestamps(timestamps);
        setLatestMessages((prevMessages) => ({ ...prevMessages, ...messages }));
      });
  
    return () => unsubscribe();
  }, [privateChatRooms, privateChatRoomTimestamps, currentUserUid]);  

  useEffect(() => {
    const currentUserUid = firebase.auth().currentUser.uid;
    const unsubscribe = firebase
      .firestore()
      .collection('users')
      .doc(currentUserUid)
      .onSnapshot((snapshot) => {
        const userData = snapshot.data();
        const mutualUserIds = userData.mutuals || [];
        setMutuals(mutualUserIds);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (mutuals.length > 0) {
      const unsubscribe = firebase
        .firestore()
        .collection('users')
        .where(firebase.firestore.FieldPath.documentId(), 'in', mutuals)
        .onSnapshot((snapshot) => {
          const users = [];
          snapshot.forEach((doc) => {
            const user = doc.data();
            users.push(user);
          });
          setMutualUsers(users);
        });

      return () => unsubscribe();
    }
  }, [mutuals]);

  const formatTimestamp = (timestamp) => {
    if (timestamp) {
      const now = new Date();
      const messageDate = timestamp.toDate();
      const distance = formatDistanceToNow(messageDate, { addSuffix: true });
  
      if (messageDate < now && Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000) {
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
  
  const getFirstLetter = (name) => {
    if (name && name.length > 0) {
      return name[0].toUpperCase();
    }
    return '';
  };

  const archiveExpiredPosts = async () => {
    const currentUser = firebase.auth().currentUser;
    const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    const userPosts = userDoc.data().posts || [];
  
    const currentDate = new Date();
    const db = firebase.firestore();
    const batch = db.batch();
    const userRef = db.collection('users').doc(currentUser.uid);
    const groupChatRoomsCollection = db.collection('groupChatRooms');
    const archivedGroupChatRoomsCollection = db.collection('archivedGroupChatRooms');
  
    userPosts.forEach((post) => {
      const postEndTime = new Date(post.date + ' ' + post.timeEnd);
      if (postEndTime < currentDate) {
        const archivedPost = { ...post };
  
        const archivedPostRef = archivedGroupChatRoomsCollection.doc(post.postId);
        batch.set(archivedPostRef, archivedPost);
  
        batch.update(userRef, {
          archives: firebase.firestore.FieldValue.arrayUnion(post),
        });
  
        batch.update(userRef, {
          posts: firebase.firestore.FieldValue.arrayRemove(post),
        });
  
        const postRef = groupChatRoomsCollection.doc(post.postId);
        batch.delete(postRef);
      }
    });
  
    await batch.commit();
  };

  const archiveInterval = setInterval(archiveExpiredPosts, 90000);

  archiveExpiredPosts();

  useEffect(() => {
    return () => {
      clearInterval(archiveInterval);
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      const backgroundArchiveInterval = setInterval(archiveExpiredPosts, 900000);

      return () => {
        clearInterval(backgroundArchiveInterval);
      };
    }
  };

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove(); 
    };
  }, []);

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <ScrollView>
        {privateChatRooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('Chat', { id: room.id, receiverName: room.name, receiverIcon: room.avatar })}
          >
            <View style={styles.userInfo}>
              <TouchableOpacity onPress={() => navigation.navigate('FriendProfile', {userId: receiverId })}>
                <View style={styles.userImgWrapper}>
                  <Text style={styles.letter}>{getFirstLetter(room.name)}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.textSection}>
                <View style={styles.userInfoText}>
                  <Text style={styles.userName}>{room.name}</Text>
                  <Text style={styles.postTime}>{formatTimestamp(privateChatRoomTimestamps[room.id])}</Text>
                </View>
                <View>
                  <Text numberOfLines={2} style={styles.messageText}>{latestMessages[room.id]}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        </ScrollView>
        <NavBar />
        <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
      >
        <AnnouncementsNavigator /> 
      </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    top: 5,
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
  buttonContainer: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
    height: 70,
    width: 250,
    backgroundColor: '#c581e7',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
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
    paddingVertical: 5,
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
  logo: {
    width: 100,
    height: 50,
    marginBottom: 5,
  },
});