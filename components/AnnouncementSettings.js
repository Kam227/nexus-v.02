import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config'; 

const AnnouncementSettings = ({ navigation, route }) => {
    const { announcementId } = route.params;
    const [userNames, setUserNames] = useState([]);
    const [markedUsers, setMarkedUsers] = useState([]);
  
    const goBack = () => {
      navigation.goBack();
    };
  
    useEffect(() => {
      navigation.setOptions({
        header: () => (
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <FontAwesome name="times" size={24} color="#000" />
          </TouchableOpacity>
        ),
      });
  
      const fetchAnnouncementData = async () => {
        try {
          const announcementRef = firebase.firestore().collection('announcements').doc(announcementId);
          const announcementDoc = await announcementRef.get();
  
          if (announcementDoc.exists) {
            const data = announcementDoc.data();
            const usersArray = data.users || [];
  
            const userNamesPromises = usersArray.map(async (userId) => {
              const userDoc = await firebase.firestore().collection('users').doc(userId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                  id: userId,
                  name: userData.name || 'Unknown',
                  avatar: userData.name ? userData.name.charAt(0).toUpperCase() : '?',
                };
              }
              return { id: userId, name: 'Unknown', avatar: '?' };
            });
  
            const fetchedUserNames = await Promise.all(userNamesPromises);
            setUserNames(fetchedUserNames);
            
            const permsArray = data.perms || [];
            setMarkedUsers(permsArray);
          }
        } catch (error) {
          console.log('Error fetching announcement data:', error);
        }
      };
  
      fetchAnnouncementData();
    }, [navigation, announcementId]);
  
    const toggleMarkUser = (userId) => {
      if (markedUsers.includes(userId)) {
        setMarkedUsers(markedUsers.filter(id => id !== userId));
      } else {
        setMarkedUsers([...markedUsers, userId]);
      }
    };
  
    const handleSavePermissions = async () => {
      try {
        const announcementRef = firebase.firestore().collection('announcements').doc(announcementId);
  
        await announcementRef.update({
          perms: markedUsers,
        });
  
        console.log('Permissions updated successfully.');
      } catch (error) {
        console.log('Error updating permissions:', error);
      }
      goBack();
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Announcement List:</Text>
      <FlatList
        data={userNames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text style={styles.avatar}>{item.avatar}</Text>
            <Text style={styles.userName}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleMarkUser(item.id)}>
              <FontAwesome
                name="star"
                size={24}
                color={markedUsers.includes(item.id) ? 'yellow' : 'white'}
              />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSavePermissions}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 16,
  },
  headerButton: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#c581e7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    padding: 6
  },
};

export default AnnouncementSettings;