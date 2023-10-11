import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { firebase } from '../config';

export const ProfileBody = ({
  name,
  username,
  bio,
  id,
}) => {

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{name ? name[0].toUpperCase() : '?'}</Text>
        </View>
      </View>
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>{name ? name : `user-${id}`}</Text>
      </View>
      <View>
        <Text>{username}</Text>
      </View>
      <View>
        <Text>{bio}</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingVertical: 10,
        }}>
      </View>
    </View>
  );
};

const MutualTag = ({ userID }) => {
  const [isMutual, setIsMutual] = useState(false);

  useEffect(() => {
    const fetchMutualStatus = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;

          const docRef = firebase.firestore().collection('users').doc(currentUserID);
          const doc = await docRef.get();

          if (doc.exists) {
            const userMutuals = doc.data().mutuals || [];
            setIsMutual(userMutuals.includes(userID));
          } else {
            console.log('Document not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching mutual status:', error);
      }
    };

    fetchMutualStatus();
  }, [userID]);

  return (
    <>
      {isMutual && (
        <FontAwesome5
          name="handshake"
          style={{
            fontSize: 16,
            color: '#3493D9',
            marginLeft: 5,
          }}
        />
      )}
    </>
  );
};

export const ProfileButtons = ({ id }) => {
  const [follow, setFollow] = useState(false);
  const [currentUserID, setCurrentUserID] = useState('');
  const [isMutual, setIsMutual] = useState(false);
  const [mutualsCount, setMutualsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    const fetchMutualsCount = async () => {
      try {
        const userRef = firebase.firestore().collection('users').doc(id);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userMutuals = userDoc.data().mutuals || [];
          setMutualsCount(userMutuals.length);
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.error('Error fetching mutuals count:', error);
      }
    };

    const fetchPostsCount = async () => {
      try {
        const userRef = firebase.firestore().collection('users').doc(id);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userPosts = userDoc.data().posts || [];
          setPostsCount(userPosts.length);
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.error('Error fetching posts count:', error);
      }
    };

    fetchMutualsCount();
    fetchPostsCount();
  }, [id]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          setCurrentUserID(currentUser.uid);

          const currentUserRef = firebase.firestore().collection('users').doc(currentUser.uid);
          const currentUserDoc = await currentUserRef.get();

          if (currentUserDoc.exists) {
            const following = currentUserDoc.data().following || [];
            setFollow(following.includes(id));
          } else {
            console.log('User not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    const fetchMutualStatus = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;

          const currentUserRef = firebase.firestore().collection('users').doc(currentUserID);
          const currentUserDoc = await currentUserRef.get();

          if (currentUserDoc.exists) {
            const currentUserMutuals = currentUserDoc.data().mutuals || [];
            setIsMutual(currentUserMutuals.includes(id));
          } else {
            console.log('User not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching mutual status:', error);
      }
    };

    fetchFollowStatus();
    fetchMutualStatus();
  }, [id]);

  const followUser = async () => {
    try {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        const currentUserID = currentUser.uid;
        const receiverID = id;
  
        const currentUserRef = firebase.firestore().collection('users').doc(currentUserID);
        const receiverRef = firebase.firestore().collection('users').doc(receiverID);
  
        const [currentUserDoc, receiverDoc] = await Promise.all([currentUserRef.get(), receiverRef.get()]);
        if (currentUserDoc.exists && receiverDoc.exists) {
          const currentUserFollowing = currentUserDoc.data().following || [];
          const receiverFollowing = receiverDoc.data().following || [];
          const currentUserFollowers = currentUserDoc.data().followers || [];
          const receiverFollowers = receiverDoc.data().followers || [];
          const currentUserMutuals = currentUserDoc.data().mutuals || [];
          const receiverMutuals = receiverDoc.data().mutuals || [];
          const currentUserNotifications = currentUserDoc.data().notifications || [];
          const receiverNotifications = receiverDoc.data().notifications || [];
  
          const isCurrentUserFollowingReceiver = currentUserFollowing.includes(receiverID);
          const isReceiverFollowingCurrentUser = receiverFollowers.includes(currentUserID);
  
          if (follow && isCurrentUserFollowingReceiver && isReceiverFollowingCurrentUser) {
            const currentUserFollowIndex = currentUserFollowing.indexOf(receiverID);
            const receiverFollowerIndex = receiverFollowers.indexOf(currentUserID);
            const currentUserMutualsIndex = currentUserMutuals.indexOf(receiverID);
            const receiverMutualsIndex = receiverMutuals.indexOf(currentUserID);
  
            currentUserFollowing.splice(currentUserFollowIndex, 1);
            receiverFollowers.splice(receiverFollowerIndex, 1);
            currentUserMutuals.splice(currentUserMutualsIndex, 1);
            receiverMutuals.splice(receiverMutualsIndex, 1);
  
            const seenNotificationIndex = receiverNotifications.findIndex(
              (notification) => notification.type === 'follow' && notification.follow === currentUserID
            );
            if (seenNotificationIndex !== -1) {
              receiverNotifications.splice(seenNotificationIndex, 1);
            }
          } else if (!follow) {
            currentUserFollowing.push(receiverID);
            receiverFollowers.push(currentUserID);
  
            const seenNotificationIndex = receiverNotifications.findIndex(
              (notification) => notification.type === 'follow' && notification.follow === currentUserID
            );
            if (seenNotificationIndex === -1) {
              receiverNotifications.push({
                type: 'follow',
                follow: currentUserID,
              });
            }
  
            const isReceiverFollowingCurrentUser = receiverFollowers.includes(currentUserID);
            const isCurrentUserFollowingReceiver = receiverFollowing.includes(currentUserID);            
            if (isReceiverFollowingCurrentUser && isCurrentUserFollowingReceiver) {
              currentUserMutuals.push(receiverID);
              receiverMutuals.push(currentUserID);
              setIsMutual(true);
            }
          }
  
          await currentUserRef.update({ following: currentUserFollowing, mutuals: currentUserMutuals });
          await receiverRef.update({ followers: receiverFollowers, mutuals: receiverMutuals });
  
          await receiverRef.update({ notifications: receiverNotifications });
  
          setFollow(!follow);
        } else {
          console.log('User not found');
        }
      } else {
        console.log('User not logged in');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };  

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPress={followUser} style={{ width: '42%' }}>
          <View
            style={{
              width: '100%',
              height: 35,
              borderRadius: 3,
              backgroundColor: follow ? null : '#c581e7',
              borderWidth: follow ? 2 : 0,
              borderColor: '#c581e7',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ color: follow ? 'black' : 'white' }}>
              {follow ? 'Unfollow' : 'Follow'}
            </Text>
            {isMutual && <FontAwesome5 name="handshake" style={{ fontSize: 16, color: '#c581e7', marginLeft: 5 }} />}
          </View>
        </TouchableOpacity>
        <View style={{ width: '10%', height: 35, borderWidth: 1, borderColor: '#DEDEDE', justifyContent: 'center', alignItems: 'center', borderRadius: 5, marginLeft: 5  }}>
          <Feather name="chevron-down" style={{ fontSize: 20, color: 'black' }} />
        </View>
      </View>
      <View style={styles.userInfoWrapper}>
        <View style={styles.userInfoItem}>
          <Text style={styles.userInfoTitle}>{postsCount}</Text>
          <Text style={styles.userInfoSubTitle}>Posts</Text>
        </View>
        <View style={styles.userInfoItem}>
          <Text style={styles.userInfoTitle}>{mutualsCount}</Text>
          <Text style={styles.userInfoSubTitle}>Mutuals</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 5,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#eee',
  },
  nameContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  followButton: {
    width: '42%',
  },
  followButtonInner: {
    width: '100%',
    height: 35,
    borderRadius: 5,
    backgroundColor: '#c581e7',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  unfollowButton: {
    backgroundColor: null,
    borderWidth: 0,
  },
  followButtonText: {
    color: 'white',
  },
  mutualIcon: {
    fontSize: 16,
    color: '#43d6e3',
    marginLeft: 5,
  },
  dropdownButton: {
    width: '10%',
    height: 35,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  dropdownIcon: {
    fontSize: 20,
    color: 'black',
  },
  userInfoWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  userInfoItem: {
    justifyContent: 'center',
  },
  userInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  userInfoSubTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});