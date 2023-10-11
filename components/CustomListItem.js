import { View, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Avatar, ListItem } from 'react-native-elements';
import { firebase } from '../config'


const CustomListItem = ({ id, chatName, enterChat }) => {
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = firebase.firestore()
    .collection('chats')
    .doc(id)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot((snapshot) => 
      setChatMessages(snapshot.docs.map((doc) => doc.data()))
    );

    return unsubscribe;
  });

  return (
    <ListItem
      onPress={() => enterChat(id, chatName)}
      key={id} 
      bottomDiver
      
    >
      <Avatar 
        rounded
        source={{
            uri:
            'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541',
        }}
      />
      <ListItem.Content>
        <ListItem.Title style={{fontWeight: '800' }}>
            {chatName}
        </ListItem.Title>
        <ListItem.Subtitle numberOfLines={1} ellipsizeMode='tail'>
            {chatMessages?.[0]?.displayName}: {chatMessages?.[0]?.message}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );
};

export default CustomListItem
