'use client';

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getAllInterests, createMultipleUserInterests } from '~/utils/data';
import { InterestsTable } from '~/utils/db';
import { supabase } from '~/utils/supabase';


const MIN_INTERESTS_REQUIRED = 6;

export default function CreateInterestsScreen() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [ DBInterests, setDBInterests ] = useState<InterestsTable[]>([])
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      const allInterests = await getAllInterests()
      setDBInterests(allInterests);
      const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserId(data.user.id);
        }
    }
    getData();
  }, [])

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((interestId) => interestId !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const updateUserInterests = async () => {
    if (!selectedInterests || selectedInterests.length < 6 ) {
      Alert.alert('Missing Information', 'Please choose a minimum of 6 interests!');
      return
    }
    if (!userId ) {
      Alert.alert('Opps there was an issue!', 'No user ID is present!');
      return
    }
    createMultipleUserInterests(userId, selectedInterests)
    goNext();
  }

  const goNext = () => {
    if (selectedInterests.length >= MIN_INTERESTS_REQUIRED) {
      router.replace('/welcome');
    }
  };

  const hasEnoughInterests = selectedInterests.length >= MIN_INTERESTS_REQUIRED;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-4">
        <Text className="mb-2 text-3xl font-bold">Select Your Interests</Text>
        <Text className="mb-8 text-gray-600">
          Choose at least {MIN_INTERESTS_REQUIRED} topics you're interested in to help us
          personalize your experience.
        </Text>

        <ScrollView
          className="flex-1 mb-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <View className="flex-row flex-wrap justify-between">
            {DBInterests.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                className={`mb-4 rounded-full border px-5 py-3 ${
                  selectedInterests.includes(interest.id)
                    ? 'border-teal-500 bg-teal-500'
                    : 'border-gray-300 bg-white'
                }`}
                style={{ width: '48%' }}>
                <Text
                  className={`text-center font-medium ${
                    selectedInterests.includes(interest.id) ? 'text-white' : 'text-gray-800'
                  }`}>
                  {interest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={updateUserInterests}
          disabled={!hasEnoughInterests}
          className="mb-8 w-full items-center rounded-xl bg-teal-500 py-4"
          style={{ opacity: hasEnoughInterests ? 1 : 0.5 }}>
          <Text className="text-lg font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
