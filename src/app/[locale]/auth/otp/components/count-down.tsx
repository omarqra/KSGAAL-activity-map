/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

function CountDown() {
  const [timeLeft, setTimeLeft] = useState(0);

  // Recalculate timer from localStorage
  const calculateTimeLeft = () => {
    const otpExpiresAtString = localStorage.getItem("otp_expires_at");
    if (!otpExpiresAtString) {
      setTimeLeft(0);
      return;
    }

    const otpExpiresAt = Number(otpExpiresAtString);
    const now = Date.now();
    const timeDifference = Math.floor((otpExpiresAt - now) / 1000);

    if (timeDifference > 0) {
      setTimeLeft(timeDifference);
    } else {
      setTimeLeft(0);
    }
  };

  useEffect(() => {
    calculateTimeLeft();

    // Listen for storage changes (for cross-tab consistency)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "otp_expires_at") {
        calculateTimeLeft();
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      calculateTimeLeft();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("otpExpiresAtUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "otpExpiresAtUpdated",
        handleCustomStorageChange
      );
    };
  }, []);

  // Countdown interval
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return <div>{formatTime(timeLeft)}</div>;
}

export default CountDown;
