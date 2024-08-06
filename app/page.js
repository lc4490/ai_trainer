"use client"
import { Box, Stack, Typography, Button, TextField, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { createTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AssistantIcon from '@mui/icons-material/Assistant';
import TranslateIcon from '@mui/icons-material/Translate';
import i18n from './i18n'; // Adjust the path as necessary

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      bubbles: 'lightgray',
      userBubble: '#95EC69',
    },
    text: {
      primary: '#000000',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#121212',
      bubbles: '#2C2C2C',
      userBubble: '#29B560',
    },
    text: {
      primary: '#ffffff',
    },
  },
});

export default function Home() {
  const { t, i18n } = useTranslation();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  const theme = darkMode ? darkTheme : lightTheme;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('welcome') }
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setMessages([{ role: 'assistant', content: t('welcome') }]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="90vh"
        display="flex"
        flexDirection="column"
      >
        <Box
          height="10%"
          bgcolor="background.default"
          display="flex"
          justifyContent="space-between"
          paddingX={2.5}
          alignItems="center"
          position="relative"
        >
          <Button 
            variant="outlined" 
            onClick={() => changeLanguage(i18n.language === 'en' ? 'cn' : 'en')}
            sx={{
              height: "55px",
              fontSize: '1rem',
              backgroundColor: 'background.default',
              color: 'text.primary',
              borderColor: 'background.default',
              borderRadius: '50px',
                '&:hover': {
                backgroundColor: 'text.primary',
                color: 'background.default',
                borderColor: 'text.primary',
              },
            }}
          >
            <TranslateIcon sx={{ ml: 1, fontSize: '1.5rem' }} />
          </Button>
          <Box display="flex" flexDirection={"row"} alignItems={"center"}>
            <Typography variant="h6" color="text.primary" textAlign="center">
              {t('trainerGPT')}
            </Typography>
          </Box>
          <Box>
            {/* {!user ? (
              <Button
                sx={{
                  justifyContent: "end",
                  right: "2%",
                  backgroundColor: 'background.default',
                  color: 'text.primary',
                  borderColor: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'text.primary',
                    color: 'background.default',
                    borderColor: 'text.primary',
                  },
                }}
              >
                {t('signIn')}
              </Button>
            ) : (
              <Button
                sx={{
                  backgroundColor: 'background.default',
                  color: 'text.primary',
                  borderColor: 'text.primary',
                  borderWidth: 2,
                  '&:hover': {
                    backgroundColor: 'darkgray',
                    color: 'text.primary',
                    borderColor: 'text.primary',
                  },
                }}
              >
                {t('signOut')}
              </Button>
            )} */}
          </Box>
        </Box>

        <Stack
          direction="column"
          width="100vw"
          height="100%"
        >
          <Stack direction="column" spacing={2} flexGrow={1} overflow='auto' padding={2}>
            {
              messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
                >
                  {message.role === 'assistant' && (
                    <AssistantIcon sx={{ mr: 1, color: 'text.primary', fontSize: '2.5rem' }} />
                  )}
                  <Box
                    bgcolor={message.role === 'assistant' ? 'background.bubbles' : 'background.userBubble'}
                    color={message.role === 'assistant' ? "text.primary" : 'black'}
                    borderRadius={2.5}
                    p={2}
                  >
                    {message.content}
                  </Box>
                  {message.role === 'user' && (
                    <PersonIcon sx={{ ml: 1, color: 'text.primary', fontSize: '2.5rem' }} />
                  )}
                </Box>
              ))
            }
          </Stack>
          <Stack direction="row" spacing={2} padding={2} sx={{ width: '100%', bottom: 0 }}>
            <TextField
              label={t('Message')}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            ></TextField>
            <Button
              variant="outlined"
              onClick={sendMessage}
              sx={{
                color: 'text.primary',
                borderColor: 'text.primary',
                '&:hover': {
                  backgroundColor: 'text.primary',
                  color: 'background.default',
                  borderColor: 'text.primary',
                },
              }}
            >
              {t('send')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
