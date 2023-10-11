import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView } from 'react-native';
import { Feather, Ionicons } from 'react-native-vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config';
import NexusImage from '../images/Nexus.png';
import { formatDistanceToNow } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { Chase } from 'react-native-animated-spinkit';

const ThreadPost = ({ route }) => {
  const { threadId } = route.params;
  const [post, setPost] = useState(null);
  const [postVote, setPostVote] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [userPseudonym, setUserPseudonym] = useState('John Doe');
  const [userPosts, setUserPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [timestamp, setTimestamp] = useState('');
  const navigation = useNavigation()

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
    const unsubscribe = firebase.firestore()
      .collection('groupChatRooms')
      .doc(threadId)
      .onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          const postData = docSnapshot.data();
          setPost({ id: docSnapshot.id, ...postData });
          setPostVote(postData.postVote || 0);
          setComments(postData.comments || []);
          fetchUserPseudonym(postData.userId);
          if (postData.timestamp) {
            setTimestamp(formatTimestamp(postData.timestamp));
          } else {
            setTimestamp('');
          }
        } else {
          setPost(null);
          setPostVote(0);
          setComments([]);
          setUserPseudonym('John Doe');
          setTimestamp('');
        }
      });

    return () => unsubscribe();
  }, [threadId]);

  const formatTimestamp = (timestamp) => {
    if (timestamp) {
      const now = new Date();
      const messageDate = timestamp.toDate();
      const distance = formatDistanceToNow(messageDate, { addSuffix: true });

      if (messageDate < now && Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000) {
        const formatOptions = {
          yesterday: "'Yesterday'",
          addSuffix: true,
        };
        if (Math.abs(now - messageDate) >= 365 * 24 * 60 * 60 * 1000) {
          formatOptions.year = "'Year(s)'";
        } else if (Math.abs(now - messageDate) >= 30 * 24 * 60 * 60 * 1000) {
          formatOptions.month = "'Month(s)'";
        } else if (Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000) {
          formatOptions.day = "'Day(s)'";
        }
        return formatDistanceToNow(messageDate, formatOptions);
      }

      return distance;
    }
    return '';
  };

  const fetchUserPseudonym = (userId) => {
    firebase.firestore()
      .collection('users')
      .doc(userId)
      .get()
      .then(docSnapshot => {
        if (docSnapshot.exists) {
          const userData = docSnapshot.data();
          setUserPseudonym(userData.pseudonym);
        }
      })
      .catch(error => {
        console.log('Error fetching user pseudonym:', error);
      });
  };

  const handlePostVote = (type) => {
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser ? currentUser.uid : null;
  
    const postRef = firebase.firestore().collection('groupChatRooms').doc(threadId);
  
    postRef.get().then((doc) => {
      if (doc.exists) {
        const post = doc.data();
        const newVotes = post.votes || [];
  
        let newPostVote = postVote;
        const userVoteIndex = newVotes.findIndex(vote => vote.userId === userId);
  
        if (type === 'upvote') {
          if (userVoteIndex === -1) {
            newPostVote += 1;
            newVotes.push({ userId, undo: -1 });
          } else {
            const userVote = newVotes[userVoteIndex];
            if (userVote.undo === 1) {
              newPostVote += 2;
              userVote.undo = -1;
            }
          }
        } else if (type === 'downvote') {
          if (userVoteIndex === -1) {
            newPostVote -= 1;
            newVotes.push({ userId, undo: 1 });
          } else {
            const userVote = newVotes[userVoteIndex];
            if (userVote.undo === -1) {
              newPostVote -= 2;
              userVote.undo = 1;
            }
          }
        }
  
        postRef.update({
          postVote: newPostVote,
          votes: newVotes,
        });
  
        setPostVote(newPostVote);
  
        setPosts(prevPosts => {
          const updatedPosts = prevPosts.map(p => {
            if (p.id === threadId) {
              return { ...p, postVote: newPostVote, votes: newVotes };
            }
            return p;
          });
          return updatedPosts;
        });
  
        const userRef = firebase.firestore().collection('users').doc(userId);
  
        userRef.get().then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            const updatedUserPosts = userData.posts.map(p => {
              if (p.threadId === threadId) {
                return { ...p, postVote: newPostVote };
              }
              return p;
            });
  
            userRef.update({ posts: updatedUserPosts });
  
            setUserPosts(updatedUserPosts);
          } else {
            console.log('User not found');
          }
        }).catch((error) => {
          console.log('Error fetching user:', error);
        });
      } else {
        console.log('Post not found');
      }
    }).catch((error) => {
      console.log('Error fetching post:', error);
    });
  };  

  const handleCommentVote = (commentId, type) => {
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser ? currentUser.uid : null;
  
    const postRef = firebase.firestore().collection('groupChatRooms').doc(threadId);
  
    postRef.get().then((doc) => {
      if (doc.exists) {
        const post = doc.data();
        const comments = post.comments || [];
        const updatedComments = comments.map((comment) => {
          if (comment.id === commentId) {
            let newCommentVote = comment.commentVote || 0;
  
            comment.votes = comment.votes || [];

            const userVote = comment.votes.find(vote => vote.userId === userId);
            if (userVote) {
              if (userVote.undo === 1 && type === 'upvote') {
                newCommentVote += 2;
                userVote.undo = -1;
              } else if (userVote.undo === -1 && type === 'downvote') {
                newCommentVote -= 2;
                userVote.undo = 1;
              }
            } else {
              if (type === 'upvote') {
                newCommentVote += 1;
                comment.votes.push({ userId, undo: -1 });
              } else if (type === 'downvote') {
                newCommentVote -= 1;
                comment.votes.push({ userId, undo: 1 });
              }
            }
  
            return { ...comment, commentVote: newCommentVote };
          }
          return comment;
        });
  
        postRef.update({ comments: updatedComments }).then(() => {
          setComments(updatedComments);

          if (post.userId !== userId) {
            const userRef = firebase.firestore().collection('users').doc(post.userId);

            userRef.update({
              notifications: firebase.firestore.FieldValue.arrayUnion({
                commentId,
                commentText: updatedComments.find(c => c.id === commentId).message,
                commenterId: userId
              })
            }).catch(error => {
              console.log('Error updating user notifications:', error);
            });
          }
        }).catch((error) => {
          console.log('Error updating comments:', error);
        });
      } else {
        console.log('Post not found');
      }
    }).catch((error) => {
      console.log('Error fetching post:', error);
    });
  };  

  const handleComment = () => {
    if (comment.trim() !== '') {
      const newComment = {
        id: Date.now().toString(),
        user: userPseudonym,
        message: comment.trim(),
        commentVote: 0,
      };
      const updatedComments = [...comments, newComment];
      firebase
        .firestore()
        .collection('groupChatRooms')
        .doc(threadId)
        .update({ comments: updatedComments })
        .then(() => {
          setComment('');
          setComments(updatedComments);
  
          const currentUser = firebase.auth().currentUser;
          if (post.userId !== currentUser.uid) {
            const userRef = firebase.firestore().collection('users').doc(post.userId);
  
            userRef
              .update({
                notifications: firebase.firestore.FieldValue.arrayUnion({
                  type: 'comment',
                  commentId: newComment.id,
                  commentText: newComment.message,
                  commenterId: currentUser.uid,
                  threadId: threadId
                })
              })
              .catch(error => {
                console.log('Error updating user notifications:', error);
              });
          }
        })
        .catch(error => {
          console.log('Error updating comments:', error);
        });
    }
  };
  

  if (!post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Chase size={80} color="#c581e7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
    <View style={styles.postContainer}>
      <View style={styles.headerContainer}>
        <Image source={NexusImage} style={styles.image} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>{post.header}</Text>
          <Text style={styles.timestampText}>{timestamp}</Text>
        </View>
      </View>
      <Text style={styles.bodyText}>{post.body}</Text>

      <View style={styles.imagesContainer}>
        {post.images &&
          post.images.map((imageUrl, index) => (
            <Image key={index} source={{ uri: imageUrl }} style={styles.postImage} />
          ))}
      </View>

      <View style={styles.voteContainer}>
        <View style={styles.leftIconsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Report', {threadId: post.threadId})}>
            <Feather name="flag" size={24} color="black" style={styles.commentIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.voteIconsContainer}>
          <TouchableOpacity onPress={() => handlePostVote('upvote')}>
            <Feather name="arrow-up" size={24} color={postVote > 0 ? 'green' : 'black'} style={styles.voteIcon} />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{postVote}</Text>
          <TouchableOpacity onPress={() => handlePostVote('downvote')}>
            <Feather name="arrow-down" size={24} color={postVote < 0 ? 'red' : 'black'} style={styles.voteIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>

      <View style={styles.commentContainer}>
        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <View style={styles.commentItem} key={item.id}>
              <Image source={NexusImage} style={styles.commentUserImage} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUserName}>{item.user}</Text>
                <Text>{item.message}</Text>
              </View>
              <View style={styles.commentVoteContainer}>
                <TouchableOpacity onPress={() => handleCommentVote(item.id, 'upvote')}>
                  <Feather name="arrow-up" size={24} color={item.commentVote === 1 ? 'green' : 'black'} style={styles.voteIcon} />
                </TouchableOpacity>
                <Text style={styles.voteCount}>{item.commentVote}</Text>
                <TouchableOpacity onPress={() => handleCommentVote(item.id, 'downvote')}>
                  <Feather name="arrow-down" size={24} color={item.commentVote === -1 ? 'red' : 'black'} style={styles.voteIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        />
      </View>
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Leave a comment..."
          value={comment}
          onChangeText={setComment}
          onSubmitEditing={handleComment}
        />
        <TouchableOpacity onPress={handleComment} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#c581e7" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 16,
  },
  postContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    marginTop: 5,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTextContainer: {
    flexDirection: 'column'
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 7,
    backgroundColor: '#ddb4f1'
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: 'gray',
  },
  bodyText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  voteIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteIcon: {
    marginHorizontal: 8,
  },
  leftIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },  
  voteCount: {
    fontWeight: 'bold',
    fontSize: 18,
    marginHorizontal: 8,
  },
  commentContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  commentInputContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  sendButton: {
    paddingHorizontal: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5
  },
  commentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddb4f1',
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    marginRight: 8,
  },
  commentUserName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentIcon: {
    marginRight: 10,
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 15,
    marginBottom: 10
  },
    timestampText: {
    fontSize: 12,
    color: 'gray',
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, 
  },
  postImage: {
    width: '100%',
    height: 400, 
    resizeMode: 'contain', 
    borderRadius: 8,
  },
});

export default ThreadPost;