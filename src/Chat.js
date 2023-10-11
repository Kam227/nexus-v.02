import React, { useLayoutEffect, useState, useEffect } from 'react';
import { TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { StyleSheet, Text, View, TextInput, ScrollView } from 'react-native';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { firebase } from '../config';
import { AppState } from 'react-native';

const Chat = ({ navigation, route }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isPrivateChat, setIsPrivateChat] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null); 
  const [otherUserName, setOtherUserName] = useState(''); 
  const [otherUserPseudonym, setOtherUserPseudonym] = useState(''); 
  const { receiverName, receiverIcon } = route.params;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = firebase.auth().currentUser.uid;
        const userSnapshot = await firebase.firestore().collection('users').doc(userId).get();

        if (userSnapshot.exists) {
          const userData = userSnapshot.data();
          setOtherUserName(userData.name);
          setOtherUserPseudonym(userData.pseudonym);
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Chat',
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTitle}>{receiverName ? receiverName[0] : ''}</Text>
          </View>
          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>{receiverName}</Text>
          </View>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            navigation.navigate('Dashboard');
          }}
        >
          <AntDesign name='arrowleft' size={24} color='black' />
        </TouchableOpacity>
      ),
    });
  }, [navigation, route]); 

  useLayoutEffect(() => {
    const privateChatRoomsRef = firebase.firestore().collection('privateChatRooms');
    const chatRoomId = route.params.id;

    const privateChatUnsubscribe = privateChatRoomsRef
      .doc(chatRoomId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) =>
        setMessages(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          }))
        )
      );

    return () => {
      privateChatUnsubscribe();
    };
  }, [route]);

  useLayoutEffect(() => {
    const chatsRef = firebase.firestore().collection('chats');
    const chatRoomId = route.params.id;

    const chatsUnsubscribe = chatsRef
      .doc(chatRoomId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) =>
        setMessages(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          }))
        )
      );

    return () => {
      chatsUnsubscribe();
    };
  }, [route]);

  const sendMessage = () => {
    Keyboard.dismiss();

    if (!firebase.auth().currentUser) {
      console.log('User not authenticated');
      return;
    }

    if (input) {
      const chatRoomsRef = firebase.firestore().collection('chats');
      const privateChatRoomsRef = firebase.firestore().collection('privateChatRooms');
      const chatRoomId = route.params.id;
      const userId = firebase.auth().currentUser.uid;
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();

      const messageData = {
        timestamp: timestamp,
        message: input,
        userId: userId,
      };

      const chatRoomRef = chatRoomsRef.doc(chatRoomId);
      const privateChatRoomRef = privateChatRoomsRef.doc(chatRoomId);

      const batch = firebase.firestore().batch();
      batch.set(chatRoomRef.collection('messages').doc(), messageData);

      privateChatRoomRef.get().then((docSnapshot) => {
        if (docSnapshot.exists) {
          batch.set(privateChatRoomRef.collection('messages').doc(), messageData);
          batch.update(privateChatRoomRef, { timestamp: timestamp });
        } else {
          batch.set(privateChatRoomRef, { timestamp: timestamp });
          batch.set(privateChatRoomRef.collection('messages').doc(), messageData);
        }

        batch
          .commit()
          .then(() => {
            setInput('');
          })
          .catch((error) => {
            console.log('Error sending message: ', error);
          });
      });
    }
  };

  const handleInputChange = (text) => {
    setInput(text);
  };

  const renderChatMessage = ({ id, data }) => {
    const isCurrentUser = data.userId === firebase.auth().currentUser?.uid;
    const chatContainerStyle = isCurrentUser ? styles.currentUserChatContainer : styles.receiverChatContainer;
    const textStyle = isCurrentUser ? styles.currentUserText : styles.receiverText;
    const alignStyle = isCurrentUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' };
    const senderName = isCurrentUser ? null : (
      <Text style={styles.senderName}>{isPrivateChat ? otherUserPseudonym : otherUserName}</Text>
    );
  
    const timestamp = data.timestamp?.toDate(); 
    const time = timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
    return (
      <View key={id} style={[styles.messageContainer, chatContainerStyle, alignStyle]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarTitle}>{isPrivateChat ? otherUserPseudonym[0] : otherUserName[0]}</Text>
        </View>
        <Text style={[styles.messageText, textStyle]}>{data.message}</Text>
        <Text style={{ fontSize: 10, ...alignStyle }}>{time}</Text>
      </View>
    );
  };

  const checkPrivateChat = () => {
    const chatRoomsRef = firebase.firestore().collection('chats');
    const chatRoomId = route.params.id;

    chatRoomsRef
      .doc(chatRoomId)
      .get()
      .then((docSnapshot) => {
        const isPrivate = docSnapshot.exists && docSnapshot.data().userCount !== undefined;
        setIsPrivateChat(isPrivate);

        if (isPrivate) {
          const userIds = docSnapshot.data().userIds;
          const currentUserId = firebase.auth().currentUser?.uid;

          if (userIds && userIds.length === 2) {
            const otherUserId = userIds.find((id) => id !== currentUserId);
            fetchUserInformation(otherUserId);
          }
        }
      })
      .catch((error) => {
        console.log('Error checking private chat: ', error);
      });
  };

  const fetchUserInformation = (userId) => {
    const usersRef = firebase.firestore().collection('users');

    usersRef
      .doc(userId)
      .get()
      .then((docSnapshot) => {
        if (docSnapshot.exists) {
          const userData = docSnapshot.data();
          setOtherUserName(userData.name);
          setOtherUserPseudonym(userData.pseudonym);
        }
      })
      .catch((error) => {
        console.log('Error fetching user information: ', error);
      });
  };

  useLayoutEffect(() => {
    checkPrivateChat();
  }, [route]);

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
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <>
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(renderChatMessage)}
            </ScrollView>
            <View style={styles.footer}>
              <TextInput
                value={input}
                onChangeText={handleInputChange}
                onSubmitEditing={sendMessage}
                placeholder="Send message..."
                style={styles.textInput}
              />
              <TouchableOpacity onPress={sendMessage} activeOpacity={0.5}>
                <Ionicons name='send' size={24} color='#c581e7' />
              </TouchableOpacity>
            </View>
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 15,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 10,
  },
  headerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
    marginRight: 20,
  },
  headerButton: {
    marginLeft: 10,
  },
  senderText: {
    color: 'black',
    fontWeight: '500',
    marginLeft: 10,
    marginBottom: 15,
  },
  senderName: {
    left: 10,
    paddingRight: 10,
    fontSize: 10,
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
  },
  textInput: {
    bottom: 0,
    height: 40,
    flex: 1,
    marginRight: 15,
    borderColor: 'transparent',
    backgroundColor: '#ECECEC',
    borderWidth: 1,
    padding: 10,
    color: 'grey',
    borderRadius: 30,
  },
  chatContainer: {
    padding: 15,
    backgroundColor: '#ECECEC',
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginLeft: 15,
    marginBottom: 20,
    maxWidth: '80%',
    position: 'relative',
  },
  privateChatContainer: {
    padding: 15,
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginLeft: 15,
    marginBottom: 20,
    maxWidth: '80%',
    position: 'relative',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -15,
    left: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTitle: {
    fontSize: 14,
    color: 'white',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    maxWidth: '80%',
    position: 'relative',
  },
  currentUserChatContainer: {
    backgroundColor: '#ECECEC',
    marginLeft: 15,
    alignSelf: 'flex-end',
  },
  receiverChatContainer: {
    backgroundColor: '#dcf8c6',
    marginRight: 15,
    alignSelf: 'flex-start',
  },
  currentUserText: {
    color: 'black',
    fontWeight: '500',
    marginLeft: 10,
    marginBottom: 15,
  },
  receiverText: {
    color: 'black',
    fontWeight: '500',
    marginRight: 10,
    marginBottom: 15,
  },
});