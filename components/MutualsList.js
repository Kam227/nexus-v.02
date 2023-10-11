import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config';

const MutualsList = ({ route, navigation }) => {
    const { postId, mutualUserIds, userNames } = route.params;
    const [mutuals, setMutuals] = useState([]);

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
      }, [navigation]);
  
    useEffect(() => {
      firebase.firestore().collection('groupChatRooms').doc(postId).get()
        .then((doc) => {
          if (doc.exists) {
            const post = doc.data();
            const likedByMutuals = post.votes.filter(vote =>
              mutualUserIds.includes(vote.userId)
            );
            setMutuals(likedByMutuals);
          }
        })
        .catch(error => {
          console.log('Error fetching post:', error);
        });
    }, [postId, mutualUserIds]);

  return (
    <View style={styles.container}>
      <FlatList
        data={mutuals}
        renderItem={({ item }) => (
          <Text style={styles.mutualName}>
            {userNames[item.userId] || 'Loading...'}
          </Text>
        )}
        keyExtractor={item => item.userId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  mutualName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 15,
    marginBottom: 10
  },
});

export default MutualsList;
