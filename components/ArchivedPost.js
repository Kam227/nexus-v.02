import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView } from 'react-native';
import { Feather, Ionicons } from 'react-native-vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config';
import NexusImage from '../images/Nexus.png';
import { formatDistanceToNow } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { Chase } from 'react-native-animated-spinkit';

const ArchivedPost = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [postVote, setPostVote] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [userPseudonym, setUserPseudonym] = useState('John Doe');
  const [userPosts, setUserPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [timestamp, setTimestamp] = useState('');
  const [isPostBookmarked, setIsPostBookmarked] = useState(false);
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
      .collection('archivedGroupChatRooms')
      .doc(postId)
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
  }, [postId]);

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

  const handlePostVote = () => {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      return;
    }
  
    const userId = currentUser.uid;
    const userVote = post.votes ? post.votes.find(vote => vote.userId === userId) : undefined;
  
    let newPostVote = postVote || 0;
  
    if (!post.votes) {
      post.votes = [];
    }
  
    if (!userVote) {
      newPostVote += 1;
      post.votes.push({ userId, value: 1 });
    } else {
      newPostVote -= userVote.value;
      userVote.value *= -1;
    }
  
    firebase.firestore().collection('archivedGroupChatRooms').doc(postId).update({
      postVote: newPostVote,
      votes: post.votes,
    });
  
    const userRef = firebase.firestore().collection('users').doc(userId);
    userRef.get().then((doc) => {
      if (doc.exists) {
        const user = doc.data();
        const updatedUserPosts = user.posts.map((userPost) => {
          if (userPost.postId === postId) {
            return { ...userPost, postVote: newPostVote };
          }
          return userPost;
        });
        userRef.update({ posts: updatedUserPosts });
      } else {
        console.log('User not found');
      }
    }).catch((error) => {
      console.log('Error fetching user:', error);
    });
  
    setPostVote(newPostVote);
  };  

  const handleCommentVote = (commentId, type) => {
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser ? currentUser.uid : null;
  
    const postRef = firebase.firestore().collection('archivedGroupChatRooms').doc(postId);
  
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
        .collection('archivedGroupChatRooms')
        .doc(postId)
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
                  postId: postId
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

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      return;
    }
  
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
    userRef.get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        setIsPostBookmarked(userData.saves.some(savedPost => savedPost.postId === postId));
      }
    });
  }, [postId]); 
  
  const handleToggleBookmark = () => {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      return;
    }
  
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
    userRef.get().then(async (doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const savedIndex = userData.saves.findIndex(savedPost => savedPost.postId === postId);
  
        if (savedIndex === -1) {
          const updatedSaves = [
            ...userData.saves,
            {
              postId,
              title: post.title,
              description: post.description,
              location: post.location,
              timeStart: post.timeStart,
              timeEnd: post.timeEnd,
            },
          ];
          await userRef.update({ saves: updatedSaves });
  
          setIsPostBookmarked(true);
        } else {
          const updatedSaves = userData.saves.filter(savedPost => savedPost.postId !== postId);
          await userRef.update({ saves: updatedSaves });
  
          setIsPostBookmarked(false);
        }
      }
    });
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
          <Text style={styles.headerText}>{post.title}</Text>
          <Text style={styles.timestampText}>{timestamp}</Text>
        </View>
      </View>
      <Text style={styles.bodyText}>{post.description}</Text>
      <Text style={{fontSize: 17, fontWeight: 'bold'}}>Location:</Text>
      <Text style={styles.bodyText}>{post.location}</Text>
      <Text style={{fontSize: 17, fontWeight: 'bold'}}>Date</Text>
      <Text style={styles.bodyText}>{post.date}</Text>
      <Text style={{fontSize: 17, fontWeight: 'bold'}}>Time:</Text>
      <Text style={styles.bodyText}>{`${post.timeStart} - ${post.timeEnd}`}</Text>
    </View>

      <View style={styles.commentContainer}>
      <Text style={{color: 'gray', fontSize: 14, marginBottom: 10, marginTop: 5,}}>This event has passed, but feel free to leave a comment!</Text>
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
    fontSize: 14,
    marginBottom: 8,
    color: '#494848'
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
});

export default ArchivedPost;