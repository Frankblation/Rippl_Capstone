'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
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
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';

type PostType = 'post' | 'event' | null;
type DateTimeType = 'single' | 'range';

interface FormData {
  type: PostType;
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

// TEMP MOCK DATA FOR INTERESTS
const interestGroups = [
  'Technology',
  'Sports',
  'Arts',
  'Music',
  'Food',
  'Travel',
  'Education',
  'Health',
  'Business',
  'Other',
];

// Accordion Section Component
const AccordionSection = ({ title, icon, children, isRequired = false, isOpen, onToggle }) => {
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
      <TouchableOpacity style={styles.accordionHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.accordionTitleContainer}>
          {icon && <Ionicons name={icon} size={18} color="#00AF9F" style={styles.accordionIcon} />}
          <Text style={styles.accordionTitle}>{title}</Text>
          {isRequired && <Text style={styles.requiredIndicator}>*</Text>}
        </View>
        <Animated.View style={iconStyle}>
          <Ionicons name="chevron-down" size={18} color="#F39237" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={contentStyle}>
        <View style={styles.accordionContent}>{children}</View>
      </Animated.View>
    </View>
  );
};

const AddPostForm = () => {
  const [postType, setPostType] = useState<PostType>(null);
  const [dateType, setDateType] = useState<DateTimeType>('single');
  const [timeType, setTimeType] = useState<DateTimeType>('single');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
      type: null,
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
    if (title && description && postType === 'event' && !openSections.location) {
      setOpenSections((prev) => ({
        ...prev,
        location: true,
      }));
    }

    // If location is filled for events, open date section
    if (postType === 'event' && location && !openSections.date) {
      setOpenSections((prev) => ({
        ...prev,
        date: true,
      }));
    }

    // If date is filled for events, open time section
    if (
      postType === 'event' &&
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
      postType === 'event' &&
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
    if (postType === 'post' && title && description && !openSections.interest) {
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

  // FORM SUBMISSION
  const onSubmit = (data: FormData) => {
    // Validate that a post type is selected
    if (!data.type) {
      Alert.alert('Error', 'Please select what you are creating (Post or Event).');
      return;
    }

    // Validate that an image is provided for events
    if (data.type === 'event' && !data.image) {
      Alert.alert('Error', 'Please add an image for your event.');
      return;
    }

    setIsSubmitting(true);

    // SIM API CALL
    setTimeout(() => {
      console.log('Form submitted:', data);

      // RESET AFTER SUBMISSION
      reset();
      setPostType(null);
      setDateType('single');
      setTimeType('single');
      setIsSubmitting(false);

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

      Alert.alert('Success', `Your ${data.type} has been created successfully!`, [{ text: 'OK' }]);
    }, 1000);
  };

  // Determine if image is required based on post type
  const isImageRequired = postType === 'event';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <TouchableOpacity
                style={[styles.radioButton, postType === 'post' && styles.radioButtonSelected]}
                onPress={() => {
                  setPostType('post');
                  setValue('type', 'post');
                }}>
                <Text style={[styles.radioText, postType === 'post' && styles.radioTextSelected]}>
                  Post
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioButton, postType === 'event' && styles.radioButtonSelected]}
                onPress={() => {
                  setPostType('event');
                  setValue('type', 'event');
                }}>
                <Text style={[styles.radioText, postType === 'event' && styles.radioTextSelected]}>
                  Event
                </Text>
              </TouchableOpacity>
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
                rules={{ required: 'Title is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter a title"
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
                rules={{ required: 'Description is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Write your content here..."
                    multiline
                    numberOfLines={4}
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
          {postType === 'event' && (
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
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedStartDate
                      ? format(selectedStartDate, 'MMMM d, yyyy')
                      : dateType === 'single'
                        ? 'Select a date'
                        : 'Select start date'}
                  </Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={selectedStartDate || new Date()}
                    mode="date"
                    display="default"
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
                    <TouchableOpacity
                      style={[styles.datePickerButton, { marginTop: 8 }]}
                      onPress={() => setShowEndDatePicker(true)}>
                      <Text style={styles.datePickerButtonText}>
                        {selectedEndDate
                          ? format(selectedEndDate, 'MMMM d, yyyy')
                          : 'Select end date'}
                      </Text>
                    </TouchableOpacity>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={selectedEndDate || selectedStartDate || new Date()}
                        mode="date"
                        display="default"
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
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartTimePicker(true)}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedStartTime
                      ? format(selectedStartTime, 'h:mm a')
                      : timeType === 'single'
                        ? 'Select a time'
                        : 'Select start time'}
                  </Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={selectedStartTime || new Date()}
                    mode="time"
                    display="default"
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
                    <TouchableOpacity
                      style={[styles.datePickerButton, { marginTop: 8 }]}
                      onPress={() => setShowEndTimePicker(true)}>
                      <Text style={styles.datePickerButtonText}>
                        {selectedEndTime ? format(selectedEndTime, 'h:mm a') : 'Select end time'}
                      </Text>
                    </TouchableOpacity>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={selectedEndTime || selectedStartTime || new Date()}
                        mode="time"
                        display="default"
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

          {/* INTEREST SECTION */}
          <AccordionSection
            title="Interest Group"
            icon="people-outline"
            isRequired={true}
            isOpen={openSections.interest}
            onToggle={() => toggleSection('interest')}>
            <View style={styles.interestContainer}>
              {interestGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.interestToggle,
                    selectedInterestGroup === group && styles.interestToggleSelected,
                  ]}
                  onPress={() => {
                    setValue('interestGroup', group);
                  }}>
                  <Text
                    style={[
                      styles.interestToggleText,
                      selectedInterestGroup === group && styles.interestToggleTextSelected,
                    ]}>
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={24} color="#00AF9F" />
              <Text style={styles.imagePickerText}>Choose an image</Text>
            </TouchableOpacity>

            {imageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setValue('image', null)}>
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {isImageRequired && !imageUri && (
              <Text style={styles.imageRequiredText}>Please add an image for your event</Text>
            )}
          </AccordionSection>

          {/* FORM ACTIONS */}
          <View style={styles.formActions}>
            <TouchableOpacity
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
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {postType ? (postType === 'post' ? 'Create Post' : 'Create Event') : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
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
    paddingHorizontal: 10,
  },
  contentContainer: {
    paddingBottom: 80, // Add extra padding at the bottom
  },
  card: {
    width: '100%',
    borderRadius: 50,

    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
    fontFamily: 'SFProTextSemiBold',
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
    fontFamily: 'SFProTextSemiBold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
    fontFamily: 'SFProTextMedium',
  },
  radioTextSelected: {
    color: 'white',
    fontFamily: 'SFProTextMedium',
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
    padding: 12,
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
    padding: 20,
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
    fontFamily: 'SFProTextMedium',
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
    fontFamily: 'SFProTextMedium',
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
  },
  interestToggleSelected: {
    backgroundColor: '#00AF9F',
    borderColor: '#00AF9F',
  },
  interestToggleText: {
    fontSize: 14,
    color: '#00AF9F',
    fontFamily: 'SFProTextMedium',
  },
  interestToggleTextSelected: {
    color: 'white',
    fontFamily: 'SFProTextMedium',
  },
});

export default AddPostForm;
