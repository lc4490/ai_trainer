"use client"
import {Box, Stack, Typography, Button, Modal, TextField, Grid, Autocomplete, Divider} from '@mui/material'
import { useEffect, useState, useRef } from 'react'

// theme imports
import { createTheme, ThemeProvider, useTheme, CssBaseline, useMediaQuery, IconButton } from '@mui/material';

// icon imports
import {Person, Assistant, Translate } from '@mui/icons-material';

// use googlesignin
// import { onAuthStateChanged } from 'firebase/auth';

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
  // toggle dark mode
  // Detect user's preferred color scheme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  // Update dark mode state when the user's preference changes
  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);
  const theme = darkMode ? darkTheme : lightTheme;

  // messages
  const [messages, setMessages] = useState([
    {role : 'assistant', content: 'Hi! I am your AI gym trainer. How can I help you today?'}
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // send messages
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)
  
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })
  
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  // google auth
  // sign in function for google auth
  // const handleSignIn = async () => {
  //   try {
  //     const result = await signInWithPopup(auth, provider);
  //     const user = result.user;
  //     console.log('User signed in:', user);
  //     setGuestMode(false); // Disable guest mode on successful sign-in
  //   } catch (error) {
  //     console.error('Error signing in:', error);
  //     alert('Sign in failed: ' + error.message);
  //   }
  // };
  // // sign out function for google auth
  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     console.log('User signed out');
  //     setUser(null);
  //     setGuestMode(true); // Enable guest mode on sign-out
  //     setPantry([]); // Clear guest data
  //     setRecipes([]); // Clear guest data
  //   } catch (error) {
  //     console.error('Error signing out:', error);
  //     alert('Sign out failed: ' + error.message);
  //   }
  // };
  // // declareables for user and guest mode
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       setUser(user);
  //       setGuestMode(false);
  //       updatePantry();
  //     } else {
  //       setUser(null);
  //       setGuestMode(true);
  //       setPantry([]);
  //       setRecipes([]);
  //     }
  //   });
  //   return () => unsubscribe();
  // }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* // base og box */}
      <Box
      width = "100vw"
      height = "90vh"
      display = "flex"
      flexDirection = "column"
      // justifyContent = "center"
      // alignItems = "center"
      >
      {/* header including add button, title, sign in */}
      <Box 
          height="10%" 
          bgcolor="background.default"
          display="flex"
          justifyContent="space-between"
          paddingX={2.5}
          alignItems="center"
          position="relative"
        >
          {/* add button */}
          <Button 
            variant="outlined" 
            // onClick={handleOpenAddAndOpenCamera}
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
            <Translate sx={{ ml: 1, fontSize: '1.5rem' }} />
          </Button>
          {/* title */}
          <Box display = "flex" flexDirection={"row"} alignItems={"center"}>
            <Typography variant="h6" color="text.primary" textAlign="center">
              TrainerGPT
            </Typography>
          </Box>
          {/* sign in */}
          <Box>
            {!user ? (
              <Button 
                // onClick={handleSignIn}
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
                Sign In
              </Button>
            ) : (
              <Button 
                // onClick={handleSignOut}
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
                Sign Out
              </Button>
            )}
          </Box>
        </Box>

      {/* outer container */}
      <Stack 
      direction = {"column"} 
      width = "100vw" 
      height = "100%" 
      // border = "1px solid black" 
      // spacing = {3}
      >
        {/* messages */}
        <Stack direction = {"column"} spacing = {2} flexGrow = {1} overflow='auto' padding = {2}>
          {
            messages.map((message, index) => (
              <Box
              key={index}
              display = "flex"
              justifyContent = {message.role == 'assistant' ? 'flex-start' : 'flex-end'}
              >
                {message.role === 'assistant' && (
                <Assistant sx={{ mr: 1, color: 'text.primary', fontSize: '2.5rem'}} />
              )}
                <Box
                bgcolor = {message.role == 'assistant' ? 'background.bubbles' : 'background.userBubble'}
                color = {message.role == 'assistant' ? "text.primary" : 'black'}
                borderRadius = {2.5}
                p = {2}
                >
                  {message.content}
                </Box>
                {message.role === 'user' && (
                <Person sx={{ ml: 1, color: 'text.primary', fontSize: '2.5rem' }} />
              )}
              </Box> 
            ))}
        </Stack>
        {/* input field */}
        <Stack direction = {'row'} spacing = {2} padding = {2}
        sx={{ width: '100%', bottom: 0}}
        >
          <TextField 
          label = "Message" 
          fullWidth 
          value = {message} 
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
          >Send</Button>

        </Stack>
      </Stack>
      </Box>
    </ThemeProvider>
  );
}
