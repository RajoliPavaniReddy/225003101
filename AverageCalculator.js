const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;

let windowState = [];
const windowSize = 10;

const testServerUrls = {
  prime: 'http://20.244.56.144/test/primes',
  fibonacci: 'http://20.244.56.144/test/fibo',
  even: 'http://20.244.56.144/test/even',
  random: 'http://20.244.56.144/test/rand'
};

// Replace 'YOUR_ACCESS_TOKEN' with your actual access token
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIxMTM5NTY3LCJpYXQiOjE3MjExMzkyNjcsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjNiMDk5MGUyLTVlOGMtNDgyMC05NDljLWUyZGE4OTRkY2I3MSIsInN1YiI6IjIyNTAwMzEwMUBzYXN0cmEuYWMuaW4ifSwiY29tcGFueU5hbWUiOiJ5b3VyQ29tcGFueU5hbWUiLCJjbGllbnRJRCI6IjNiMDk5MGUyLTVlOGMtNDgyMC05NDljLWUyZGE4OTRkY2I3MSIsImNsaWVudFNlY3JldCI6Im54dGNIb2Jia0RYemhSSkciLCJvd25lck5hbWUiOiJSYWpvbGkgUGF2YW5pIFJlZGR5Iiwib3duZXJFbWFpbCI6IjIyNTAwMzEwMUBzYXN0cmEuYWMuaW4iLCJyb2xsTm8iOiIyMjUwMDMxMDEifQ.gjlOmBy3OD2hf96hrI6fj2ko4vPPIdYvNSGDR36Asqs';

const axiosInstance = axios.create({
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Middleware to handle unauthorized errors and retry once
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axiosInstance(originalRequest);
        return response;
      } catch (error) {
        throw error;
      }
    }
    throw error;
  }
);

app.get('/numbers/:numberid', async (req, res) => {
  const numberId = req.params.numberid;
  const testServerUrl = testServerUrls[numberId];
  
  if (!testServerUrl) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }
  
  try {
    const response = await axiosInstance.get(testServerUrl);
    const numbers = response.data.numbers;
    
    if (!numbers || numbers.length === 0) {
      return res.status(500).json({ error: 'No numbers received from test server' });
    }
    
    const windowPrevState = [...windowState];
    
    // Append new numbers and maintain window size
    windowState = [...new Set([...windowState, ...numbers])].slice(-windowSize);
    
    const avg = windowState.reduce((acc, num) => acc + num, 0) / windowState.length;
    
    res.json({
      numbers,
      windowPrevState,
      windowCurrState: windowState,
      avg
    });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: 'Unauthorized. Please check your access token.' });
    }
    res.status(500).json({ error: 'Error fetching data from test server' });
  }
});

app.listen(port, () => {
  console.log(`Average Calculator Microservice running on http://localhost:${port}`);
});