"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/state/store";

export default function FailPage() {
  const [accessToken] = useAtom(accessTokenAtom);
  const [data, setData] = useState<string>('');


  useEffect(() => {
    // Simulate fetching data or processing the access token
    if (accessToken) {
      const url = "http://localhost:3000/auth/profile";
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => setData(data.email))
        .catch(error => console.error('Error fetching data:', error));

    }
  }, [accessToken]);

  return (
    <div>
      <h1>Failure</h1>
      <p>There was an error processing your request.</p>
      {accessToken}

      <p>data: {data} </p>
    </div>
  );
} 
