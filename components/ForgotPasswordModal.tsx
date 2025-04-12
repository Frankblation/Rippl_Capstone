import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '~/utils/supabase';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

      const { notificationAsync, NotificationFeedbackType } = await import('expo-haptics');

      if (error) {
        await notificationAsync(NotificationFeedbackType.Error);
        Alert.alert('Error', error.message);
      } else {
        await notificationAsync(NotificationFeedbackType.Success);
        Alert.alert(
          'Password Reset Email Sent',
          'Check your email for instructions to reset your password.',
          [
            {
              text: 'OK',
              onPress: () => {
                setResetEmail('');
                onClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/50">
        <View className="mx-5 rounded-xl bg-white p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-2xl font-bold">Reset Password</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="mb-4 text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <View className="mb-6 gap-y-2">
            <Text className="font-medium text-gray-700">Email</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
              placeholder="Enter your email"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ textAlignVertical: 'center', minHeight: 50 }}
            />
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            className={`w-full items-center rounded-xl py-4 ${
              isLoading ? 'bg-teal-300' : 'bg-[#00AF9F]'
            }`}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-semibold text-white">Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
