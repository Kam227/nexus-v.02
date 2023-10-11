import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, TextInput, FlatList, ScrollView } from 'react-native';
import { firebase } from '../config';

const Announcements = ({navigation}) => {
  const [mutualUsers, setMutualUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
            <Text style={styles.selectedHeaderText}>Mutuals</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GroupAnnouncements')}>
            <Text style={styles.headerText}>Groups</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const currentUserUid = firebase.auth().currentUser.uid;
    const unsubscribe = firebase.firestore().collection('users').doc(currentUserUid).onSnapshot((snapshot) => {
      const currentUserData = snapshot.data();
      const userMutuals = currentUserData.mutuals || [];
      Promise.all(userMutuals.map(userId => fetchUserData(userId)))
        .then(names => {
          setMutualUsers(names.filter(name => name));
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching mutual user data:', error);
          setIsLoading(false);
        });
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const snapshot = await firebase.firestore().collection('users').doc(userId).get();
      const userData = snapshot.data();
      return { id: userId, name: userData.name };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const handleUserPress = (userId) => {
    setSelectedUsers((prevUsers) => {
      if (prevUsers.includes(userId)) {
        return prevUsers.filter((id) => id !== userId);
      }
      return [...prevUsers, userId];
    });
  };

  const renderUserButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userButton,
        selectedUsers.includes(item.id) && styles.selectedUserButton,
      ]}
      onPress={() => handleUserPress(item.id)}
    >
      <Text style={{fontWeight: 'bold', paddingHorizontal: 5 }}>{item.name}</Text>
    </TouchableOpacity>
  );

  const keyExtractor = (item) => item;

  const handleSend = async () => {
    if (message && selectedUsers.length > 0) {
      const currentUserUid = firebase.auth().currentUser.uid;
      const announcement = {
        text: message,
        announcer: currentUserUid,
        users: selectedUsers,
        perms: currentUserUid,
      };
  
      const announcementRef = await firebase.firestore().collection('announcements').add(announcement);
  
      const notification = {
        type: 'announcement',
        announcementId: announcementRef.id,
        announcer: currentUserUid,
        announcement: message
      };
  
      const batch = firebase.firestore().batch();
      selectedUsers.forEach((userId) => {
        const userRef = firebase.firestore().collection('users').doc(userId);
        batch.update(userRef, {
          notifications: firebase.firestore.FieldValue.arrayUnion(notification),
        });
      });
  
      const currentUserRef = firebase.firestore().collection('users').doc(currentUserUid);
      batch.update(currentUserRef, {
        notifications: firebase.firestore.FieldValue.arrayUnion({
          type: 'announcementMade',
          announcementId: announcementRef.id,
          announcer: currentUserUid,
          announcement: message
        }),
      });
  
      await batch.commit();
      setMessage('');
      setSelectedUsers([]);
    }
  };  

  const filteredMutualUsers = isLoading ? mutualUsers : mutualUsers.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('GroupAnnouncements')}>
          <Text style={styles.title}>Select Users:</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Search mutuals..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <View style={styles.userListContainer}>
            <FlatList
              data={filteredMutualUsers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderUserButton}
              keyExtractor={keyExtractor}
            />
          </View>
          <Text style={styles.title}>Message:</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            multiline
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  userListContainer: {
    height: 35,
    flexDirection: 'row'
  },
  userButton: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    padding: 5,
    marginHorizontal: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  selectedUserButton: {
    backgroundColor: '#ddb4f1',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#c581e7',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
  },
  userName: {
    fontSize: 16,
  },
  groupmaking: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  arrowContainer: {
    left: 0,                     
  },
  mutualsList: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    padding: 10,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createGroupButton: {
    backgroundColor: '#4267B2', 
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 16,
  },
  groupInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    paddingLeft: 10,
  },
  groupInputIcon: {
    marginLeft: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  selectedHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c581e7',
  },
});

export default Announcements;