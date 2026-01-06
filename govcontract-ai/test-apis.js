#!/usr/bin/env node

// Test script to verify SAM.gov API functionality
const https = require('https');
const url = require('url');

const API_KEY = 'rsjmDkabKqAtF6bdeSLqXYfOwcFV3TlFvO1fNsgW';

function testSamGovAPI() {
  const params = new URLSearchParams({
    api_key: API_KEY,
    limit: '5',
    offset: '0',
    postedFrom: '01/01/2024',
    postedTo: new Date().toLocaleDateString('en-US'),
    keyword: 'software'
  });

  const apiUrl = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
  
  console.log('Testing SAM.gov API...');
  console.log('URL:', apiUrl);
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'GovContractAI/1.0',
    },
  };

  const req = https.request(apiUrl, options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Success! Found', result.totalRecords, 'opportunities');
        console.log('Sample opportunity:', result.opportunitiesData?.[0]?.title || 'None');
      } catch (e) {
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

function testGrantsGovAPI() {
  const params = new URLSearchParams({
    format: 'json',
    rows: '5',
    start: '0',
    oppTitle: 'technology'
  });

  const apiUrl = `https://www.grants.gov/grantsws/rest/opportunities/search/?${params.toString()}`;
  
  console.log('\nTesting Grants.gov API...');
  console.log('URL:', apiUrl);
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'GovContractAI/1.0',
    },
  };

  const req = https.request(apiUrl, options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Success! Found', result.totalRecords, 'grant opportunities');
        console.log('Sample grant:', result.opportunity?.[0]?.opportunityTitle || 'None');
      } catch (e) {
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

// Run tests
testSamGovAPI();
setTimeout(testGrantsGovAPI, 2000);
