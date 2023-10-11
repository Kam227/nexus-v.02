import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import NavBar from '../components/NavBar';
import { firebase } from '../config';
import { AppState } from 'react-native';

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [fetchedNotificationItems, setFetchedNotificationItems] = useState([]);
  const [notificationItems, setNotificationItems] = useState([]);
  const [followStates, setFollowStates] = useState({});

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <FontAwesome name="times" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Notifications</Text>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const loadFollowStates = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;
          const userRef = firebase.firestore().collection('users').doc(currentUserID);

          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const userFollowStates = userDoc.data().followStates || {};
            setFollowStates(userFollowStates);
          }
        }
      } catch (error) {
        console.error('Error loading follow states:', error);
      }
    };

    loadFollowStates();
  }, []);

  useEffect(() => {
    const saveFollowStates = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;
          const userRef = firebase.firestore().collection('users').doc(currentUserID);

          await userRef.update({
            followStates: followStates
          });
        }
      } catch (error) {
        console.error('Error saving follow states:', error);
      }
    };

    saveFollowStates();
  }, [followStates]);

  const handleFollowBack = async (followUserId) => {
    try {
      const currentUser = firebase.auth().currentUser;
      const currentUserID = currentUser.uid;
  
      const userRef = firebase.firestore().collection('users').doc(currentUserID);
      const followUserRef = firebase.firestore().collection('users').doc(followUserId);
  
      const userDoc = await userRef.get();
      const userFollowing = userDoc.data().following || [];
      const isFollowing = userFollowing.includes(followUserId);
  
      if (isFollowing) {
        await userRef.update({
          following: firebase.firestore.FieldValue.arrayRemove(followUserId),
          mutuals: firebase.firestore.FieldValue.arrayRemove(followUserId)
        });
  
        await followUserRef.update({
          followers: firebase.firestore.FieldValue.arrayRemove(currentUserID),
          mutuals: firebase.firestore.FieldValue.arrayRemove(currentUserID)
        });

        setFollowStates(prevStates => ({
          ...prevStates,
          [followUserId]: false
        }));
      } else {
        await userRef.update({
          following: firebase.firestore.FieldValue.arrayUnion(followUserId)
        });
  
        await followUserRef.update({
          followers: firebase.firestore.FieldValue.arrayUnion(currentUserID)
        });
  
        const followUserDoc = await followUserRef.get();
        const followUserFollowing = followUserDoc.data().following || [];
  
        if (followUserFollowing.includes(currentUserID)) {

          await userRef.update({
            mutuals: firebase.firestore.FieldValue.arrayUnion(followUserId)
          });
  
          await followUserRef.update({
            mutuals: firebase.firestore.FieldValue.arrayUnion(currentUserID)
          });
        }

        setFollowStates(prevStates => ({
          ...prevStates,
          [followUserId]: true
        }));
      }
    } catch (error) {
      console.error('Error handling follow back:', error);
    }
  }; 

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;

          const userRef = firebase.firestore().collection('users').doc(currentUserID);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const userNotifications = userDoc.data().notifications || [];
            setNotifications(userNotifications);
          } else {
            console.log('User not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

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

  useEffect(() => {
    const fetchUserNames = async () => {
      const items = [];
      for (const notification of notifications) {
        const { type, commenterId, commentText, postId, announcementId, seenBy, follow, sender, announcer, announcement } = notification;
        let notificationContent = null;
  
        if (type === 'comment') {
          const commenterName = await fetchPseudonymName(commenterId);
          const avatarInitial = getAvatarInitial(commenterName);
          notificationContent = (
            <View style={styles.notificationContainer}>
              <TouchableOpacity onPress={() => postNav(postId)}>
                <View style={styles.notificationContent}>
                  <TouchableOpacity onPress={() => navigation.navigate('FriendProfile', {userId: commenterId })}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>{avatarInitial}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.textContainer}>
                    <Text style={styles.notificationName}>{commenterName}</Text>
                    <Text style={styles.notificationDescriptor}>commented on your post</Text>
                    <Text numberOfLines={1} style={styles.notificationText}>{commentText}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        } else if (type === 'announcementSeen') {
          const seenByName = await fetchUserName(seenBy);
          const avatarInitial = getAvatarInitial(seenByName);
          notificationContent = (
            <View style={styles.notificationContainer}>
              <View style={styles.notificationContent}>
                <TouchableOpacity onPress={() => navigation.navigate('FriendProfile', {userId: seenBy })}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{avatarInitial}</Text>
                  </View> 
                </TouchableOpacity>
                <View style={styles.textContainer}>
                  <Text style={styles.notificationName}>{seenByName}</Text>
                  <Text style={styles.notificationDescriptor}>has seen your announcement!</Text>
                </View>
              </View>
            </View>
          );
        } else if (type === 'follow') {
          const followName = await fetchUserName(follow);
          const avatarInitial = getAvatarInitial(followName);
          const isFollowing = followStates[follow];
          
          notificationContent = (
            <View style={styles.notificationContainer}>
              <View style={styles.notificationContent}>
                <TouchableOpacity onPress={() => navigation.navigate('FriendProfile', {userId: follow })}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{avatarInitial}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.textContainer}>
                  <Text style={styles.notificationName}>{followName}</Text>
                  <Text style={styles.notificationDescriptor}>started following you!</Text>
                </View>
                <View style={styles.followContent}>
                  <TouchableOpacity
                    style={styles.followButton}
                    onPress={() => handleFollowBack(follow)}
                  >
                    <Text style={styles.followButtonText}>
                      {isFollowing ? 'Following' : 'Follow Back'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        } else if (type === 'announcement') {
          const announcerName = await fetchUserName(announcer);
          
          notificationContent = (
            <View style={styles.notificationContainer}>
              <TouchableOpacity onPress={() => announcementNav(announcementId)}>
                <View style={styles.notificationContent}>
                  <View style={styles.avatarContainerA}>
                    <Ionicons name="megaphone-outline" style={styles.icon} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.notificationName}>{announcerName}</Text>
                    <Text style={styles.notificationDescriptor}>has made an announcement!</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        } else if (type === 'shares') {
          const senderName = await fetchUserName(sender);
          
          notificationContent = (
            <View style={styles.notificationContainer}>
              <TouchableOpacity onPress={() => postNav(postId)}>
                <View style={styles.notificationContent}>
                  <View style={styles.avatarContainerS}>
                  <Ionicons name="mail-outline" style={styles.icon} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.notificationName}>{senderName}</Text>
                    <Text style={styles.notificationDescriptor}>shared a post with you!</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        } else if (type === 'announcementMade') {
          const announcerName = await fetchUserName(announcer);
          
          notificationContent = (
            <View style={styles.notificationContainer}>
              <TouchableOpacity onPress={() => announcementNav(announcementId)}>
                <View style={styles.notificationContent}>
                  <View style={styles.avatarContainerM}>
                    <Ionicons name="megaphone-outline" style={styles.icon} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.notificationName}>View your announcement</Text>
                    <Text style={styles.notificationText} numberOfLines={1}>{announcement}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }
  
        items.push({
          notificationContent,
          id: notification.key,
          type,
          postId, 
        });
      }
  
      setFetchedNotificationItems(items);
    };
  
    fetchUserNames();
  }, [notifications, followStates]);

  useEffect(() => {
    setNotificationItems(fetchedNotificationItems);
  }, [fetchedNotificationItems]);

  const fetchUserName = async (userID) => {
    try {
      const userRef = firebase.firestore().collection('users').doc(userID);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userName = userDoc.data().name;
        return userName;
      } else {
        console.log('User not found');
        return '';
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      return '';
    }
  };

  const fetchPseudonymName = async (userID) => {
    try {
      const userRef = firebase.firestore().collection('users').doc(userID);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userPseudonym = userDoc.data().pseudonym;
        return userPseudonym;
      } else {
        console.log('User not found');
        return '';
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      return '';
    }
  };

  const getAvatarInitial = (name) => {
    const words = name.split(' ');
    let initials = '';

    for (let i = 0; i < words.length; i++) {
      initials += words[i][0];
    }

    return initials.toUpperCase();
  };

  const postNav = (postId, item) => {
      navigation.navigate('Post', { postId: postId });
  };

  const announcementNav = (announcementId, item) => {
    navigation.navigate('AnnouncementsScreen', {
      announcementId: announcementId,
    });
  };

  const renderNotificationItem = ({ item, index }) => {
    return (
      <View style={styles.notificationItem} key={item.id}>
        {index !== 0 && <View style={styles.notificationLine} />}
        {item.notificationContent}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notificationItems}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id} 
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    marginBottom: 3,
  },
  notificationLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  notificationContainer: {
    borderRadius: 8,
    padding: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainerA: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ed6568',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainerS: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f7e547',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainerM: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8fd4a2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  notificationName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  notificationDescriptor: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  notificationText: {
    fontSize: 13,
    fontWeight: 'normal',
    color: 'gray'
  },
  followContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  followButton: {
    backgroundColor: '#c581e7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  followingButton: {
    backgroundColor: '#ddb4f1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20
  },
  headerText: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  headerButton: {
    marginRight: 16,
  },
  icon: {
    fontSize: 22,
    color: 'white'
  },
  
});

export default Notifications;