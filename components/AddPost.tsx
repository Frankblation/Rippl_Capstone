'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
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
} from 'react-native';

type PostType = 'post' | 'event';

interface FormData {
  type: PostType;
  title: string;
  description: string;
  location?: string;
  date?: Date;
  time?: Date;
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

const AddPostForm = () => {
  const [postType, setPostType] = useState<PostType>('post');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      type: 'post',
      title: '',
      description: '',
      location: '',
      date: undefined,
      time: undefined,
      interestGroup: '',
      image: null,
    },
  });

  const selectedDate = watch('date');
  const selectedTime = watch('time');
  const selectedInterestGroup = watch('interestGroup');
  const imageUri = watch('image');

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
    }
  };

  // FORM SUBMISSION
  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);

    // SIM API CAL
    setTimeout(() => {
      console.log('Form submitted:', data);

      // RESET AFTER SUBMISSION
      reset();
      setPostType('post');
      setIsSubmitting(false);

      Alert.alert('Success', `Your ${postType} has been created successfully!`, [{ text: 'OK' }]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New {postType === 'post' ? 'Post' : 'Event'}</Text>

          {/* POST TYPE (POST, EVENT, STILL NEED TO ADD CLASS ) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>What are you creating?</Text>
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
          </View>

          {/* TITLE INPUT */}
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

          {/* DESCRIPTION INPUT */}
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

          {/* EVENT FIELDS */}
          {postType === 'event' && (
            <>
              {/* LOCATION INPUT */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons name="location-outline" size={16} /> Location
                </Text>
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
              </View>

              {/* DATE PICKER */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons name="calendar-outline" size={16} /> Date
                </Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setValue('date', selectedDate);
                      }
                    }}
                  />
                )}
                {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
              </View>

              {/* TIME PICKER */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons name="time-outline" size={16} /> Time
                </Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedTime ? format(selectedTime, 'h:mm a') : 'Select a time'}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setValue('time', selectedTime);
                      }
                    }}
                  />
                )}
                {errors.time && <Text style={styles.errorText}>{errors.time.message}</Text>}
              </View>
            </>
          )}

          {/* INTEREST SELECTOR */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Interest Group</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowInterestPicker(!showInterestPicker)}>
              <Text style={styles.selectButtonText}>
                {selectedInterestGroup || 'Select an interest group'}
              </Text>
              <Ionicons
                name={showInterestPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#666"
              />
            </TouchableOpacity>

            {showInterestPicker && (
              <View style={styles.dropdownMenu}>
                {interestGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setValue('interestGroup', group);
                      setShowInterestPicker(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedInterestGroup === group && styles.dropdownItemTextSelected,
                      ]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.interestGroup && (
              <Text style={styles.errorText}>{errors.interestGroup.message}</Text>
            )}
          </View>

          {/* IMAGE PICKER */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <Ionicons name="image-outline" size={16} /> Add Photo (Optional)
            </Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={24} color="#666" />
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
          </View>

          {/* FORM ACTIONS */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                reset();
                setPostType('post');
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
                  {postType === 'post' ? 'Create Post' : 'Create Event'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
    paddingHorizontal: 10,
  },

  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
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
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: '#fafafa',
  },
  radioButtonSelected: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  radioTextSelected: {
    color: 'white',
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
  selectButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#666',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#666',
  },
  dropdownItemTextSelected: {
    color: '#14b8a6',
    fontWeight: 'bold',
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
    marginTop: 10,
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
  },
  submitButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default AddPostForm;
