import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';

const Server = ({route}) => {
  const { serverId, serverName } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState('');
  const [currentUserUid, setCurrentUserUid] = useState('');

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
          setCurrentUserUid(currentUserUid);
        }
      } catch (error) {
        console.log('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSend = () => {
    if (message.trim() !== '') {
      const newMessage = {
        text: message,
        user: currentUserUid,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.serverNameContainer}>
          <Text style={styles.serverName}>{serverName}</Text>
        </View>

        <View style={styles.textChannelsContainer}>
          <View style={styles.textChannelsHeader}>
            <Text style={styles.textChannelsLabel}>TEXT CHANNELS</Text>
            <TouchableOpacity>
              <Ionicons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.textChannel}>
            <Text style={styles.textChannelName}># general</Text>
          </TouchableOpacity>
          {/* Add more text channels as needed */}
        </View>

        <View style={styles.userInfoContainer}>
          <FontAwesome name="user-circle" size={40} color="gray" />
          <Text style={styles.userName}>{userName}</Text>
          <TouchableOpacity>
            <FontAwesome name="gear" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Section (Chat Room) */}
      <View style={styles.mainSection}>
        <ScrollView
          contentContainerStyle={styles.messageContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                {
                  alignSelf: msg.user === currentUserUid ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.user === currentUserUid ? '#DCF8C5' : '#E6E6E6',
                },
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={(text) => setMessage(text)}
          />
          <TouchableOpacity onPress={handleSend}>
            <Ionicons name="send" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Arrange sidebar and main section side by side
  },
  sidebar: {
    width: '35%', // Adjust the width as needed
    backgroundColor: '#fff',
    paddingTop: 30,
    paddingRight: 10,
    paddingBottom: 10,
    borderRightWidth: 1,
    borderRightColor: 'lightgray',
  },
  serverNameContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
  serverName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  textChannelsContainer: {
    flex: 1,
    marginTop: 20,
  },
  textChannelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textChannelsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textChannel: {
    paddingVertical: 5,
  },
  textChannelName: {
    fontSize: 16,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'lightgray',
    paddingTop: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainSection: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'lightgray',
  },
  input: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F3F3F3',
    borderRadius: 25,
  },
});

export default Server;