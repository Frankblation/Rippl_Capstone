'use client';

import type React from 'react';
import { format, type ISOStringFormat } from 'date-fns';
import { useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { addPostToFeeds } from '~/hooks/useFeed';
import * as ExpoCalendar from 'expo-calendar';
import { formatPostsForUI } from '~/utils/formatPosts';
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
  TouchableOpacity,
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
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionRef = useRef<TextInput>(null);

  // Add this state for calendar error handling
  const [calendarError, setCalendarError] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);

  // Calendar marked dates state
  const [markedDates, setMarkedDates] = useState<any>({});

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

  // Add this function to request calendar permissions
  const requestCalendarPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
        setHasCalendarPermission(status === 'granted');

        if (status === 'granted') {
          // Check if there are any calendars available
          const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
          if (calendars.length === 0) {
            setCalendarError(true);
          }
        }
      } catch (error) {
        console.error('Error requesting calendar permissions:', error);
        setCalendarError(true);
      }
    }
  };

  // Call the permission request on component mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestCalendarPermissions();
    }
  }, []);

  const handleManualDateSelection = (date: Date) => {
    if (dateType === 'single') {
      setValue('startDate', date);
      setValue('endDate', date);
    } else {
      // Range selection logic
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        setValue('startDate', date);
        setValue('endDate', undefined);
      } else if (selectedStartDate && !selectedEndDate) {
        if (date < selectedStartDate) {
          setValue('endDate', selectedStartDate);
          setValue('startDate', date);
        } else {
          setValue('endDate', date);
        }
      }
    }
  };

  // Create a function to render the calendar or fallback
  const renderCalendar = () => {
    if (Platform.OS === 'android' && calendarError) {
      // Fallback UI for Android when calendar fails
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);

      // Generate dates for the current month
      const dates = [];
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentMonth);
        date.setDate(i);
        dates.push(date);
      }

      return (
        <View style={styles.calendarFallback}>
          <Text style={styles.calendarFallbackTitle}>Select a date for your event:</Text>
          <Text style={styles.calendarFallbackMonth}>{format(today, 'MMMM yyyy')}</Text>
          <View style={styles.calendarFallbackGrid}>
            {dates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = markedDates[dateStr];
              const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarFallbackDay,
                    isSelected && styles.calendarFallbackDaySelected,
                    isPastDate && styles.calendarFallbackDayDisabled,
                  ]}
                  onPress={() => !isPastDate && handleManualDateSelection(date)}
                  disabled={isPastDate}>
                  <Text
                    style={[
                      styles.calendarFallbackDayText,
                      isSelected && styles.calendarFallbackDayTextSelected,
                      isPastDate && styles.calendarFallbackDayTextDisabled,
                    ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // Default calendar UI
    try {
      return (
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          minDate={new Date().toISOString().split('T')[0]}
          markingType={dateType === 'range' ? 'period' : 'custom'}
          theme={{
            todayTextColor: '#00AF9F',
            selectedDayBackgroundColor: '#00AF9F',
            selectedDayTextColor: '#ffffff',
            arrowColor: '#00AF9F',
          }}
          // Add these props to prevent system calendar access issues on Android
          disableAllTouchEventsForDisabledDays={true}
          disableAllTouchEventsForInactiveDays={true}
          enableSwipeMonths={true}
        />
      );
    } catch (error) {
      console.error('Calendar render error:', error);
      setCalendarError(true);
      // Return the fallback UI if there's an error
      return (
        <View style={styles.calendarError}>
          <Text style={styles.calendarErrorText}>
            Calendar could not be loaded. Please try again or select dates manually.
          </Text>
        </View>
      );
    }
  };

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

  // Update marked dates when start or end date changes
  useEffect(() => {
    const newMarkedDates: any = {};

    if (selectedStartDate) {
      const startDateStr = selectedStartDate.toISOString().split('T')[0];

      if (dateType === 'single') {
        newMarkedDates[startDateStr] = { selected: true, selectedColor: '#00AF9F' };
      } else if (dateType === 'range') {
        newMarkedDates[startDateStr] = {
          selected: true,
          startingDay: true,
          color: '#00AF9F',
        };

        if (selectedEndDate) {
          const endDateStr = selectedEndDate.toISOString().split('T')[0];
          newMarkedDates[endDateStr] = {
            selected: true,
            endingDay: true,
            color: '#00AF9F',
          };

          // Fill in dates between start and end
          const start = new Date(selectedStartDate);
          const end = new Date(selectedEndDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];

            if (dateStr !== startDateStr && dateStr !== endDateStr) {
              newMarkedDates[dateStr] = {
                selected: true,
                color: '#00AF9F',
                textColor: 'white',
              };
            }
          }
        }
      }
    }

    setMarkedDates(newMarkedDates);
  }, [selectedStartDate, selectedEndDate, dateType]);

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

  // Calendar date selection handler
  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);

    if (dateType === 'single') {
      setValue('startDate', selectedDate);
      setValue('endDate', selectedDate); // For single date, end date is same as start date
    } else {
      // Range selection logic
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        // If no dates selected or both dates already selected, set as new start date
        setValue('startDate', selectedDate);
        setValue('endDate', undefined);
      } else if (selectedStartDate && !selectedEndDate) {
        // If only start date is selected
        if (selectedDate < selectedStartDate) {
          // If selected date is before start date, swap them
          setValue('endDate', selectedStartDate);
          setValue('startDate', selectedDate);
        } else {
          // Normal case: set end date
          setValue('endDate', selectedDate);
        }
      }
    }
  };

  // Time picker handlers
  const showStartTimePicker = () => {
    setStartTimePickerVisible(true);
  };

  const hideStartTimePicker = () => {
    setStartTimePickerVisible(false);
  };

  const handleStartTimeConfirm = (time: Date) => {
    setValue('startTime', time);
    hideStartTimePicker();

    // If end time is before start time, update end time
    if (selectedEndTime && time.getHours() > selectedEndTime.getHours()) {
      setValue('endTime', time);
    }
  };

  const showEndTimePicker = () => {
    setEndTimePickerVisible(true);
  };

  const hideEndTimePicker = () => {
    setEndTimePickerVisible(false);
  };

  const handleEndTimeConfirm = (time: Date) => {
    setValue('endTime', time);
    hideEndTimePicker();
  };

  // FORM SUBMISSION
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
        created_at?: string;
      } = {
        user_id: authUser.id,
        title: data.title,
        description: data.description,
        image: data.image || '', // Ensure image is always a string
        post_type: data.type,
        interest_id: data.interestGroup || null,
        created_at: new Date().toISOString(),
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
          created_at: postData.created_at ?? new Date().toISOString(),
        },
        initializePopularity: true,
      });

      // Format the post for UI and add it to feeds
      const formattedPosts = await formatPostsForUI([createdPost]);
      if (formattedPosts.length > 0) {
        // Add the post to the top of relevant feeds
        addPostToFeeds(formattedPosts[0]);
      }

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

                      if (!value && selectedEndDate) {
                        setValue('endDate', selectedStartDate);
                      }
                    }}
                    trackColor={{ false: '#ddd', true: '#14b8a6' }}
                    thumbColor={'white'}
                  />
                </View>

                {/* Calendar */}
                <View style={styles.calendarContainer}>{renderCalendar()}</View>

                {/* Display selected dates */}
                <View style={styles.selectedDatesContainer}>
                  {selectedStartDate && (
                    <Text style={styles.selectedDateText}>
                      {dateType === 'single'
                        ? `Selected date: ${format(selectedStartDate, 'MMMM d, yyyy')}`
                        : `Start date: ${format(selectedStartDate, 'MMMM d, yyyy')}`}
                    </Text>
                  )}
                  {dateType === 'range' && selectedEndDate && (
                    <Text style={styles.selectedDateText}>
                      End date: {format(selectedEndDate, 'MMMM d, yyyy')}
                    </Text>
                  )}
                </View>

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

                {/* START TIME PICKER - Improved styling */}
                <Pressable
                  style={[styles.datePickerButton, selectedStartTime && styles.datePickerButton]}
                  onPress={showStartTimePicker}>
                  <Text
                    style={[
                      styles.datePickerButtonText,
                      selectedStartTime && styles.datePickerButtonText,
                    ]}>
                    {selectedStartTime
                      ? format(selectedStartTime, 'h:mm a')
                      : timeType === 'single'
                        ? 'Select a time'
                        : 'Select start time'}
                  </Text>
                </Pressable>

                <DateTimePickerModal
                  isVisible={isStartTimePickerVisible}
                  mode="time"
                  onConfirm={handleStartTimeConfirm}
                  onCancel={hideStartTimePicker}
                  date={selectedStartTime || new Date()}
                  // Add theme properties for better visibility
                  themeVariant="light"
                  isDarkModeEnabled={false}
                />

                {/* END TIME PICKER (ONLY SHOWN FOR RANGE) - Improved styling */}
                {timeType === 'range' && (
                  <>
                    <Pressable
                      style={[
                        styles.datePickerButton,
                        { marginTop: 8 },
                        selectedEndTime && styles.datePickerButton,
                      ]}
                      onPress={showEndTimePicker}>
                      <Text
                        style={[
                          styles.datePickerButtonText,
                          selectedEndTime && styles.datePickerButtonText,
                        ]}>
                        {selectedEndTime ? format(selectedEndTime, 'h:mm a') : 'Select end time'}
                      </Text>
                    </Pressable>

                    <DateTimePickerModal
                      isVisible={isEndTimePickerVisible}
                      mode="time"
                      onConfirm={handleEndTimeConfirm}
                      onCancel={hideEndTimePicker}
                      date={selectedEndTime || selectedStartTime || new Date()}
                      // Add theme properties for better visibility
                      themeVariant="light"
                      isDarkModeEnabled={false}
                    />
                  </>
                )}

                {errors.startTime && (
                  <Text style={styles.errorText}>{errors.startTime.message}</Text>
                )}
                {errors.endTime && <Text style={styles.errorText}>{errors.endTime.message}</Text>}
              </AccordionSection>
            </>
          )}

          {/* INTEREST SECTION */}
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
                  trigger('image');
                }}
                existingImageUrl={imageUri}
                placeholderLabel="Choose an image"
                imageSize={200}
                aspectRatio={[4, 3]}
                folder={'posts'}
                updateUserProfile={false} // Add this property to explicitly prevent user profile updates
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
    paddingBottom: Platform.OS === 'ios' ? 80 : 100,
  },
  card: {
    width: '100%',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 20,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  calendarContainer: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedDatesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  // Rest of your styles...
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

  cardTitle: {
    fontSize: 22,
    fontFamily: 'SFProDisplayBold',
    marginBottom: 20,
    color: '#333',
  },
  // Update accordion section styling
  accordionSection: {
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? '#eee' : '#e0e0e0',
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'white',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: Platform.OS === 'ios' ? '#fdfdfd' : 'white',
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
    padding: Platform.OS === 'ios' ? 12 : 16,
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
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    padding: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    backgroundColor: 'white',
    // Add this for Android text inputs
    ...(Platform.OS === 'android' && {
      paddingVertical: 8,
    }),
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'android' ? 8 : 12,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#00AF9F',
    borderRadius: Platform.OS === 'ios' ? 10 : 4,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
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
    marginBottom: Platform.OS === 'android' ? 16 : 0,
  },
  cancelButton: {
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 20,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 20,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
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
  calendarFallback: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  calendarFallbackTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  calendarFallbackMonth: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    color: '#00AF9F',
    textAlign: 'center',
  },
  calendarFallbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarFallbackDay: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
  },
  calendarFallbackDaySelected: {
    backgroundColor: '#00AF9F',
  },
  calendarFallbackDayDisabled: {
    opacity: 0.3,
  },
  calendarFallbackDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarFallbackDayTextSelected: {
    color: 'white',
  },
  calendarFallbackDayTextDisabled: {
    color: '#999',
  },
  calendarError: {
    padding: 20,
    backgroundColor: '#fff8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffdddd',
    alignItems: 'center',
  },
  calendarErrorText: {
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 14,
  },
});
export default AddPostForm;
