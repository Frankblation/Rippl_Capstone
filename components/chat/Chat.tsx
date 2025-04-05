import { StreamChat } from "stream-chat";
import { ChannelList, Chat, OverlayProvider } from "stream-chat-expo";
const client = StreamChat.getInstance("9wbpcdvydjaw");

export const ChatApp = () => (
  <OverlayProvider>
    <Chat client={client}>
      <ChannelList />
    </Chat>
  </OverlayProvider>
);