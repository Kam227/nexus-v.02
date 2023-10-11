import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { firebase } from '../config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppState } from 'react-native';
import NavBar from '../components/NavBar';

const Search = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [masterData, setMasterData] = useState([]);
  const [search, setSearch] = useState('');
  const currentUser = firebase.auth().currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              onChangeText={searchFilter}
              value={search}
              placeholder="Find friends"
              placeholderTextColor="#888"
            />
          </View>
        </View>
      ),
    });
  }, [navigation, search]);

  useEffect(() => {
    const unsubscribeAuth = firebase.auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        firebase
          .firestore()
          .collection('users')
          .get()
          .then((querySnapshot) => {
            const users = [];
            querySnapshot.forEach((doc) => {
              if (doc.id !== currentUser.uid) {
                users.push({ uid: doc.id, ...doc.data() });
              }
            });
            setFilteredData(users);
            setMasterData(users);
          })
          .catch((error) => {
            console.log('Error fetching user data:', error);
          });
      } else {
        setFilteredData([]);
        setMasterData([]);
      }
    });

    return () => unsubscribeAuth();
  }, [currentUser]);

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

  const searchFilter = (text) => {
    const newData = masterData.filter((item) => {
      const itemName = item.name ? item.name.toLowerCase() : `user-${item.id}`;
      const searchQuery = text.toLowerCase();
      return itemName.includes(searchQuery);
    });
    setFilteredData(newData);
    setSearch(text);
  };

  const navigateToProfile = (userId) => {
    navigation.navigate('FriendProfile', { userId: userId, currentUser: currentUser.uid });
  };

  const renderItem = ({ item }) => {
    if (search === '') {
      return null;
    }

    return (
      <TouchableOpacity onPress={() => navigateToProfile(item.uid)}>
        <View style={styles.itemStyle}>
          <Text style={styles.name}>{item.name ? item.name : `user-${item.id}`}</Text>
          <Text style={styles.username}>{item.username ? item.username : `username-${item.id}`}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ItemSeparatorView = () => {
    return <View style={styles.separator} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.uid}
            ItemSeparatorComponent={ItemSeparatorView}
            renderItem={renderItem}
          />
        </View>
      </ScrollView>
      <NavBar />
    </SafeAreaView>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 8,
    marginLeft: 8,
    top: 25
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#888',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    marginTop: 25
  },
  itemStyle: {
    padding: 15,
  },
  name: {
    fontSize: 18,
  },
  username: {
    fontSize: 14,
    color: 'gray',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#CED0CE',
  },
});