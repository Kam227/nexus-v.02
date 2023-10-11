import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { firebase } from '../config';
import { FontAwesome, Feather } from '@expo/vector-icons';

const AnnouncementsScreen = ({ navigation, route }) => {
  const { announcementId, announcer, announcement } = route.params;
  const [currentUserUid, setCurrentUserUid] = useState('')
  const [commenterNames, setCommenterNames] = useState({});
  const [isSeen, setIsSeen] = useState(null);
  const [isIgnored, setIsIgnored] = useState(null);
  const [announcementData, setAnnouncementData] = useState(null);
  const [announcerData, setAnnouncerData] = useState(null);
  const [comment, setComment] = useState('');

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.headerButton}>
        <TouchableOpacity onPress={goBack}>
          <FontAwesome name="times" size={24} color="#000" />
        </TouchableOpacity>

      {currentUserUid !== announcer ? (
        <TouchableOpacity onPress={() => navigation.navigate('AnnouncementSettings', {announcementId: announcementId})}>
          <Feather name="feather" size={22} color="#000" />
        </TouchableOpacity>
      ) : null}
        </View>

      ),
    });
  }, [navigation]);

  useEffect(() => {
    const fetchAnnouncementData = async () => {
      try {
        const announcementRef = firebase.firestore().collection('announcements').doc(announcementId);
        const announcementDoc = await announcementRef.get();
  
        if (announcementDoc.exists) {
          const data = announcementDoc.data();
          setAnnouncementData(data);
          setIsSeen(data.seen?.includes(currentUserUid) || false);
          setIsIgnored(data.ignore?.includes(currentUserUid) || false);
  
          const announcerId = data.announcerId;
          const announcerRef = firebase.firestore().collection('users').doc(announcerId);
          const announcerDoc = await announcerRef.get();
  
          if (announcerDoc.exists) {
            setAnnouncerData(announcerDoc.data());
          } else {
            console.log('Announcer document does not exist');
          }
  
          const perms = data.perms || [];
        } else {
          console.log('Announcement document does not exist');
        }
      } catch (error) {
        console.log('Error fetching announcement data:', error);
      }
    };
  
    const currentUserUid = firebase.auth().currentUser.uid;
    fetchAnnouncementData();
  }, [announcementId]);

  useEffect(() => {
    const fetchCommenterNames = async () => {
      try {
        const names = {};
        for (const commentItem of announcementData.comments) {
          const commenterName = await fetchUserName(commentItem.userId);
          names[commentItem.userId] = commenterName;
        }
        setCommenterNames(names);
      } catch (error) {
        console.log('Error fetching commenter names:', error);
      }
    };
  
    if (announcementData && announcementData.comments) {
      fetchCommenterNames();
    }
  }, [announcementData]);

  const handleSeenPress = async () => {
    try {
      const currentUserUid = firebase.auth().currentUser.uid;
      setCurrentUserUid(currentUserUid)
      const announcementRef = firebase.firestore().collection('announcements').doc(announcementId);

      await announcementRef.update({
        seen: firebase.firestore.FieldValue.arrayUnion(currentUserUid),
        ignore: firebase.firestore.FieldValue.arrayRemove(currentUserUid),
      });

      setIsSeen(true);
      setIsIgnored(false);

      if (currentUserUid !== announcementData.announcer) {
        const announcerRef = firebase.firestore().collection('users').doc(announcementData.announcer);

        announcerRef.get().then((doc) => {
          if (doc.exists) {
            const announcerData = doc.data();
            const updatedNotifications = announcerData.notifications || [];
            const seenIndex = updatedNotifications.findIndex(
              (notification) =>
                notification.announcementId === announcementId &&
                notification.seenBy === currentUserUid
            );

            if (seenIndex === -1) {
              updatedNotifications.push({
                type: 'announcementSeen',
                announcementId,
                seenBy: currentUserUid,
              });

              announcerRef.update({ notifications: updatedNotifications });
            }
          } else {
            console.log('Announcer document does not exist');
          }
        }).catch((error) => {
          console.log('Error fetching announcer document:', error);
        });
      }
    } catch (error) {
      console.log('Error updating announcement:', error);
    }
  };

  const handleIgnorePress = async () => {
    try {
      const currentUserUid = firebase.auth().currentUser.uid;
      const announcementRef = firebase.firestore().collection('announcements').doc(announcementId);

      await announcementRef.update({
        ignore: firebase.firestore.FieldValue.arrayUnion(currentUserUid),
        seen: firebase.firestore.FieldValue.arrayRemove(currentUserUid),
      });

      setIsSeen(false);
      setIsIgnored(true);

      if (currentUserUid !== announcementData.announcer) {
        const announcerRef = firebase.firestore().collection('users').doc(announcementData.announcer);

        announcerRef.get().then((doc) => {
          if (doc.exists) {
            const announcerData = doc.data();
            const updatedNotifications = announcerData.notifications || [];
            const seenIndex = updatedNotifications.findIndex(
              (notification) =>
                notification.announcementId === announcementId &&
                notification.seenBy === currentUserUid
            );

            if (seenIndex !== -1) {
              updatedNotifications.splice(seenIndex, 1);
              announcerRef.update({ notifications: updatedNotifications });
            }
          } else {
            console.log('Announcer document does not exist');
          }
        }).catch((error) => {
          console.log('Error fetching announcer document:', error);
        });
      }
    } catch (error) {
      console.log('Error updating announcement:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (comment && announcementData) {
      try {
        const currentUserUid = firebase.auth().currentUser.uid;
        const announcementRef = firebase.firestore().collection('announcements').doc(announcementId);
  
        await announcementRef.update({
          comments: firebase.firestore.FieldValue.arrayUnion({
            userId: currentUserUid,
            text: comment,
          }),
        });
  
        setAnnouncementData(prevData => ({
          ...prevData,
          comments: [
            ...(prevData.comments || []),
            { userId: currentUserUid, text: comment },
          ],
        }));
  
        setComment('');
      } catch (error) {
        console.log('Error updating announcement with comment:', error);
      }
    }
  };

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
  
  return (
  <ScrollView contentContainerStyle={styles.container}>
      {announcementData && (
        <View style={styles.postContainer}>
          <Text style={styles.postText}>{announcementData.text}</Text>
        </View>
      )}

{ currentUserUid === announcer ?  (
  <View style={styles.buttonContainer}>
    <TouchableOpacity
      onPress={handleSeenPress}
    >
      <FontAwesome name="check" size={18} color={isSeen ? '#c581e7' : '#8fd4a2'} />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={handleIgnorePress}
    >
      <FontAwesome name="times" size={18} color={isIgnored ? '#c581e7' : '#ee5b50'} />
    </TouchableOpacity>
  </View>
) : null }     

      <View style={styles.separatorLine} />

      <View style={styles.commentContainer}>
        <Text style={styles.commentHeader}>Comments:</Text>
  <ScrollView style={styles.commentsContainer}>
    {announcementData && announcementData.comments ? (
      announcementData.comments.map((commentItem, index) => {
        const commenter = commentItem.userId;
        const commenterName = commenterNames[commenter] || 'Loading...';
        const avatarInitial = commenterName ? commenterName.charAt(0) : '';
        const showCrown = announcementData.perms?.includes(currentUserUid);

        return (
          <View key={index} style={styles.commentItem}>
            <View style={styles.commentAvatarContainer}>
              <Text style={styles.crownIcon}>{!showCrown ? '👑' : null }</Text>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
              <Text style={styles.commenterName}>
                {commenterName}
              </Text>
            </View>
            <View style={styles.commentContent}>
              <Text>{commentItem.text}</Text>
            </View>
          </View>
        );
      })
    ) : (
      <Text>No comments available.</Text>
    )}
  </ScrollView>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Leave a comment..."
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity style={styles.commentButton} onPress={handleCommentSubmit}>
            <FontAwesome name="send" size={20} color="#fff" style={{padding: 3}}/>
          </TouchableOpacity>
        </View>
      </View>
  </ScrollView>
  );
};

const styles = {
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    minHeight: 50,
  },
  postText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separatorLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  commentContainer: {
    width: '100%',
  },
  commentHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentsContainer: {
    padding: 10,
    borderRadius: 5,
  },
  commentItem: {
    marginBottom: 10,
    paddingBottom: 5,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  commentButton: {
    backgroundColor: '#c581e7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    width: '80%',
  },
  headerButton: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  commentAvatarContainer: {
    position: 'relative', 
    marginRight: 10,
    alignItems: 'center',
  },
  crownIcon: {
    position: 'absolute', 
    top: -8,
    left: -8,
    fontSize: 20,
    transform: [{ rotate: '-20deg' }], 
    zIndex: 1, 
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: 'white',
  },
  commenterName: {
    marginTop: 5,
  },
  commentContent: {
    flex: 1,
  },
};

export default AnnouncementsScreen