import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { firebase } from '../config';
import { FontAwesome } from '@expo/vector-icons';

const GroupAnnouncements = ({navigation}) => {
  const [currentUserGroups, setCurrentUserGroups] = useState([]);
  const [mutualUsers, setMutualUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [message, setMessage] = useState('');
  const [groupmaking, setGroupmaking] = useState(false)
  const [showCreateGroupInput, setShowCreateGroupInput] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
            <Text style={styles.headerText}>Mutuals</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GroupAnnouncements')}>
            <Text style={styles.selectedHeaderText}>Groups</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const currentUserUid = firebase.auth().currentUser.uid;
    const unsubscribe = firebase.firestore().collection('users').doc(currentUserUid).onSnapshot((snapshot) => {
      const currentUserData = snapshot.data();
      const groups = currentUserData.groups || [];
      setCurrentUserGroups(groups);
    });

    return () => unsubscribe();
  }, []);

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

  const handleSend = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group before sending.');
      return;
    }

    if (message) {
      const currentUserUid = firebase.auth().currentUser.uid;

      const announcement = {
        text: message,
        announcer: currentUserUid,
        users: selectedGroup.users,
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
      selectedGroup.users.forEach((userId) => {
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
      setGroupSelected(null)
    }
  };

const handleCancelCreateGroup = () => {
  setShowCreateGroupInput(false);
  setGroupName('');
};

const handleConfirmCreateGroup = async () => {
  if (groupName && selectedUsers.length > 0) {
    const currentUserUid = firebase.auth().currentUser.uid;

    try {
      const groupRef = await firebase.firestore().collection('groups').add({
        leader: currentUserUid,
        users: selectedUsers,
        groupName: groupName,
      });

      await firebase.firestore().collection('users').doc(currentUserUid).update({
        groups: firebase.firestore.FieldValue.arrayUnion({
          groupId: groupRef.id,
          users: selectedUsers,
          currentUser: currentUserUid,
          groupName: groupName,
        }),
      });

      setShowCreateGroupInput(false);
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }
};

const filteredMutualUsers = isLoading ? mutualUsers : mutualUsers.filter((user) =>
user.name.toLowerCase().includes(searchText.toLowerCase())
);

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.groupButton,
        selectedGroup && selectedGroup.groupId === item.groupId ? styles.selectedGroupButton : null,
      ]}
      onPress={() => setSelectedGroup(item)}
    >
      <Text style={styles.groupButtonText}>{item.groupName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
{groupmaking ? (
    <View style={styles.arrowContainer}>
      <FontAwesome name="arrow-left" size={24} color="black" onPress={() => setGroupmaking(false)} />
    </View>
) : null }   
{groupmaking ? (
  <View style={styles.groupmaking}>
    <ScrollView style={styles.mutualsList}>
      {filteredMutualUsers.map((user) => (
        <TouchableOpacity
          key={user.id}
          style={[
            styles.userButton,
            selectedUsers.includes(user.id) && styles.selectedUserButton,
          ]}
          onPress={() => handleUserPress(user.id)}
        >
          <View style={styles.userRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name[0]}</Text>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            {selectedUsers.includes(user.id) ? (
              <TouchableOpacity onPress={() => {}}>
                <Ionicons
                  name='star'
                  size={24}
                  color='white'
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      ))}
  </ScrollView>
  {showCreateGroupInput ? (
      <View style={styles.groupInputContainer}>
        <TextInput
          style={styles.groupInput}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Group name"
        />
        <TouchableOpacity style={styles.groupInputIcon} onPress={handleCancelCreateGroup}>
          <Ionicons name="close" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.groupInputIcon} onPress={handleConfirmCreateGroup}>
          <Ionicons name="checkmark" size={24} color="green" />
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity style={styles.createGroupButton} onPress={() => setShowCreateGroupInput(true)}>
        <Text style={styles.createGroupButtonText}>Create Group</Text>
      </TouchableOpacity>
    )}
</View>
      ) : (
    <View style={styles.container}>
        <Text style={styles.title}>Select a Group:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupList}>
          <TouchableOpacity style={styles.addButton} onPress={() => setGroupmaking(true)}>
              <FontAwesome name="plus" size={16} color="black" />
          </TouchableOpacity>
          <FlatList
            data={currentUserGroups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.groupId}
            extraData={selectedGroup}
            horizontal
          />
        </ScrollView>
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message:</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  groupList: {
    flexDirection: 'row',
  },
  groupButton: {
    marginRight: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  selectedGroupButton: {
    backgroundColor: '#ddb4f1',
  },
  groupButtonText: {
    fontWeight: 'bold',
    color: 'black',
  },
  messageContainer: {
    marginTop: 20,
    marginBottom: 145,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
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
    paddingHorizontal: 10,
    justifyContent: 'center',
  },

  groupmaking: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  mutualsList: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    padding: 10,
  },
  userButton: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    padding: 5,
    marginHorizontal: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  selectedUserButton: {
    backgroundColor: '#ddb4f1',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  }
  
});

export default GroupAnnouncements;