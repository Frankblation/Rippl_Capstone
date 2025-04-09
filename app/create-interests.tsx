'use client';

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getAllInterests, getInterestsByCategory, createMultipleUserInterests } from '~/utils/data';
import type { InterestsTable } from '~/utils/db';
import { supabase } from '~/utils/supabase';

const MIN_INTERESTS_REQUIRED = 6;

export default function CreateInterestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedCategories = params.categories ? String(params.categories).split(',') : [];

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [DBInterests, setDBInterests] = useState<InterestsTable[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoriesWithInterests, setCategoriesWithInterests] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getData = async () => {
      let interests: InterestsTable[] = [];
      const categoriesWithData = new Set<string>();

      if (selectedCategories.length > 0) {
        // Fetch interests for each selected category
        for (const categoryId of selectedCategories) {
          try {
            const categoryInterests = await getInterestsByCategory(categoryId);

            // Only add categories that have interests
            if (categoryInterests && categoryInterests.length > 0) {
              interests = [...interests, ...categoryInterests];
              categoriesWithData.add(categoryId);
            }
          } catch (error) {
            console.error(`Error fetching interests for category ${categoryId}:`, error);
          }
        }
      } else {
        // Fallback to all interests if no categories selected
        interests = await getAllInterests();
      }

      setDBInterests(interests);
      setCategoriesWithInterests(categoriesWithData);

      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    getData();
  }, [selectedCategories]);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((interestId) => interestId !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const updateUserInterests = async () => {
    if (!selectedInterests || selectedInterests.length < MIN_INTERESTS_REQUIRED) {
      Alert.alert(
        'Missing Information',
        `Please choose a minimum of ${MIN_INTERESTS_REQUIRED} interests!`
      );
      return;
    }
    if (!userId) {
      Alert.alert('Oops there was an issue!', 'No user ID is present!');
      return;
    }

    setLoading(true);

    try {
      // Save the selected interests
      createMultipleUserInterests(userId, selectedInterests);
      goNext();
    } catch (error) {
      console.error('Error saving interests:', error);
      Alert.alert('Error', 'There was a problem saving your interests. Please try again.');
      setLoading(false);
    }
  };

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

        {DBInterests.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-gray-500">
              No interests found for the selected categories. Please go back and select different
              categories.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 rounded-xl bg-teal-500 px-6 py-3">
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView
              className="mb-4 flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}>
              <View className="flex-row flex-wrap justify-between">
                {DBInterests.map((interest) => (
                  <TouchableOpacity
                    key={interest.id}
                    onPress={() => toggleInterest(interest.id)}
                    className={`mb-4 rounded-full border px-5 ${
                      selectedInterests.includes(interest.id)
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-gray-300 bg-white'
                    }`}
                    style={{
                      width: '48%',
                      height: 50,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text
                      className={`text-center font-medium ${
                        selectedInterests.includes(interest.id) ? 'text-white' : 'text-gray-800'
                      }`}
                      numberOfLines={2}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}>
                      {interest.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={updateUserInterests}
              disabled={!hasEnoughInterests || loading}
              className="mb-8 w-full items-center rounded-xl bg-teal-500 py-4"
              style={{ opacity: hasEnoughInterests && !loading ? 1 : 0.5 }}>
              <Text className="text-lg font-semibold text-white">
                {loading ? 'Saving...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
