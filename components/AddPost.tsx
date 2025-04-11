'use client';

import type React from 'react';
import { useTabsReload } from '~/app/(tabs)/_layout';
import { format, type ISOStringFormat } from 'date-fns';
import { useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '~/components/providers/AuthProvider';

import SupabaseImageUploader from '~/components/SupabaseImageUploader';

import { createPost, getUserInterests } from '~/utils/data';
import { PostType } from '~/utils/db';

// Add this after imports
const windowWidth = Dimensions.get('window').width;
const isSmallDevice = windowWidth < 375;

type DateTimeType = 'single' | 'range';

interface FormData {
  type: PostType | undefined;
  title: string;
  description: string;
  location?: string;
  dateType?: DateTimeType;
  startDate?: Date;
  endDate?: Date;
  timeType?: DateTimeType;
  startTime?: Date;
  endTime?: Date;
  interestGroup: string;
  image?: string | null;
}

// Accordion Section Component
interface AccordionSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  isRequired?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionSection = ({
  title,
  icon,
  children,
  isRequired = false,
  isOpen,
  onToggle,
}: AccordionSectionProps) => {
  const animationValue = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    animationValue.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
  }, [isOpen, animationValue]);

  const contentStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(animationValue.value, [0, 1], [0, 1000], Extrapolate.CLAMP);

    const opacity = interpolate(animationValue.value, [0, 0.5, 1], [0, 0, 1], Extrapolate.CLAMP);

    return {
      maxHeight,
      opacity,
      overflow: 'hidden',
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const rotation = interpolate(animationValue.value, [0, 1], [0, 180], Extrapolate.CLAMP);

    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={styles.accordionSection}>
      <Pressable style={styles.accordionHeader} onPress={onToggle}>
        <View style={styles.accordionTitleContainer}>
          {icon && (
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color="#00AF9F"
              style={styles.accordionIcon}
            />
          )}
          <Text style={styles.accordionTitle}>{title}</Text>
          {isRequired && <Text style={styles.requiredIndicator}>*</Text>}
        </View>
        <Animated.View style={iconStyle}>
          <Ionicons name="chevron-down" size={18} color="#F39237" />
        </Animated.View>
      </Pressable>

      <Animated.View style={contentStyle}>
        <View style={styles.accordionContent}>{children}</View>
      </Animated.View>
    </View>
  );
};

const AddPostForm = () => {
  const [postType, setPostType] = useState<PostType | null>(null);
  const [dateType, setDateType] = useState<DateTimeType>('single');
  const [timeType, setTimeType] = useState<DateTimeType>('single');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { triggerReload } = useTabsReload();
  const descriptionRef = useRef<TextInput>(null);

  // State for user interests from database
  const [interests, setInterests] = useState<{ id: string; name: string }[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  // Get the authenticated user
  const { user: authUser } = useAuth();

  // Accordion state
  const [openSections, setOpenSections] = useState({
    type: true,
    basicInfo: false,
    location: false,
    date: false,
    time: false,
    interest: false,
    image: false,
  });

  interface OpenSections {
    [key: string]: boolean;
  }

  type ToggleSection = (section: keyof typeof openSections) => void;

  const toggleSection: ToggleSection = (section: keyof OpenSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section as keyof typeof openSections]: !prev[section as keyof typeof openSections],
    }));
  };

  // Fetch user interests from database
  useEffect(() => {
    const fetchInterests = async () => {
      if (!authUser?.id) return;

      try {
        setLoadingInterests(true);
        const userInterests = await getUserInterests(authUser.id);

        // Transform the data structure
        const formattedInterests = userInterests.map((item) => ({
          id: item.interest_id,
          name: item.interests?.name || 'Unknown Interest',
        }));

        setInterests(formattedInterests);
      } catch (error) {
        console.error('Error fetching user interests:', error);
      } finally {
        setLoadingInterests(false);
      }
    };

    fetchInterests();
  }, [authUser?.id]);

  // FORM
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      type: undefined,
      title: '',
      description: '',
      location: '',
      dateType: 'single',
      startDate: undefined,
      endDate: undefined,
      timeType: 'single',
      startTime: undefined,
      endTime: undefined,
      interestGroup: '',
      image: null,
    },
  });

  // Watch form values for auto-progression
  const title = watch('title');
  const description = watch('description');
  const location = watch('location');
  const selectedStartDate = watch('startDate');
  const selectedEndDate = watch('endDate');
  const selectedStartTime = watch('startTime');
  const selectedEndTime = watch('endTime');
  const selectedInterestGroup = watch('interestGroup');
  const imageUri = watch('image');

  // Auto-progress through sections when fields are filled
  useEffect(() => {
    // If type is selected, open basic info
    if (postType && !openSections.basicInfo) {
      setOpenSections((prev) => ({
        ...prev,
        basicInfo: true,
      }));
    }

    // If basic info is filled, open next section
    if (title && description && postType === PostType.EVENT && !openSections.location) {
      setOpenSections((prev) => ({
        ...prev,
        location: true,
      }));
    }

    // If location is filled for events, open date section
    if (postType === PostType.EVENT && location && !openSections.date) {
      setOpenSections((prev) => ({
        ...prev,
        date: true,
      }));
    }

    // If date is filled for events, open time section
    if (
      postType === PostType.EVENT &&
      selectedStartDate &&
      (dateType === 'single' || (dateType === 'range' && selectedEndDate)) &&
      !openSections.time
    ) {
      setOpenSections((prev) => ({
        ...prev,
        time: true,
      }));
    }

    // If time is filled for events, open interest section
    if (
      postType === PostType.EVENT &&
      selectedStartTime &&
      (timeType === 'single' || (timeType === 'range' && selectedEndTime)) &&
      !openSections.interest
    ) {
      setOpenSections((prev) => ({
        ...prev,
        interest: true,
      }));
    }

    // For posts, if basic info is filled, open interest section
    if (postType === PostType.NOTE && title && description && !openSections.interest) {
      setOpenSections((prev) => ({
        ...prev,
        interest: true,
      }));
    }

    // If interest is selected, open image section
    if (selectedInterestGroup && !openSections.image) {
      setOpenSections((prev) => ({
        ...prev,
        image: true,
      }));
    }
  }, [
    postType,
    title,
    description,
    location,
    selectedStartDate,
    selectedEndDate,
    selectedStartTime,
    selectedEndTime,
    selectedInterestGroup,
    openSections,
    dateType,
    timeType,
  ]);

  // IMAGE PICKER
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setValue('image', result.assets[0].uri);
      trigger('image'); // Trigger validation after setting the image
    }
  };

  // FORM SUBMISSION - FIXED JSON FORMAT ISSUES
  const onSubmit = async (data: FormData) => {
    // Validate that a post type is selected
    if (!data.type) {
      Alert.alert('Error', 'Please select what you are creating (Post or Event).');
      return;
    }

    // Validate that an image is provided for events
    if (data.type === PostType.EVENT && !data.image) {
      Alert.alert('Error', 'Please add an image for your event.');
      return;
    }

    // Verify user is authenticated
    if (!authUser?.id) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare base post data with appropriate types for database
      const postData: {
        user_id: string;
        title: string;
        description: string;
        image: string | null;
        post_type: PostType;
        interest_id: string | null;
        location?: string;
        event_date?: ISOStringFormat | null;
      } = {
        user_id: authUser.id,
        title: data.title,
        description: data.description,
        image: data.image || '', // Ensure image is always a string
        post_type: data.type,
        interest_id: data.interestGroup || null,
      };

      // Only add location and date for events
      if (data.type === PostType.EVENT) {
        postData.location = data.location || undefined;

        // Format event date if available
        if (data.startDate) {
          const eventDate = new Date(data.startDate);
          if (data.startTime) {
            eventDate.setHours(data.startTime.getHours());
            eventDate.setMinutes(data.startTime.getMinutes());
            eventDate.setSeconds(0);
          }

          postData.event_date = eventDate.toISOString() as ISOStringFormat;
        }
      }

      console.log('Submitting post data:', postData);

      // Direct approach without the object wrapper - this matches the function signature in data.ts
      const createdPost = await createPost({
        postData: {
          ...postData,
          image: postData.image ?? '',
          interest_id: postData.interest_id ?? '',
          event_date: postData.event_date ?? undefined,
        },
        initializePopularity: true,
      });

      console.log('Post created successfully:', createdPost);

      // Reset form and state
      reset();
      setPostType(null);
      setDateType('single');
      setTimeType('single');
      setOpenSections({
        type: true,
        basicInfo: false,
        location: false,
        date: false,
        time: false,
        interest: false,
        image: false,
      });

      // Success message and navigation
      Alert.alert(
        'Success',
        `Your ${data.type === PostType.NOTE ? 'post' : 'event'} has been created successfully!`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/home') }]
      );
      triggerReload();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if image is required based on post type
  const isImageRequired = postType === PostType.EVENT;

  // Check if form is valid for submission
  const isFormValid = () => {
    // Basic validation - must have type, title, description, and interest
    if (
      !postType ||
      !title ||
      title.length < 1 ||
      !description ||
      description.length < 1 ||
      !selectedInterestGroup
    ) {
      return false;
    }

    // Additional validation for events
    if (postType === PostType.EVENT) {
      if (!location) return false;
      if (!selectedStartDate) return false;
      if (dateType === 'range' && !selectedEndDate) return false;
      if (!selectedStartTime) return false;
      if (timeType === 'range' && !selectedEndTime) return false;
      if (isImageRequired && !imageUri) return false;
    }

    return true;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}>
        <View style={styles.card}>
          {/* POST TYPE SECTION */}
          <AccordionSection
            title="What are you creating?"
            isRequired={true}
            isOpen={openSections.type}
            onToggle={() => toggleSection('type')}>
            <View style={styles.radioGroup}>
              <Pressable
                style={[
                  styles.radioButton,
                  postType === PostType.NOTE && styles.radioButtonSelected,
                ]}
                onPress={() => {
                  setPostType(PostType.NOTE);
                  setValue('type', PostType.NOTE);
                }}>
                <Text
                  style={[
                    styles.radioText,
                    postType === PostType.NOTE && styles.radioTextSelected,
                  ]}>
                  Post
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.radioButton,
                  postType === PostType.EVENT && styles.radioButtonSelected,
                ]}
                onPress={() => {
                  setPostType(PostType.EVENT);
                  setValue('type', PostType.EVENT);
                }}>
                <Text
                  style={[
                    styles.radioText,
                    postType === PostType.EVENT && styles.radioTextSelected,
                  ]}>
                  Event
                </Text>
              </Pressable>
            </View>
          </AccordionSection>

          {/* BASIC INFO SECTION */}
          <AccordionSection
            title="Basic Information"
            icon="information-circle-outline"
            isRequired={true}
            isOpen={openSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <Controller
                control={control}
                rules={{
                  required: 'Title is required',
                  minLength: { value: 1, message: 'Title must be at least 1 character' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    keyboardType="default"
                    autoCapitalize="words"
                    autoFocus={true}
                    style={styles.input}
                    onChangeText={onChange}
                    returnKeyType="next"
                    onBlur={onBlur}
                    placeholder="Enter a title"
                    autoCorrect
                    onSubmitEditing={() => descriptionRef.current?.focus()}
                  />
                )}
                name="title"
              />
              {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <Controller
                control={control}
                rules={{
                  required: 'Description is required',
                  minLength: { value: 1, message: 'Description must be at least 1 character' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    ref={descriptionRef}
                    placeholder="Write your content here..."
                    multiline
                    autoCapitalize="sentences"
                    autoCorrect
                    maxLength={255}
                  />
                )}
                name="description"
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description.message}</Text>
              )}
            </View>
          </AccordionSection>

          {/* EVENT FIELDS */}
          {postType === PostType.EVENT && (
            <>
              {/* LOCATION SECTION */}
              <AccordionSection
                title="Location"
                icon="location-outline"
                isRequired={true}
                isOpen={openSections.location}
                onToggle={() => toggleSection('location')}>
                <Controller
                  control={control}
                  rules={{ required: 'Location is required for events' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Enter event location"
                    />
                  )}
                  name="location"
                />
                {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}
              </AccordionSection>

              {/* DATE SECTION */}
              <AccordionSection
                title="Date"
                icon="calendar-outline"
                isRequired={true}
                isOpen={openSections.date}
                onToggle={() => toggleSection('date')}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Range</Text>
                  <Switch
                    value={dateType === 'range'}
                    onValueChange={(value) => {
                      const newDateType = value ? 'range' : 'single';
                      setDateType(newDateType);
                      setValue('dateType', newDateType);
                    }}
                    trackColor={{ false: '#ddd', true: '#14b8a6' }}
                    thumbColor={'white'}
                  />
                </View>

                {/* START DATE PICKER */}
                <Pressable
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedStartDate
                      ? format(selectedStartDate, 'MMMM d, yyyy')
                      : dateType === 'single'
                        ? 'Select a date'
                        : 'Select start date'}
                  </Text>
                </Pressable>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={selectedStartDate || new Date()}
                    mode="date"
                    display="inline"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setValue('startDate', selectedDate);
                        // If end date is before start date, update end date
                        if (selectedEndDate && selectedDate > selectedEndDate) {
                          setValue('endDate', selectedDate);
                        }
                      }
                    }}
                  />
                )}

                {/* END DATE PICKER (ONLY SHOWN FOR RANGE) */}
                {dateType === 'range' && (
                  <>
                    <Pressable
                      style={[styles.datePickerButton, { marginTop: 8 }]}
                      onPress={() => setShowEndDatePicker(true)}>
                      <Text style={styles.datePickerButtonText}>
                        {selectedEndDate
                          ? format(selectedEndDate, 'MMMM d, yyyy')
                          : 'Select end date'}
                      </Text>
                    </Pressable>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={selectedEndDate || selectedStartDate || new Date()}
                        mode="date"
                        display="inline"
                        minimumDate={selectedStartDate}
                        onChange={(event, selectedDate) => {
                          setShowEndDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            setValue('endDate', selectedDate);
                          }
                        }}
                      />
                    )}
                  </>
                )}
                {errors.startDate && (
                  <Text style={styles.errorText}>{errors.startDate.message}</Text>
                )}
                {errors.endDate && <Text style={styles.errorText}>{errors.endDate.message}</Text>}
              </AccordionSection>

              {/* TIME SECTION */}
              <AccordionSection
                title="Time"
                icon="time-outline"
                isRequired={true}
                isOpen={openSections.time}
                onToggle={() => toggleSection('time')}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Range</Text>
                  <Switch
                    value={timeType === 'range'}
                    onValueChange={(value) => {
                      const newTimeType = value ? 'range' : 'single';
                      setTimeType(newTimeType);
                      setValue('timeType', newTimeType);
                    }}
                    trackColor={{ false: '#ddd', true: '#14b8a6' }}
                    thumbColor={'white'}
                  />
                </View>

                {/* START TIME PICKER */}
                <Pressable
                  style={styles.datePickerButton}
                  onPress={() => setShowStartTimePicker(true)}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedStartTime
                      ? format(selectedStartTime, 'h:mm a')
                      : timeType === 'single'
                        ? 'Select a time'
                        : 'Select start time'}
                  </Text>
                </Pressable>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={selectedStartTime || new Date()}
                    mode="time"
                    display="inline"
                    onChange={(event, selectedTime) => {
                      setShowStartTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setValue('startTime', selectedTime);
                        // If end time is before start time, update end time
                        if (
                          selectedEndTime &&
                          selectedTime.getHours() > selectedEndTime.getHours()
                        ) {
                          setValue('endTime', selectedTime);
                        }
                      }
                    }}
                  />
                )}

                {/* END TIME PICKER (ONLY SHOWN FOR RANGE) */}
                {timeType === 'range' && (
                  <>
                    <Pressable
                      style={[styles.datePickerButton, { marginTop: 8 }]}
                      onPress={() => setShowEndTimePicker(true)}>
                      <Text style={styles.datePickerButtonText}>
                        {selectedEndTime ? format(selectedEndTime, 'h:mm a') : 'Select end time'}
                      </Text>
                    </Pressable>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={selectedEndTime || selectedStartTime || new Date()}
                        mode="time"
                        display="inline"
                        onChange={(event, selectedTime) => {
                          setShowEndTimePicker(Platform.OS === 'ios');
                          if (selectedTime) {
                            setValue('endTime', selectedTime);
                          }
                        }}
                      />
                    )}
                  </>
                )}
                {errors.startTime && (
                  <Text style={styles.errorText}>{errors.startTime.message}</Text>
                )}
                {errors.endTime && <Text style={styles.errorText}>{errors.endTime.message}</Text>}
              </AccordionSection>
            </>
          )}

          {/* INTEREST SECTION - UPDATED TO USE DATABASE INTERESTS */}
          <AccordionSection
            title="Interest Group"
            icon="people-outline"
            isRequired={true}
            isOpen={openSections.interest}
            onToggle={() => toggleSection('interest')}>
            {loadingInterests ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#00AF9F" />
                <Text style={styles.loadingText}>Loading your interests...</Text>
              </View>
            ) : interests.length > 0 ? (
              <View style={styles.interestContainer}>
                {interests.map((interest) => (
                  <Pressable
                    key={interest.id}
                    style={[
                      styles.interestToggle,
                      selectedInterestGroup === interest.id && styles.interestToggleSelected,
                    ]}
                    onPress={() => {
                      setValue('interestGroup', interest.id);
                    }}>
                    <Text
                      style={[
                        styles.interestToggleText,
                        selectedInterestGroup === interest.id && styles.interestToggleTextSelected,
                      ]}>
                      {interest.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.noInterestsText}>
                You don't have any interests yet. Add interests in your profile settings.
              </Text>
            )}
            {errors.interestGroup && (
              <Text style={styles.errorText}>{errors.interestGroup.message}</Text>
            )}
          </AccordionSection>

          {/* IMAGE SECTION */}
          <AccordionSection
            title="Add Photo"
            icon="image-outline"
            isRequired={isImageRequired}
            isOpen={openSections.image}
            onToggle={() => toggleSection('image')}>
            <Text style={styles.imageDescription}>
              {isImageRequired
                ? 'An image is required for events to help attendees identify your event.'
                : 'Adding an image to your post is optional but recommended.'}
            </Text>

            {authUser?.id ? (
              <SupabaseImageUploader
                bucketName="images"
                userId={authUser.id}
                onUploadComplete={(imageUrl) => {
                  setValue('image', imageUrl);
                  trigger('image'); // Trigger validation after setting the image
                }}
                existingImageUrl={imageUri}
                placeholderLabel="Choose an image"
                imageSize={200}
                aspectRatio={[4, 3]}
                folder={'posts'}
              />
            ) : (
              <Text style={styles.errorText}>You must be logged in to upload images</Text>
            )}

            {isImageRequired && !imageUri && (
              <Text style={styles.imageRequiredText}>Please add an image for your event</Text>
            )}
          </AccordionSection>

          {/* FORM ACTIONS */}
          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                reset();
                setPostType(null);
                setDateType('single');
                setTimeType('single');
                // Reset open sections to initial state
                setOpenSections({
                  type: true,
                  basicInfo: false,
                  location: false,
                  date: false,
                  time: false,
                  interest: false,
                  image: false,
                });
              }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isFormValid()}>
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {postType
                    ? postType === PostType.NOTE
                      ? 'Create Post'
                      : 'Create Event'
                    : 'Create'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
        {/* Add some bottom padding to ensure the submit button is visible */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Platform.OS === 'ios' ? 10 : 8,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 100, // More padding for Android
  },
  card: {
    width: '100%',
    borderRadius: Platform.OS === 'ios' ? 50 : 25, // Less extreme radius for Android
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Rest of your styles...

  // New styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  noInterestsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },

  // Keep all your existing styles
  cardTitle: {
    fontSize: 22,
    fontFamily: 'SFProDisplayBold',
    marginBottom: 20,
    color: '#333',
  },
  // Accordion styles
  accordionSection: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fdfdfd ',
  },
  accordionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIcon: {
    marginRight: 8,
  },
  accordionTitle: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'SFProTextSemiBold' : 'sans-serif-medium',
    color: '#333',
  },
  requiredIndicator: {
    color: '#F39237',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  accordionContent: {
    padding: 12,
    backgroundColor: 'white',
  },
  // Original styles
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SFProTextSemiBold' : 'sans-serif-medium',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'android' ? 10 : 12, // Fix Android text alignment
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#00AF9F',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: 'white',
  },
  radioButtonSelected: {
    backgroundColor: '#00AF9F',
    borderColor: '#00AF9F',
  },
  radioText: {
    fontSize: 16,
    color: '#00AF9F',
    fontFamily: Platform.OS === 'ios' ? 'SFProTextMedium' : 'sans-serif-medium',
  },
  radioTextSelected: {
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'SFProTextMedium' : 'sans-serif-medium',
    fontSize: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    backgroundColor: '#fafafa',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#666',
  },
  imageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  imageRequiredText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  imagePreviewContainer: {
    marginTop: 10,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'SFProTextMedium' : 'sans-serif-medium',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  submitButton: {
    backgroundColor: '#00AF9F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'SFProTextMedium' : 'sans-serif-medium',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  interestContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  interestToggle: {
    borderWidth: 1,
    borderColor: '#00AF9F',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: 'white',
    minWidth: isSmallDevice ? 80 : 100,
  },
  interestToggleSelected: {
    backgroundColor: '#00AF9F',
    borderColor: '#00AF9F',
  },
  interestToggleText: {
    fontSize: 14,
    color: '#00AF9F',
    fontFamily: Platform.OS === 'ios' ? 'SFProTextMedium' : 'sans-serif-medium',
  },
  interestToggleTextSelected: {
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'SFProTextMedium' : 'sans-serif-medium',
  },
});

export default AddPostForm;
