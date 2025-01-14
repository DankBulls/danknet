import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Badge,
  Button,
  Box
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const MessagingContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  gap: theme.spacing(3),
  padding: theme.spacing(4)
}));

const ContactsList = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: 'auto'
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3)
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

const MessageBubble = styled(Box)(({ theme, sent }) => ({
  maxWidth: '70%',
  padding: theme.spacing(2),
  margin: `${theme.spacing(1)} 0`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: sent 
    ? theme.palette.primary.main
    : theme.palette.background.default,
  color: sent
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  alignSelf: sent ? 'flex-end' : 'flex-start'
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: `${theme.palette.secondary.main} !important`,
  
  '&:hover': {
    color: `${theme.palette.primary.main} !important`
  }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  }
}));

const StyledListItem = styled(ListItem)(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const mockContacts = [
  {
    id: 1,
    name: 'John Doe',
    lastMessage: 'Found some fresh tracks near Two Elk Trail',
    unread: 2,
    avatar: 'J'
  },
  {
    id: 2,
    name: 'Sarah Smith',
    lastMessage: 'Weather looks good for this weekend',
    unread: 0,
    avatar: 'S'
  },
  {
    id: 3,
    name: 'Hunting Group',
    lastMessage: "Who's up for scouting on Sunday?",
    unread: 5,
    avatar: 'H'
  }
];

const mockMessages = [
  {
    id: 1,
    text: 'Hey, spotted some fresh tracks near Two Elk Trail',
    sent: false,
    timestamp: '10:30 AM'
  },
  {
    id: 2,
    text: 'Thanks for the heads up! What time did you see them?',
    sent: true,
    timestamp: '10:32 AM'
  },
  {
    id: 3,
    text: 'Around 7 AM this morning. Looks like multiple deer passed through.',
    sent: false,
    timestamp: '10:35 AM'
  }
];

const Messaging = () => {
  const [selectedContact, setSelectedContact] = useState(mockContacts[0]);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      // In a real app, this would send the message to a backend
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <MessagingContainer>
      <ContactsList elevation={2}>
        <Typography variant="h6" gutterBottom>
          Messages
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {mockContacts.map((contact) => (
            <StyledListItem
              key={contact.id}
              selected={selectedContact.id === contact.id}
              onClick={() => setSelectedContact(contact)}
              button
            >
              <ListItemAvatar>
                <Avatar>{contact.avatar}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={contact.name}
                secondary={contact.lastMessage}
                primaryTypographyProps={{
                  variant: 'subtitle1',
                  fontWeight: contact.unread ? 'bold' : 'normal'
                }}
              />
              {contact.unread > 0 && (
                <StyledBadge badgeContent={contact.unread} color="primary" />
              )}
            </StyledListItem>
          ))}
        </List>
      </ContactsList>

      <ChatContainer elevation={2}>
        <Typography variant="h6" gutterBottom>
          {selectedContact.name}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <MessagesArea>
          {mockMessages.map((msg) => (
            <MessageBubble key={msg.id} sent={msg.sent}>
              <Typography variant="body1">{msg.text}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {msg.timestamp}
              </Typography>
            </MessageBubble>
          ))}
        </MessagesArea>

        <InputArea>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            size="small"
          />
          <ActionButton>
            <AttachFileIcon />
          </ActionButton>
          <ActionButton>
            <ImageIcon />
          </ActionButton>
          <ActionButton>
            <LocationIcon />
          </ActionButton>
          <ActionButton onClick={handleSend} color="primary">
            <SendIcon />
          </ActionButton>
        </InputArea>
      </ChatContainer>
    </MessagingContainer>
  );
};

export default Messaging;
