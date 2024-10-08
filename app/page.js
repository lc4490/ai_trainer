"use client"
import { Box, Stack, Typography, Button, TextField, CssBaseline, ThemeProvider, useMediaQuery, FormControl, InputLabel, NativeSelect, Link } from '@mui/material'
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

// link color
const customComponents = {
  a: ({ href, children }) => (
    <Link href={href} color="lightblue" underline="hover">
      {children}
    </Link>
  ),
};

export default function Home() {
  // translation
  // declare for translation
  const { t, i18n } = useTranslation();
  // change languages
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    if (user) {
      const displayName = user.displayName || 'User';
      // const firstName = displayName.split(' ')[0]; // Extract the first name
  
      // Set the personalized welcome message
      const personalizedWelcome = t('welcome', { name: displayName });
  
      setMessages([
        { role: 'assistant', content: personalizedWelcome }
      ]);
    }
    else{
      setMessages([{ role: 'assistant', content: t('welcome', {name: t('guest')}) }]);
    }
    
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

  // sending messages
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('welcome', {name: t('guest')}) }
    ]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const sendMessage = async () => {
      if (!message.trim() || isLoading) return;
      setIsLoading(true);
    
      const userMessage = { role: 'user', content: message };
      const initialAssistantMessage = { role: 'assistant', content: '' };
    
      // Update the messages state with the user's message and an empty assistant message
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
        initialAssistantMessage,
      ]);
    
      setMessage(''); // Clear the input field
    
      try {
        // RAGS FOR LINKS
        // Extract the exercise name
        const exerciseNames = extractExerciseName(message); // Implement this as needed
        let responseContent = ``;
        for(let i = 0; i < exerciseNames.length; i++){
          let links = getYouTubeLinksForExercise(exerciseNames[i])
          responseContent += `Here are some YouTube links for ${exerciseNames[i]}: \n\n`;
          links.forEach(link => {
            responseContent += `${link}\n`;
          });
        }
    
        // Combine with AI-generated response (if applicable)
        const combinedInput = `User: ${message}\nYouTube Links: ${responseContent}`;
    
        // Generate response from the AI model
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ...messages, 
            { role: 'user', content: combinedInput },
            { role: 'assistant', content: combinedInput }
          ]),
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
    
        let assistantResponse = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          assistantResponse += text;
    
          // Update the last assistant message in the messages state
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            const updatedMessages = [
              ...prevMessages.slice(0, prevMessages.length - 1),
              { ...lastMessage, content: lastMessage.content + text },
            ];
    
            return updatedMessages;
          });
        }
    
        // Once the assistant response is complete, save the chat log
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((msg, index) =>
            index === prevMessages.length - 1 ? { ...msg, content: assistantResponse } : msg
          );
    
          if (user) {
            saveChatLog(user.uid, i18n.language, updatedMessages);
          } 
          // else {
          //   saveChatLogLocal(i18n.language, updatedMessages);
          // }
    
          return updatedMessages;
        });
      } catch (error) {
        console.error('Error:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
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
        // updateEquipment();
        setGuestMode(false);
      } else {
        setUser(null);
        setName("Guest");
        // setEquipment([]);
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
      const displayName = "guest";
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

  // custom exercise links RAG
  const exerciseData = [
    {
      name: 'Push-Up',
      youtubeLinks: [
        'https://youtu.be/IODxDxX7oi4',
        'https://youtu.be/_l3ySVKYVJ8',
      ],
    },
    {
      name: 'Squat',
      youtubeLinks: [
        'https://youtu.be/aclHkVaku9U',
        'https://youtu.be/YaXPRqUwItQ',
      ],
    },
    {
      name: 'Plank',
      youtubeLinks: [
        'https://youtu.be/BQu26ABuVS0',
        'https://youtu.be/pSHjTRCQxIw',
      ],
    },
    {
      name: 'Burpee',
      youtubeLinks: [
        'https://youtu.be/TU8QYVW0gDU',
        'https://youtu.be/JZQA08SlJnM',
      ],
    },
    {
      name: 'Lunge',
      youtubeLinks: [
        'https://youtu.be/QOVaHwm-Q6U',
        'https://youtu.be/D7KaRcUTQeE',
      ],
    },
    {
      name: 'Deadlift',
      youtubeLinks: [
        'https://youtu.be/op9kVnSso6Q',
        'https://youtu.be/r4MzxtBKyNE',
      ],
    },
    {
      name: 'Bench Press',
      youtubeLinks: [
        'https://youtu.be/gRVjAtPip0Y',
        'https://youtu.be/vthMCtgVtFw',
      ],
    },
    {
      name: 'Bicep Curl',
      youtubeLinks: [
        'https://youtu.be/ykJmrZ5v0Oo',
        'https://youtu.be/sAq_ocpRh_I',
      ],
    },
    {
      name: 'Pull-Up',
      youtubeLinks: [
        'https://youtu.be/eGo4IYlbE5g',
        'https://youtu.be/COQusflW6zA',
      ],
    },
    {
      name: 'Mountain Climber',
      youtubeLinks: [
        'https://youtu.be/1w9VuNgBnAQ',
        'https://youtu.be/cnyTQDSE884',
      ],
    },
    {
      name: 'Tricep Dip',
      youtubeLinks: [
        'https://www.youtube.com/watch?v=6kALZikXxLc',
        'https://www.youtube.com/watch?v=89_spgcdQlw',
        // n-sync
        'https://www.youtube.com/watch?v=Eo-KmOd3i7s',
      ],
    },
  ];
  const getYouTubeLinksForExercise = (exerciseName) => {
    const exercise = exerciseData.find(
      (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
  
    if (exercise) {
      return exercise.youtubeLinks;
    } else {
      return [];
    }
  };
  const extractExerciseName = (message) => {
    let ret = []
    // Convert the message to lowercase for case-insensitive matching
    const lowerCaseMessage = message.toLowerCase();
  
    // Iterate through the exerciseData array to find a matching exercise name
    for (let i = 0; i < exerciseData.length; i++) {
      const exercise = exerciseData[i];
      const exerciseName = exercise.name.toLowerCase();
  
      // Check if the exercise name exists in the message
      if (lowerCaseMessage.includes(exerciseName)) {
        ret.push(exercise.name); // Return the original case-sensitive exercise name
      }
    }
  
    // If no match is found, return null or an empty string
    return ret;
  };

  // save chat logs function
  const saveChatLog = async (userId, languageCode, messages) => {
    try {
      const docRef = doc(firestore, 'chatLogs', userId, 'languages', languageCode);
      await setDoc(docRef, {
        messages: messages,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving chat log:", error);
    }
  };  
  // loading chat logs
  const loadChatLog = async (userId, languageCode) => {
    try {
      const docRef = doc(firestore, 'chatLogs', userId, 'languages', languageCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages);
      } else {
        if (user) {
          const displayName = user.displayName || 'User';
          const personalizedWelcome = t('welcome', { name: displayName });
      
          setMessages([
            { role: 'assistant', content: personalizedWelcome }
          ]);
        } else {
          setMessages([{ role: 'assistant', content: t('welcome', { name: t('guest') }) }]);
        }
      }
    } catch (error) {
      console.error("Error loading chat log:", error);
    }
  };  
  // clear chat log
  const clearChatLog = async () => {
    try {
      const docRef = doc(firestore, 'chatLogs', user.uid, 'languages', i18n.language);
      await deleteDoc(docRef);
  
      if (user) {
        const displayName = user.displayName || 'User';
        const personalizedWelcome = t('welcome', { name: displayName });
    
        setMessages([
          { role: 'assistant', content: personalizedWelcome }
        ]);
      } else {
        setMessages([{ role: 'assistant', content: t('welcome', { name: t('guest') }) }]);
      }
    } catch (error) {
      console.error("Error clearing chat log:", error);
    }
  };
  

  // // chat logging guest
  // const saveChatLogLocal = (languageCode, messages) => {
  //   localStorage.setItem(`chatLog_${languageCode}`, JSON.stringify(messages));
  // };
  // // chat loading guest
  // const loadChatLogLocal = (languageCode) => {
  //   const savedMessages = localStorage.getItem(`chatLog_${languageCode}`);
  //   if (savedMessages) {
  //     setMessages(JSON.parse(savedMessages));
  //   } else {
  //     if (user) {
  //       const displayName = user.displayName || 'User';
  //       const personalizedWelcome = t('welcome', { name: displayName });
    
  //       setMessages([
  //         { role: 'assistant', content: personalizedWelcome }
  //       ]);
  //     }
  //     else{
  //       setMessages([{ role: 'assistant', content: t('welcome', {name: t('guest')}) }]);
  //     }
  //   }
  // };
  // // clear chat log guest
  // const clearChatLogLocal = () => {
  //   localStorage.removeItem(`chatLog_${i18n.language}`);
  //   if (user) {
  //     const displayName = user.displayName || 'User';
  //     const personalizedWelcome = t('welcome', { name: displayName });
  
  //     setMessages([
  //       { role: 'assistant', content: personalizedWelcome }
  //     ]);
  //   }
  //   else{
  //     setMessages([{ role: 'assistant', content: t('welcome', {name: t('guest')}) }]);
  //   }
  // };

  // if user change or language change
  useEffect(() => {
    if (user) {
      loadChatLog(user.uid, i18n.language);
    } 
    // else {
    //   loadChatLogLocal(i18n.language);
    // }
  }, [user, i18n.language]);
  
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
          paddingY={2.5}
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
                    paddingX={3.5}
                    paddingY={2.5}
                    sx={{
                      maxWidth: '75%', // Ensure the box doesn't take up the entire width
                      wordBreak: 'break-word', // Break long words to avoid overflow
                      // whiteSpace: "balance", // Preserve whitespace and line breaks, but wrap text
                      overflowWrap: 'break-word', // Break long words
                    }}
                  >
                    <ReactMarkdown components={customComponents}>{message.content}</ReactMarkdown>
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
            {/* clear history */}
            <Button onClick={clearChatLog} 
            variant="outlined" 
            sx={{
              color: 'text.primary',
              borderColor: 'text.primary',
              '&:hover': {
                backgroundColor: 'text.primary',
                color: 'background.default',
                borderColor: 'text.primary',
              },
            }}>
              {t('clear')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
