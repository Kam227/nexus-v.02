import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { firebase } from './config';
import { View } from 'react-native';

import Login from './src/Login';
import Registration from './src/Registration';
import Dashboard from './src/Dashboard';
import PostBox from './src/PostBox';
import Chat from './src/Chat';
import Header from './components/Header';
import GroupChat from './src/GroupChat';
import Search from './src/Search';
import FriendProfile from './components/FriendProfile';
import ProfileNavigator from './src/ProfileNavigator';
import Profile from './src/Profile';
import EditProfile from './src/EditProfile';
import Settings from './src/Settings';
import Pseudonym from './src/Pseudonym';
import Post from './components/Post';
import ArchivedPost from './components/ArchivedPost';
import MutualsList from './components/MutualsList';
import Notifications from './src/Notifications';
import AnnouncementsScreen from './components/AnnouncementsScreen';
import AnnouncementSettings from './components/AnnouncementSettings';
import Report from './components/Report';
import NewChat from './components/NewChat';
import ForgotPassword from './components/ForgotPassword';
import Thread from './components/Thread';
import PostThread from './components/PostThread';
import ThreadPost from './components/ThreadPost';
import ServerCreate from './components/ServerCreate';
import Server from './src/Server';

const Stack = createStackNavigator();

function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [hasPseudonym, setHasPseudonym] = useState(false);

  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
    
    if (user) {
      firebase.firestore().collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists && doc.data().pseudonym) {
            setHasPseudonym(true);
          } else {
            setHasPseudonym(false);
          }
        })
        .catch((error) => {
          console.error('Error getting user document:', error);
          setHasPseudonym(false);
        });
    } else {
      setHasPseudonym(false);
    }
  }  

  useEffect(() => {
    const subscriber = firebase.auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) return null;

  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name='Login'
              component={Login}
              options={{
                headerTitle: () => <Header name='Nexus' />,
                headerStyle: {
                  borderBottomWidth: 0,
                  backgroundColor: 'white'
                },
              }}
            />
            <Stack.Screen
              name='Registration'
              component={Registration}
              options={{
                headerTitle: () => <Header name='Nexus' />,
                headerStyle: {
                  borderBottomWidth: 0,
                  backgroundColor: 'white'
                },
              }}
            />
            <Stack.Screen
              name='ForgotPassword'
              component={ForgotPassword}
              options={{
                headerTitle: () => <Header name='Nexus' />,
                headerStyle: {
                  borderBottomWidth: 0
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    );
  } else if (!hasPseudonym) {
    return (
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name='Pseudonym'
              component={Pseudonym}
            />
            <Stack.Screen name='Dashboard' component={Dashboard} options={{headerLeft: null}} />
            <Stack.Screen name='PostBox' component={PostBox} />
            <Stack.Screen name='Chat' component={Chat} />
            <Stack.Screen name='GroupChat' component={GroupChat} />
            <Stack.Screen name='Search' component={Search} />
            <Stack.Screen name='FriendProfile' component={FriendProfile} />
            <Stack.Screen name='ProfileNavigator' component={ProfileNavigator} />
            <Stack.Screen name='Profile' component={Profile} />
            <Stack.Screen name='EditProfile' component={EditProfile} />
            <Stack.Screen name='Settings' component={Settings} />
            <Stack.Screen name='Post' component={Post} />
            <Stack.Screen name='ArchivedPost' component={ArchivedPost} />
            <Stack.Screen name='MutualsList' component={MutualsList} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen name='AnnouncementsScreen' component={AnnouncementsScreen} />
            <Stack.Screen name='AnnouncementSettings' component={AnnouncementSettings} />
            <Stack.Screen name='Report' component={Report} />
            <Stack.Screen name='NewChat' component={NewChat} />
            <Stack.Screen name='Thread' component={Thread} />
            <Stack.Screen name='PostThread' component={PostThread} />
            <Stack.Screen name='ThreadPost' component={ThreadPost} />
            <Stack.Screen name='ServerCreate' component={ServerCreate} />
            <Stack.Screen name='Server' component={Server} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    );
  } else {
    return (
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName='Dashboard'
          >
            <Stack.Screen name='Dashboard' component={Dashboard} />
            <Stack.Screen name='PostBox' component={PostBox} />
            <Stack.Screen name='Chat' component={Chat} />
            <Stack.Screen name='GroupChat' component={GroupChat} />
            <Stack.Screen name='Search' component={Search} />
            <Stack.Screen name='FriendProfile' component={FriendProfile} />
            <Stack.Screen name='ProfileNavigator' component={ProfileNavigator} />
            <Stack.Screen name='Profile' component={Profile} />
            <Stack.Screen name='EditProfile' component={EditProfile} />
            <Stack.Screen name='Settings' component={Settings} />
            <Stack.Screen name='ArchivedPost' component={ArchivedPost} />
            <Stack.Screen name='Post' component={Post} />
            <Stack.Screen name='MutualsList' component={MutualsList} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen name='AnnouncementsScreen' component={AnnouncementsScreen} />
            <Stack.Screen name='AnnouncementSettings' component={AnnouncementSettings} />
            <Stack.Screen name='Report' component={Report} />
            <Stack.Screen name='NewChat' component={NewChat} />
            <Stack.Screen name='Thread' component={Thread} />
            <Stack.Screen name='PostThread' component={PostThread} />
            <Stack.Screen name='ThreadPost' component={ThreadPost} />
            <Stack.Screen name='ServerCreate' component={ServerCreate} />
            <Stack.Screen name='Server' component={Server} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    );
  }
}

export default App;

