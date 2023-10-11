import React, { Component, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import GroupChat from './GroupChat';
import PostBox from './PostBox';
import Post from '../components/Post';
import Report from '../components/Report';

const GroupChatStack = createStackNavigator();

class GroupChatNavigator extends Component {
render() {
    return (

    <GroupChatStack.Navigator initialRouteName='GroupChat'>
        <GroupChatStack.Screen 
          name='GroupChat'
          component={GroupChat}
          options={{ headerShown: false }} 
        />
        <GroupChatStack.Screen 
          name='PostBox'
          component={PostBox}
          options={{ headerShown: false }} 
        />
        <GroupChatStack.Screen 
          name='Post'
          component={Post}
          options={{ headerShown: false }} 
        />
    </GroupChatStack.Navigator>
    )
 }}
export default GroupChatNavigator