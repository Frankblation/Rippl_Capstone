import { Feather } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
  useRef,
  forwardRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
}

export interface CommentsBottomSheetRef {
  open: () => void;
  close: () => void;
}

const CommentsBottomSheet = forwardRef<CommentsBottomSheetRef, CommentsBottomSheetProps>(
  ({ comments, onAddComment }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const inputRef = useRef<any>(null);
    const [newCommentText, setNewCommentText] = useState('');
    const snapPoints = useMemo(() => ['75%'], []);
    const insets = useSafeAreaInsets();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
      const keyboardWillShowListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const keyboardWillHideListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
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
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
      []
    );

    const handleAddComment = () => {
      if (newCommentText.trim()) {
        onAddComment(newCommentText);
        setNewCommentText('');
      }
    };

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
        style={styles.bottomSheet}
        keyboardBlurBehavior="restore"
        bottomInset={bottomPadding}
        detached
        enableContentPanningGesture={false}
        enableHandlePanningGesture>
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Comments</Text>
          </View>

          <BottomSheetScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.commentsScrollViewContent,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentContainer}>
                <Image source={comment.userAvatar} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUsername}>{comment.username}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>{comment.timePosted}</Text>
                </View>
              </View>
            ))}
          </BottomSheetScrollView>
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
            },
          ]}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/68.jpg' }}
            style={styles.commentInputAvatar}
          />
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
              <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
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
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
  },
  bottomSheetIndicator: {
    width: 40,
    backgroundColor: '#d1d1d1',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dbdbdb',
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  scrollView: {
    flex: 1,
  },
  commentsScrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: { flex: 1 },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  commentText: { fontSize: 14, marginBottom: 4 },
  commentTime: { fontSize: 12, color: '#8e8e8e' },
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
    backgroundColor: '#FFFFFF',
    borderColor: '#DBDBDB',
    borderWidth: 1,
    borderRadius: 20,
  },
  commentInput: {
    flex: 1,
    minHeight: 30,
    maxHeight: 100,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 40,
    color: '#000000',
  },
  sendButton: {
    position: 'absolute',
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: '70%',
    paddingHorizontal: 8,
    backgroundColor: '#0098FD',
    borderRadius: 20,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
});

export default CommentsBottomSheet;
