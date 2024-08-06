"use client"
import { useState } from "react"
import {Box, Stack, Typography, Button, Modal, TextField, Grid, Autocomplete, Divider} from '@mui/material'

export default function Home() {
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
  return (
    // base og box
    <Box
    width = "100vw"
    height = "100vh"
    display = "flex"
    flexDirection = "column"
    justifyContent = "center"
    alignItems = "center"
    >
      {/* outer container */}
      <Stack 
      direction = {"column"} 
      width = "100vw" 
      height = "85%" 
      // border = "1px solid black" 
      p = {2}
      // spacing = {3}
      >
        {/* messages */}
        <Stack direction = {"column"} spacing = {2} flexGrow = {1} overflow='auto' maxHeight = "100%">
          {
            messages.map((message, index) => (
              <Box
              key={index}
              display = "flex"
              justifyContent = {message.role == 'assistant' ? 'flex-start' : 'flex-end'}
              >
                <Box
                bgcolor = {message.role == 'assistant' ? 'primary.main' : 'secondary.main'}
                color = "white"
                borderRadius = {15}
                p = {2.5}
                >
                  {message.content}
                </Box>
              </Box> 
            ))}
        </Stack>
        {/* input field */}
        <Stack direction = {'row'} spacing = {2}>
          <TextField 
          label = "Message" 
          fullWidth 
          value = {message} 
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          ></TextField>
          <Button variant="contained" onClick={sendMessage}>Send</Button>

        </Stack>
      </Stack>
    </Box>
    
  );
}
