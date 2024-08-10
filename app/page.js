"use client"
import { Box, Stack, Typography, Button, TextField, CssBaseline, ThemeProvider, useMediaQuery, FormControl, InputLabel, NativeSelect } from '@mui/material'
import { useEffect, useState } from 'react'
// light/dark mode
import { createTheme } from '@mui/material';
// import icons
import PersonIcon from '@mui/icons-material/Person';
import AssistantIcon from '@mui/icons-material/Assistant';
// translations
import { useTranslation } from 'react-i18next';
import i18n from './i18n'; // Adjust the path as necessary
// use googlesignin
import { firestore, auth, provider, signInWithPopup, signOut } from '@/firebase'
import { collection, getDocs, query, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
// linebreaks
import ReactMarkdown from 'react-markdown';

// light/dark themes
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
  // translation
  // declare for translation
  const { t, i18n } = useTranslation();
  // change languages
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setMessages([{ role: 'assistant', content: t('welcome') }]);
  };
  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    changeLanguage(newLanguage);
  };
  // detect light/dark mode, set light dark mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);
  const theme = darkMode ? darkTheme : lightTheme;

  // gym equipment
  const [equipment, setEquipment] = useState([])
  // update equipment based on firebase
  const updateEquipment = async () => {
    if (auth.currentUser) {
      console.log("User is authenticated, updating equipment...");
      const userUID = auth.currentUser.uid;
      const snapshot = query(collection(firestore, `equipment_${userUID}`));
      const docs = await getDocs(snapshot);
      console.log("Docs fetched:", docs.docs);
      const equipment = [];
      docs.forEach((doc) => {
        console.log("Doc data:", doc.data());
        equipment.push({ name: doc.id, ...doc.data() });
      });
      setEquipment(equipment);
      console.log("Equipment set:", equipment);
    } else {
      console.log("User is not authenticated.");
    }
  };
  useEffect(() => {
    updateEquipment()
  }, [])

  // sending messages
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
      // RAG implementation
      // extract name
      let username;
      if(user){
        username = user.displayName.split(' ')
      }
      else{
        username = "Guest"
      }
      console.log(equipment)
      let relevantText;
      if(equipment.length> 0){
        relevantText = equipment.map(eq => `${eq.name}`).join("\n");
      }
      else{
        relevantText="None"
      }

      // Combine user message with retrieved information
      const combinedInput = `This is the user's name: ${username}This is the equipment available: ${relevantText}\n`;

      // Generate response from the AI model
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { 
          role: 'user', content: `User: ${message}`,
          role: 'assistant', content: combinedInput,
        }]),
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
  // google auth
  // sign in function for google auth
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in:', user);
      setGuestMode(false); // Disable guest mode on successful sign-in
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Sign in failed: ' + error.message);
    }
  };
  // sign out function for google auth
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
      setUser(null);
      setGuestMode(true); // Enable guest mode on sign-out
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Sign out failed: ' + error.message);
    }
  };

  // declareables for user and guest mode
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [name, setName] = useState(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setName(user.displayName);
        updateEquipment();
        setGuestMode(false);
      } else {
        setUser(null);
        setName("Guest");
        setEquipment([]);
        setGuestMode(true);
      }
    });
    return () => unsubscribe();
  }, []);
  // change welcome message based on custom user
  useEffect(() => {
    if (user) {
      const displayName = " " + user.displayName || 'User';
      // const firstName = displayName.split(' ')[0]; // Extract the first name
  
      // Set the personalized welcome message
      const personalizedWelcome = t('welcome', { name: displayName });
  
      setMessages([
        { role: 'assistant', content: personalizedWelcome }
      ]);
    }
    else{
      const displayName = "";
      // const firstName = displayName.split(' ')[0]; // Extract the first name
  
      // Set the personalized welcome message
      const personalizedWelcome = t('welcome', { name: displayName });
  
      setMessages([
        { role: 'assistant', content: personalizedWelcome }
      ]);
    }
  }, [user]); // This useEffect will run whenever the user state changes

  // scroll chat down as search
  useEffect(() => {
    const chatLog = document.querySelector('.chat-log');
    if (chatLog) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }, [messages]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* og box */}
      <Box
        width="100vw"
        height="90vh"
        display="flex"
        flexDirection="column"
      >
        {/* header box */}
        <Box
          height="10%"
          bgcolor="background.default"
          display="flex"
          justifyContent="space-between"
          paddingX={2.5}
          alignItems="center"
          position="relative"
        >
          {/* language control  */}
          <FormControl
          sx={{
            width: '85px', // Adjust the width value as needed
          }}
          >
            
            <InputLabel variant="standard" htmlFor="uncontrolled-native">
              {t('language')}
            </InputLabel>
            <NativeSelect
              defaultValue={'en'}
              onChange={handleLanguageChange}
              inputProps={{
                name: t('language'),
                id: 'uncontrolled-native',
              }}
              sx={{
                '& .MuiNativeSelect-select': {
                  '&:focus': {
                    backgroundColor: 'transparent',
                  },
                },
                '&::before': {
                  borderBottom: 'none',
                },
                '&::after': {
                  borderBottom: 'none',
                },
              }}
              disableUnderline
            >
              <option value="en">English</option>
              <option value="cn">中文（简体）</option>
              <option value="tc">中文（繁體）</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="jp">日本語</option>
              <option value="kr">한국어</option>
            </NativeSelect>
          </FormControl>
          {/* <Button>Equipment</Button> */}
          {/* title */}
          <Box display="flex" flexDirection={"row"} alignItems={"center"}>
            <Typography variant="h6" color="text.primary" textAlign="center">
              {t('trainerGPT')}
            </Typography>
          </Box>
          {/* signIn/signOut Form */}
          <Box>
            {!user ? (
              <Button
                onClick={handleSignIn}
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
              onClick={handleSignOut}
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
            )}
          </Box>
        </Box>

        {/* chat */}
        <Stack
          direction="column"
          width="100vw"
          height="100%"
        >
          {/* previous messages log */}

          <Stack direction="column" spacing={2} flexGrow={1} overflow='auto' padding={2} className = "chat-log">
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
                    borderRadius={3.5}
                    p={3.5}
                    sx={{
                      maxWidth: '75%', // Ensure the box doesn't take up the entire width
                      wordBreak: 'break-word', // Break long words to avoid overflow
                      // whiteSpace: "balance", // Preserve whitespace and line breaks, but wrap text
                      overflowWrap: 'break-word', // Break long words
                    }}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Box>
                  {message.role === 'user' && (
                    <PersonIcon sx={{ ml: 1, color: 'text.primary', fontSize: '2.5rem' }} />
                  )}
                </Box>
              ))
            }
          </Stack>
          {/* input field */}
          <Stack direction="row" spacing={2} padding={2} sx={{ width: '100%', bottom: 0 }}>
            <TextField
              label={t('Message')}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            ></TextField>
            {/* send button */}
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
