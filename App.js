import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimerApp = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const loadTimerState = async () => {
      const savedStartTime = await AsyncStorage.getItem('startTime');
      const savedElapsedTime = await AsyncStorage.getItem('elapsedTime');
      const savedIsRunning = await AsyncStorage.getItem('isRunning');

      if (savedElapsedTime) {
        setElapsedTime(parseInt(savedElapsedTime, 10));
      }

      if (savedStartTime && savedIsRunning === 'true') {
        const startUnix = parseInt(savedStartTime, 10);
        const now = Date.now();
        setElapsedTime(prev => prev + (now - startUnix)); // Add time since last start
        setStartTime(now);
        setIsRunning(true);
      }
    };
    loadTimerState();
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prevElapsedTime => prevElapsedTime + 10);
      }, 10);
    } else {
      clearInterval(interval);
    }
    AsyncStorage.setItem('elapsedTime', elapsedTime.toString());
    AsyncStorage.setItem('isRunning', isRunning.toString());
    setShowReset(elapsedTime > 0);
    return () => clearInterval(interval);
  }, [isRunning, elapsedTime]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        const savedStartTime = await AsyncStorage.getItem('startTime');
        const savedIsRunning = await AsyncStorage.getItem('isRunning');

        if (savedIsRunning === 'true' && savedStartTime) {
          const now = Date.now();
          const startUnix = parseInt(savedStartTime, 10);
          setElapsedTime(prev => prev + (now - startUnix));
          setStartTime(now);
          setIsRunning(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleStartPause = async () => {
    if (isRunning) {
      setIsRunning(false);
      await AsyncStorage.setItem('elapsedTime', elapsedTime.toString());
      await AsyncStorage.removeItem('startTime');
    } else {
      const now = Date.now();
      setStartTime(now);
      setIsRunning(true);
      await AsyncStorage.setItem('startTime', now.toString());
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    setElapsedTime(0);
    setStartTime(null);
    setShowReset(false);
    await AsyncStorage.removeItem('startTime');
    await AsyncStorage.removeItem('elapsedTime');
    await AsyncStorage.removeItem('isRunning');
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = (time % 1000).toString().padStart(3, '0');
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        <TouchableOpacity style={styles.button} onPress={handleStartPause}>
          <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        {showReset && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#808080', marginTop: 10 }]} onPress={resetTimer}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
  },
});

export default TimerApp;
