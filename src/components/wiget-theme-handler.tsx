
"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";

const WigetThemeHandler = () => {
  const { setTheme } = useTheme();
  const searchParams = useSearchParams();
  const agent = searchParams.get("agent")
  const requestedMode = searchParams.get("mode")
  const asciiArt = `
    /\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\
   /                                        \\
  <  (>:)              ||              (<:)  |
  >   \\ \\             /||\\             / /   >
  <    \\ \\           / || \\           / /    <
  >     \\ \\____     /  ||  \\     ____/ /     >
  <      \\____/\\   ====++====   /\\____/      <
  >           \\ \\==    ||    ==/ /           >
  <            \\====   ||   ====/            <
  >                 \\  ||  /                 >
  <  ==================++==================  <
  >                 /  ||  \\                 >
  <            /====   ||   ====\\            <
  >           / /==    ||    ==/ \\           >
  <      /____\\/   ====++====   \\/____\\      <
  >     / /----     \\  ||  /     ----\\ \\     >
  <    / /           \\ || /           \\ \\    <
  >   / /             \\||/             \\ \\   >
  <  (<:)              ||              (>:)  |
   \\                                        /
    \\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/
  `;
  useEffect(() => {
     if(!agent){
          console.log(`%c${asciiArt}`, 'font-family: monospace; color: #007799; font-weight: bold;');
console.log(
  '%c   EXPLORE GURAIDHOO AI GUIDE   ',
  'background: #007799; color: #ffffff; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
);
    return
  }
  else{
    if(requestedMode){
        setTheme(requestedMode)
    }
    else{
      
        return
    }
    

  }

  }, [agent]);

  return null;
};

export default WigetThemeHandler;