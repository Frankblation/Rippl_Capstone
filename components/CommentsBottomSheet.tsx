'use client';

import { Feather } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  useRef,
  forwardRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './providers/AuthProvider';
import { useUser } from '~/hooks/useUser';

export interface PostComment {
  id: string;
  username: string;
  userAvatar: any;
  text: string;
  timePosted: string;
}

export interface CommentsBottomSheetProps {
  comments: PostComment[];
  commentsCount: number;
  onAddComment: (text: string) => void;
  isLoading?: boolean;
}

export interface CommentsBottomSheetRef {
  open: () => void;
  close: () => void;
}

const CommentsBottomSheet = forwardRef<CommentsBottomSheetRef, CommentsBottomSheetProps>(
  ({ comments, commentsCount, onAddComment, isLoading = false }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const inputRef = useRef<any>(null);
    const [newCommentText, setNewCommentText] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const snapPoints = useMemo(() => ['50%', '75%'], []);

    const insets = useSafeAreaInsets();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Get authenticated user ID from auth hook
    const { user: authUser } = useAuth();

    // Use our custom hook to get full user data
    const { user } = useUser(authUser?.id || null);

    useEffect(() => {
      const keyboardWillShowListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          setIsKeyboardVisible(true);
        }
      );
      const keyboardWillHideListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }
      );

      return () => {
        keyboardWillShowListener.remove();
        keyboardWillHideListener.remove();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.expand();
      },
      close: () => {
        bottomSheetRef.current?.close();
      },
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    const handleAddComment = () => {
      if (newCommentText.trim()) {
        onAddComment(newCommentText);
        setNewCommentText('');
        Keyboard.dismiss();
      }
    };

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        // Sheet is closed, dismiss keyboard
        Keyboard.dismiss();
      }
    }, []);

    const bottomPadding = Math.max(insets.bottom, 10);

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={styles.bottomSheetIndicator}
        handleStyle={styles.bottomSheetHandle}
        style={styles.bottomSheet}
        keyboardBlurBehavior="restore"
        bottomInset={bottomPadding}
        detached
        enableContentPanningGesture
        enableHandlePanningGesture
        onChange={handleSheetChanges}>
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Comments </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0098FD" />
            </View>
          ) : (
            <BottomSheetScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.commentsScrollViewContent,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {comments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentContainer}>
                    <Image source={comment.userAvatar} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>{comment.username}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentTime}>{comment.timePosted}</Text>
                    </View>
                  </View>
                ))
              )}
            </BottomSheetScrollView>
          )}
        </BottomSheetView>

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: Math.max(insets.bottom, 8),
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: '#dbdbdb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 3,
            },
          ]}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.commentInputAvatar} />
          ) : (
            <View style={[styles.commentInputAvatar, styles.placeholderAvatar]}>
              <Feather name="user" size={16} color="#8e8e8e" />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <BottomSheetTextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder="Add comment..."
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
              maxLength={1000}
              placeholderTextColor="#8e8e8e"
            />
            {newCommentText.trim() && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleAddComment}
                activeOpacity={0.7}>
                <Feather name="arrow-up" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  contentContainer: {
    flex: 1,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d1d1',
    borderRadius: 2,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dbdbdb',
    backgroundColor: 'white',
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#262626',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  commentsScrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  commentContent: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#262626',
  },
  commentText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
    color: '#262626',
  },
  commentTime: {
    fontSize: 12,
    color: '#8e8e8e',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 10,
    elevation: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#F5F5F5',
    borderColor: '#EFEFEF',
    borderWidth: 1,
    borderRadius: 24,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 44,
    color: '#262626',
  },
  sendButton: {
    position: 'absolute',
    right: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    backgroundColor: '#0098FD',
    borderRadius: 16,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  placeholderAvatar: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCommentsContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#8e8e8e',
    textAlign: 'center',
  },
});

export default CommentsBottomSheet;
