import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { firebase } from '../config';

const Share = ({ postId }) => {
  const [mutualUsers, setMutualUsers] = useState([]);
  const [selectedMutual, setSelectedMutual] = useState(null);

  useEffect(() => {
    const currentUserUid = firebase.auth().currentUser.uid;

    const userRef = firebase.firestore().collection('users').doc(currentUserUid);

    userRef.get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const userMutuals = userData.mutuals || [];
        const mutualUsersData = [];
        userMutuals.forEach((mutualId) => {
          const mutualUserRef = firebase.firestore().collection('users').doc(mutualId);
          mutualUserRef.get().then((mutualDoc) => {
            if (mutualDoc.exists) {
              const mutualUserData = mutualDoc.data();
              mutualUsersData.push({ id: mutualId, name: mutualUserData.name });
              if (mutualUsersData.length === userMutuals.length) {
                setMutualUsers(mutualUsersData);
              }
            }
          });
        });
      }
    });
  }, []);

  const handleMutualPress = (mutualId) => {
    setSelectedMutual((prevSelectedMutual) => (prevSelectedMutual === mutualId ? null : mutualId));
  };

  const handleSend = async () => {
    if (selectedMutual) {
      const currentUserUid = firebase.auth().currentUser.uid;

      const shareData = {
        sender: currentUserUid,
        receiver: selectedMutual,
        postId: postId,
      };

      try {
        await firebase.firestore().collection('shares').add(shareData);

        const mutualUserRef = firebase.firestore().collection('users').doc(selectedMutual);

        const notification = {
          type: 'shares',
          postId: postId,
          sender: currentUserUid,
        };

        await mutualUserRef.update({
          notifications: firebase.firestore.FieldValue.arrayUnion(notification),
        });

        setSelectedMutual(null);
      } catch (error) {
        console.error('Error sending share:', error);
      }
    }
  };

  const renderMutual = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.mutualContainer,
        selectedMutual === item.id && styles.selectedMutualContainer,
      ]}
      onPress={() => handleMutualPress(item.id)}
    >
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share with a friend:</Text>
      <View style={styles.mutualListContainer}>
        <FlatList
          data={mutualUsers}
          renderItem={renderMutual}
          keyExtractor={(item) => item.id}
        />
      </View>
      {selectedMutual && (
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mutualListContainer: {
    marginBottom: 16,
  },
  mutualContainer: {
    backgroundColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedMutualContainer: {
    backgroundColor: '#ddb4f1',
  },
  sendButton: {
    backgroundColor: '#c581e7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Share;
