'use client';

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getAllInterestCategories } from '~/utils/data';
import type { InterestCategoriesTable } from '~/utils/db';

const MIN_CATEGORIES_REQUIRED = 6;

export default function CreateCategoriesScreen() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<InterestCategoriesTable[]>([]);

  useEffect(() => {
    const getCategories = async () => {
      const allCategories = await getAllInterestCategories();
      setCategories(allCategories);
    };
    getCategories();
  }, []);

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((categoryId) => categoryId !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const goToInterests = () => {
    if (selectedCategories.length < MIN_CATEGORIES_REQUIRED) {
      Alert.alert(
        'Missing Information',
        `Please choose a minimum of ${MIN_CATEGORIES_REQUIRED} categories!`
      );
      return;
    }

    // Navigate to the interests screen with selected categories
    router.push({
      pathname: '/create-interests',
      params: { categories: selectedCategories.join(',') },
    });
  };

  const hasEnoughCategories = selectedCategories.length >= MIN_CATEGORIES_REQUIRED;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 py-4">
        <Text className="mb-2 text-3xl font-bold">Select Categories</Text>
        <Text className="mb-8 text-gray-600">
          Choose at least {MIN_CATEGORIES_REQUIRED} categories you're interested in to help us
          personalize your experience.
        </Text>

        <ScrollView
          className="mb-4 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}>
          <View className="flex-row flex-wrap justify-between">
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => toggleCategory(category.id)}
                className={`mb-4 rounded-full border px-5 ${
                  selectedCategories.includes(category.id)
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
                    selectedCategories.includes(category.id) ? 'text-white' : 'text-gray-800'
                  }`}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={goToInterests}
          disabled={!hasEnoughCategories}
          className="mb-8 w-full items-center rounded-xl bg-teal-500 py-4"
          style={{ opacity: hasEnoughCategories ? 1 : 0.5 }}>
          <Text className="text-lg font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
